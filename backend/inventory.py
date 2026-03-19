from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timedelta
from extensions import mysql

inventory_bp = Blueprint('inventory', __name__)


def _next_id(cursor, table_name, id_column):
    cursor.execute(f"SELECT IFNULL(MAX({id_column}), 0) + 1 FROM {table_name}")
    row = cursor.fetchone()
    return int(row[0]) if row and row[0] is not None else 1


def _ensure_product_price_levels_table(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS PRODUCT_PRICE_LEVELS (
            level_id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            level_no INT NOT NULL,
            level_label VARCHAR(100) NOT NULL,
            level_purpose VARCHAR(255) NOT NULL,
            price_value DECIMAL(10, 2) NOT NULL,
            is_default BOOLEAN NOT NULL DEFAULT FALSE,
            UNIQUE KEY uq_product_level (product_id, level_no),
            CONSTRAINT fk_product_price_levels_product
                FOREIGN KEY (product_id) REFERENCES PRODUCTS(product_id)
                ON DELETE CASCADE
        )
        """
    )


# GET ALL PRODUCTS
@inventory_bp.route('/get-all-products', methods=['GET'])
@jwt_required()
def get_all_products():
    cur = mysql.connection.cursor()
    try:
      
        sql = """
            SELECT product_id, product_name_official 
            FROM PRODUCTS 
            ORDER BY product_name_official ASC
        """
        cur.execute(sql)
        products = cur.fetchall()

       
        product_list = []
        for prod in products:
            product_list.append({
                "product_id": prod[0],
                "product_name_official": prod[1]
                
            })

        return jsonify(product_list), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

# ROUTE: FOR INVENTORY

#get all inventory
@inventory_bp.route('/inventory/branch/<int:branch_id>', methods=['GET'])
@jwt_required()
def get_branch_inventory(branch_id):
    cur = mysql.connection.cursor()
    try:
        category_filter = request.args.get('category', '').strip().upper()

        sql = """
            SELECT 
                bi.inventory_id,
                p.product_id,
                p.product_name_official,
                p.category_type,
                COALESCE(
                    MAX(
                        CASE
                            WHEN pb.is_primary = TRUE
                                 AND pb.barcode_value IS NOT NULL
                                 AND TRIM(pb.barcode_value) NOT IN ('', '-', '—', 'N/A', 'NA', 'NONE')
                                 AND TRIM(pb.barcode_value) REGEXP '[0-9A-Za-z]'
                            THEN TRIM(pb.barcode_value)
                        END
                    ),
                    MIN(
                        CASE
                            WHEN pb.barcode_value IS NOT NULL
                                 AND TRIM(pb.barcode_value) NOT IN ('', '-', '—', 'N/A', 'NA', 'NONE')
                                 AND TRIM(pb.barcode_value) REGEXP '[0-9A-Za-z]'
                            THEN TRIM(pb.barcode_value)
                        END
                    )
                ) AS barcode_value,
                bi.batch_number,
                bi.expiry_date,
                bi.quantity_on_hand,
                p.price_regular,
                g.gondola_code
            FROM BRANCH_INVENTORY bi
            JOIN PRODUCTS p ON bi.product_id = p.product_id
            LEFT JOIN PRODUCT_BARCODES pb ON p.product_id = pb.product_id
            LEFT JOIN GONDOLAS g ON bi.gondola_id = g.gondola_id
            WHERE bi.branch_id = %s
        """

        params = [branch_id]
        if category_filter:
            sql += " AND p.category_type = %s"
            params.append(category_filter)

        sql += """
            GROUP BY
                bi.inventory_id,
                p.product_id,
                p.product_name_official,
                p.category_type,
                bi.batch_number,
                bi.expiry_date,
                bi.quantity_on_hand,
                p.price_regular,
                g.gondola_code
            ORDER BY p.product_name_official ASC, bi.expiry_date ASC
        """
        cur.execute(sql, tuple(params))
        inventory_items = cur.fetchall()

        inventory_list = []
        for item in inventory_items:
            inventory_list.append({
                "inventory_id": item[0],
                "product_id": item[1],
                "product_name": item[2],
                "product_name_official": item[2],
                "category": item[3],
                "barcode": item[4],
                "barcode_value": item[4],
                "batch_number": item[5],
                # Dates need to be converted to strings for JSON formatting
                "expiry_date": item[6].strftime('%Y-%m-%d') if item[6] else None,
                "quantity_on_hand": item[7],
                "price": float(item[8]) if item[8] else 0.00,
                "gondola_code": item[9],
            })

        return jsonify(inventory_list), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()


@inventory_bp.route('/inventory/branch/<int:branch_id>/gondolas', methods=['GET'])
@jwt_required()
def get_branch_gondolas(branch_id):
    cur = mysql.connection.cursor()
    try:
        cur.execute(
            """
            SELECT gondola_code
            FROM GONDOLAS
            WHERE branch_id = %s
            ORDER BY gondola_code ASC
            """,
            (branch_id,)
        )
        rows = cur.fetchall()
        return jsonify({
            "branch_id": branch_id,
            "gondolas": [r[0] for r in rows if r[0]]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()


@inventory_bp.route('/products/<int:product_id>/details', methods=['GET'])
@jwt_required()
def get_product_details(product_id):
    claims = get_jwt()
    role = claims.get('role')
    if role not in ['admin', 'manager']:
        return jsonify({"message": "Access Denied"}), 403

    branch_id = request.args.get('branch_id', type=int) or claims.get('branch')

    cur = mysql.connection.cursor()
    try:
        _ensure_product_price_levels_table(cur)

        cur.execute(
            """
            SELECT
                p.product_id,
                p.product_name_official,
                p.product_name_receipt,
                p.price_regular,
                p.price_box_wholesale,
                p.price_senior_pwd,
                p.is_active,
                p.is_vat_exempt,
                p.category_type,
                COALESCE(
                    MAX(CASE WHEN pb.is_primary = TRUE THEN pb.barcode_value END),
                    MIN(pb.barcode_value)
                ) AS barcode_value
            FROM PRODUCTS p
            LEFT JOIN PRODUCT_BARCODES pb ON pb.product_id = p.product_id
            WHERE p.product_id = %s
            GROUP BY
                p.product_id,
                p.product_name_official,
                p.product_name_receipt,
                p.price_regular,
                p.price_box_wholesale,
                p.price_senior_pwd,
                p.is_active,
                p.is_vat_exempt,
                p.category_type
            """,
            (product_id,)
        )
        product = cur.fetchone()
        if not product:
            return jsonify({"message": "Product not found."}), 404

        cur.execute(
            """
            SELECT
                bi.reorder_level,
                bi.target_stock_level,
                g.gondola_code
            FROM BRANCH_INVENTORY bi
            LEFT JOIN GONDOLAS g ON g.gondola_id = bi.gondola_id
            WHERE bi.branch_id = %s AND bi.product_id = %s
            ORDER BY bi.quantity_on_hand DESC, bi.inventory_id ASC
            LIMIT 1
            """,
            (branch_id, product_id)
        )
        inv = cur.fetchone()

        cur.execute(
            """
            SELECT level_no, level_label, level_purpose, price_value, is_default
            FROM PRODUCT_PRICE_LEVELS
            WHERE product_id = %s
            ORDER BY level_no ASC
            """,
            (product_id,)
        )
        level_rows = cur.fetchall()

        if level_rows:
            pricing_levels = [
                {
                    "level_no": int(r[0]),
                    "label": r[1],
                    "purpose": r[2],
                    "price": float(r[3]),
                    "is_default": bool(r[4]),
                }
                for r in level_rows
            ]
        else:
            pricing_levels = [
                {
                    "level_no": 1,
                    "label": "Retail",
                    "purpose": "Default retail price",
                    "price": float(product[3] or 0),
                    "is_default": True,
                },
                {
                    "level_no": 2,
                    "label": "Wholesale",
                    "purpose": "Box/wholesale price",
                    "price": float(product[4] or 0),
                    "is_default": True,
                },
                {
                    "level_no": 3,
                    "label": "Senior/PWD",
                    "purpose": "Discounted price",
                    "price": float(product[5] or 0),
                    "is_default": True,
                },
            ]

        cur.execute(
            """
            SELECT
                psl.link_id,
                s.supplier_id,
                s.supplier_name,
                psl.cost_per_unit
            FROM PRODUCT_SUPPLIER_LINK psl
            JOIN SUPPLIERS s ON s.supplier_id = psl.supplier_id
            WHERE psl.product_id = %s
            ORDER BY s.supplier_name ASC
            """,
            (product_id,)
        )
        supplier_rows = cur.fetchall()
        suppliers = [
            {
                "link_id": int(r[0]),
                "supplier_id": int(r[1]),
                "name": r[2],
                "cost_per_unit": float(r[3] or 0),
            }
            for r in supplier_rows
        ]

        return jsonify({
            "product_id": int(product[0]),
            "long_description": product[1] or "",
            "short_description": product[2] or "",
            "price_regular": float(product[3] or 0),
            "price_wholesale": float(product[4] or 0),
            "price_senior": float(product[5] or 0),
            "is_active": bool(product[6]),
            "taxable": not bool(product[7]),
            "category_type": product[8] or "",
            "barcode": product[9] or "",
            "branch_id": int(branch_id),
            "gondola_code": inv[2] if inv else "",
            "reorder_level": int(inv[0]) if inv and inv[0] is not None else 0,
            "target_stock_level": int(inv[1]) if inv and inv[1] is not None else 0,
            "pricing_levels": pricing_levels,
            "suppliers": suppliers,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()


@inventory_bp.route('/products/<int:product_id>/details', methods=['PUT'])
@jwt_required()
def update_product_details(product_id):
    claims = get_jwt()
    role = claims.get('role')
    if role not in ['admin', 'manager']:
        return jsonify({"message": "Access Denied"}), 403

    data = request.get_json(silent=True) or {}
    branch_id = data.get('branch_id') or claims.get('branch')

    long_description = (data.get('long_description') or '').strip()
    short_description = (data.get('short_description') or '').strip()
    item_code = (data.get('item_code') or '').strip()
    gondola_code = (data.get('gondola_code') or '').strip()

    price_regular = float(data.get('price_regular') or 0)
    price_wholesale = float(data.get('price_wholesale') or 0)
    price_senior = float(data.get('price_senior') or 0)

    is_active = bool(data.get('is_active', True))
    taxable = bool(data.get('taxable', True))
    category_type = (data.get('category_type') or '').strip().upper()
    if category_type not in ['MEDICINE', 'GROCERY', 'EQUIPMENT']:
        category_type = 'EQUIPMENT'

    reorder_level = int(data.get('reorder_level') or 0)
    target_stock_level = int(data.get('target_stock_level') or 0)

    pricing_levels = data.get('pricing_levels') if isinstance(data.get('pricing_levels'), list) else []
    suppliers = data.get('suppliers') if isinstance(data.get('suppliers'), list) else []

    if not long_description:
        return jsonify({"message": "long_description is required."}), 400

    cur = mysql.connection.cursor()
    try:
        _ensure_product_price_levels_table(cur)

        cur.execute("SELECT product_id FROM PRODUCTS WHERE product_id = %s", (product_id,))
        if not cur.fetchone():
            return jsonify({"message": "Product not found."}), 404

        cur.execute(
            """
            UPDATE PRODUCTS
            SET
                product_name_official = %s,
                product_name_receipt = %s,
                price_regular = %s,
                price_box_wholesale = %s,
                price_senior_pwd = %s,
                is_active = %s,
                is_vat_exempt = %s,
                category_type = %s
            WHERE product_id = %s
            """,
            (
                long_description,
                short_description or long_description[:255],
                price_regular,
                price_wholesale,
                price_senior,
                is_active,
                not taxable,
                category_type,
                product_id,
            )
        )

        if item_code:
            cur.execute(
                """
                SELECT barcode_id
                FROM PRODUCT_BARCODES
                WHERE product_id = %s AND is_primary = TRUE
                LIMIT 1
                """,
                (product_id,)
            )
            primary_barcode = cur.fetchone()
            if primary_barcode:
                cur.execute(
                    "UPDATE PRODUCT_BARCODES SET barcode_value = %s WHERE barcode_id = %s",
                    (item_code, primary_barcode[0])
                )
            else:
                barcode_id = _next_id(cur, 'PRODUCT_BARCODES', 'barcode_id')
                cur.execute(
                    """
                    INSERT INTO PRODUCT_BARCODES (barcode_id, product_id, barcode_value, barcode_type, is_primary)
                    VALUES (%s, %s, %s, 'UNIT', TRUE)
                    """,
                    (barcode_id, product_id, item_code)
                )

        if branch_id and gondola_code:
            cur.execute(
                "SELECT gondola_id FROM GONDOLAS WHERE branch_id = %s AND gondola_code = %s LIMIT 1",
                (branch_id, gondola_code)
            )
            gondola = cur.fetchone()
            if not gondola:
                return jsonify({"message": f"Gondola '{gondola_code}' not found for branch {branch_id}."}), 400

            cur.execute(
                """
                UPDATE BRANCH_INVENTORY
                SET gondola_id = %s, reorder_level = %s, target_stock_level = %s
                WHERE branch_id = %s AND product_id = %s
                """,
                (gondola[0], reorder_level, target_stock_level, branch_id, product_id)
            )

        cur.execute("DELETE FROM PRODUCT_PRICE_LEVELS WHERE product_id = %s", (product_id,))
        normalized_levels = []
        for raw in pricing_levels:
            if not isinstance(raw, dict):
                continue
            try:
                level_no = int(raw.get('level_no'))
            except Exception:
                continue
            if level_no <= 0:
                continue
            label = str(raw.get('label') or f'Level {level_no}').strip()[:100]
            purpose = str(raw.get('purpose') or 'Custom pricing').strip()[:255]
            price_value = float(raw.get('price') or 0)
            normalized_levels.append((level_no, label, purpose, price_value, level_no <= 3))

        if not normalized_levels:
            normalized_levels = [
                (1, 'Retail', 'Default retail price', price_regular, True),
                (2, 'Wholesale', 'Box/wholesale price', price_wholesale, True),
                (3, 'Senior/PWD', 'Discounted price', price_senior, True),
            ]

        for level_no, label, purpose, price_value, is_default in sorted(normalized_levels, key=lambda x: x[0]):
            cur.execute(
                """
                INSERT INTO PRODUCT_PRICE_LEVELS (product_id, level_no, level_label, level_purpose, price_value, is_default)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (product_id, level_no, label, purpose, price_value, is_default)
            )

        cur.execute("DELETE FROM PRODUCT_SUPPLIER_LINK WHERE product_id = %s", (product_id,))
        for supplier in suppliers:
            if not isinstance(supplier, dict):
                continue
            supplier_name = str(supplier.get('name') or '').strip()
            if not supplier_name:
                continue
            cost_per_unit = float(supplier.get('cost_per_unit') or 0)

            cur.execute(
                "SELECT supplier_id FROM SUPPLIERS WHERE supplier_name = %s LIMIT 1",
                (supplier_name,)
            )
            existing_supplier = cur.fetchone()
            if existing_supplier:
                supplier_id = int(existing_supplier[0])
            else:
                supplier_id = _next_id(cur, 'SUPPLIERS', 'supplier_id')
                cur.execute(
                    "INSERT INTO SUPPLIERS (supplier_id, supplier_name) VALUES (%s, %s)",
                    (supplier_id, supplier_name)
                )

            link_id = _next_id(cur, 'PRODUCT_SUPPLIER_LINK', 'link_id')
            cur.execute(
                """
                INSERT INTO PRODUCT_SUPPLIER_LINK (link_id, product_id, supplier_id, cost_per_unit)
                VALUES (%s, %s, %s, %s)
                """,
                (link_id, product_id, supplier_id, cost_per_unit)
            )

        mysql.connection.commit()
        return jsonify({"message": "Product details updated successfully."}), 200
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()


# ROUTE: ADD PRODUCT TO SHELF	
@inventory_bp.route('/inventory/add-products', methods=['POST'])
@jwt_required()
def add_product_to_shelf():
    current_user_id = get_jwt_identity() 
    claims = get_jwt()
    current_branch_id = claims['branch'] 

    data = request.json
    product_id = data.get('product_id')
    gondola_code = data.get('gondola_code')
    batch_number = data.get('batch_number')
    expiry_date = data.get('expiry_date')
    quantity = data.get('quantity')

    if not all([product_id, gondola_code, batch_number, expiry_date, quantity]):
        return jsonify({"message": "Missing required fields"}), 400

    cur = mysql.connection.cursor()
    try:
        cur.execute("SELECT gondola_id FROM GONDOLAS WHERE gondola_code = %s AND branch_id = %s", (gondola_code, current_branch_id))
        gondola = cur.fetchone()
        if not gondola:
            return jsonify({"message": f"Gondola '{gondola_code}' not found."}), 404
        gondola_id = gondola[0]

        # INSERT INTO INVENTORY
        sql_insert = """
            INSERT INTO BRANCH_INVENTORY 
            (branch_id, product_id, gondola_id, reorder_level, target_stock_level, batch_number, expiry_date, quantity_on_hand)
            VALUES (%s, %s, %s, 10, 100, %s, %s, %s)
        """
        cur.execute(sql_insert, (current_branch_id, product_id, gondola_id, batch_number, expiry_date, quantity))
        
        # Get the ID of the new inventory record to link the adjustment
        inventory_id = cur.lastrowid

        # LOG THE AUDIT TRAIL (STOCK ADJUSTMENT)
        sql_audit = """
            INSERT INTO STOCK_ADJUSTMENTS (inventory_id, user_id, adjustment_type, quantity_adjusted, date_adjusted, remarks)
            VALUES (%s, %s, 'STOCK_IN', %s, %s, %s)
        """
        remarks = f"add supply in gandola {gondola_code}"
        cur.execute(sql_audit, (inventory_id, current_user_id, quantity, datetime.now(), remarks))

        cur.execute("UPDATE PRODUCTS SET total_stock_quantity = IFNULL(total_stock_quantity, 0) + %s WHERE product_id = %s", (quantity, product_id))

        mysql.connection.commit()
        return jsonify({"message": f"Product added to gondola '{gondola_code}'."}), 201
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

#get all products in a specific gondola
@inventory_bp.route('/inventory/gondola/<string:gondola_code>', methods=['GET'])
@jwt_required()
def get_gondola_inventory(gondola_code):
    
    claims = get_jwt()
    current_branch_id = claims['branch']

    cur = mysql.connection.cursor()
    try:
        
        sql = """
            SELECT 
                bi.inventory_id,
                p.product_id,
                p.product_name_official,
                p.category_type,
                bi.batch_number,
                bi.expiry_date,
                bi.quantity_on_hand
            FROM BRANCH_INVENTORY bi
            JOIN PRODUCTS p ON bi.product_id = p.product_id
            JOIN GONDOLAS g ON bi.gondola_id = g.gondola_id
            WHERE g.gondola_code = %s AND bi.branch_id = %s
            ORDER BY p.product_name_official ASC, bi.expiry_date ASC
        """
        
        cur.execute(sql, (gondola_code, current_branch_id))
        items = cur.fetchall()

        if not items:
            return jsonify({"message": f"No products found in gondola '{gondola_code}' at your branch."}), 404

        gondola_stock = []
        for item in items:
            gondola_stock.append({
                "inventory_id": item[0],
                "product_id": item[1],
                "product_name": item[2],
                "category": item[3],
                "batch_number": item[4],
                "expiry_date": item[5].strftime('%Y-%m-%d') if item[5] else None,
                "quantity_on_hand": item[6]
            })

        return jsonify(gondola_stock), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

#  Remove PRODUCT
@inventory_bp.route('/inventory/remove-expired', methods=['POST'])
@jwt_required()
def remove_expired_stock():
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    current_branch_id = claims['branch']

    data = request.json
    product_id = data.get('product_id')
    gondola_code = data.get('gondola_code')
    quantity_to_remove = data.get('quantity')

    if not all([product_id, gondola_code, quantity_to_remove]) or quantity_to_remove <= 0:
        return jsonify({"message": "Missing fields or invalid quantity."}), 400

    cur = mysql.connection.cursor()
    try:
        sql_find = """
            SELECT bi.inventory_id, bi.quantity_on_hand, bi.batch_number
            FROM BRANCH_INVENTORY bi
            JOIN GONDOLAS g ON bi.gondola_id = g.gondola_id
            WHERE bi.product_id = %s AND g.gondola_code = %s AND bi.branch_id = %s
            ORDER BY bi.expiry_date ASC LIMIT 1
        """
        cur.execute(sql_find, (product_id, gondola_code, current_branch_id))
        item = cur.fetchone()
        
        if not item:
            return jsonify({"message": "Product not found."}), 404
            
        inventory_id, current_qty, batch_num = item[0], item[1], item[2]

        if quantity_to_remove > current_qty:
            return jsonify({"message": "Insufficient stock."}), 400

        # LOG THE AUDIT TRAIL (STOCK ADJUSTMENT)
        sql_audit = """
            INSERT INTO STOCK_ADJUSTMENTS (inventory_id, user_id, adjustment_type, quantity_adjusted, date_adjusted, remarks)
            VALUES (%s, %s, 'DISPOSAL', %s, %s, %s)
        """
        remarks = f"Expired stock removed from {gondola_code} (Batch: {batch_num})"
        cur.execute(sql_audit, (inventory_id, current_user_id, quantity_to_remove, datetime.now(), remarks))

        # UPDATE INVENTORY
        new_qty = current_qty - quantity_to_remove
        if new_qty > 0:
            cur.execute("UPDATE BRANCH_INVENTORY SET quantity_on_hand = %s WHERE inventory_id = %s", (new_qty, inventory_id))
        else:
            cur.execute("DELETE FROM BRANCH_INVENTORY WHERE inventory_id = %s", (inventory_id,))

        #  Update Global Total
        cur.execute("UPDATE PRODUCTS SET total_stock_quantity = total_stock_quantity - %s WHERE product_id = %s", (quantity_to_remove, product_id))

        mysql.connection.commit()
        return jsonify({"message": f"Stock removed and logged as Disposal."}), 200
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

#  SEARCH PRODUCT BY NAME
#http://127.0.0.1:5000/inventory/search?name=name of product 
@inventory_bp.route('/inventory/search', methods=['GET'])
@jwt_required()
def search_product():
    claims = get_jwt()
    current_branch_id = claims['branch']
    
    # Get the search term from the URL parameter (e.g., /search?name=paracetamol)
    search_query = request.args.get('name', '')
    category_filter = request.args.get('category', '').strip().upper()

    if not search_query:
        return jsonify({"message": "Please provide a product name to search for."}), 400

    cur = mysql.connection.cursor()
    try:
    
        sql = """
            SELECT 
                bi.inventory_id,
                p.product_id,
                p.product_name_official,
                p.category_type,
                COALESCE(
                    MAX(
                        CASE
                            WHEN pb.is_primary = TRUE
                                 AND pb.barcode_value IS NOT NULL
                                 AND TRIM(pb.barcode_value) NOT IN ('', '-', '—', 'N/A', 'NA', 'NONE')
                                 AND TRIM(pb.barcode_value) REGEXP '[0-9A-Za-z]'
                            THEN TRIM(pb.barcode_value)
                        END
                    ),
                    MIN(
                        CASE
                            WHEN pb.barcode_value IS NOT NULL
                                 AND TRIM(pb.barcode_value) NOT IN ('', '-', '—', 'N/A', 'NA', 'NONE')
                                 AND TRIM(pb.barcode_value) REGEXP '[0-9A-Za-z]'
                            THEN TRIM(pb.barcode_value)
                        END
                    )
                ) AS barcode_value,
                bi.batch_number, 
                bi.expiry_date, 
                bi.quantity_on_hand, 
                p.price_regular,
                g.gondola_code
            FROM BRANCH_INVENTORY bi
            JOIN PRODUCTS p ON bi.product_id = p.product_id
            LEFT JOIN PRODUCT_BARCODES pb ON p.product_id = pb.product_id
            JOIN GONDOLAS g ON bi.gondola_id = g.gondola_id
            WHERE bi.branch_id = %s 
              AND p.product_name_official LIKE %s
        """

        like_pattern = f"%{search_query}%"
        params = [current_branch_id, like_pattern]
        if category_filter:
            sql += " AND p.category_type = %s"
            params.append(category_filter)

        sql += """
            GROUP BY
                bi.inventory_id,
                p.product_id,
                p.product_name_official,
                p.category_type,
                bi.batch_number,
                bi.expiry_date,
                bi.quantity_on_hand,
                p.price_regular,
                g.gondola_code
            ORDER BY p.product_name_official ASC, bi.expiry_date ASC
        """

        cur.execute(sql, tuple(params))
        results = cur.fetchall()

        if not results:
            return jsonify({"message": f"No products matching '{search_query}' found in your branch."}), 404

        # 3. Format the results
        search_results = []
        for row in results:
            search_results.append({
                "inventory_id": row[0],
                "product_id": row[1],
                "product_name": row[2],
                "product_name_official": row[2],
                "category": row[3],
                "barcode": row[4],
                "barcode_value": row[4],
                "batch_number": row[5],
                "expiry_date": row[6].strftime('%Y-%m-%d') if row[6] else None,
                "quantity": row[7],
                "quantity_on_hand": row[7],
                "price": float(row[8]) if row[8] else 0.00,
                "location": row[9],
                "gondola_code": row[9],
            })

        return jsonify({
            "search_term": search_query,
            "results_found": len(search_results),
            "items": search_results
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

# GET NEAR EXPIRY PRODUCTS near30 days

@inventory_bp.route('/inventory/near-expiry', methods=['GET'])
@jwt_required()
def get_near_expiry():
    claims = get_jwt()
    current_branch_id = claims['branch']

    today = datetime.now().date()
    threshold_date = today + timedelta(days=30)

    cur = mysql.connection.cursor()
    try:

        sql = """
            SELECT 
                p.product_name_official, 
                bi.batch_number, 
                bi.expiry_date, 
                bi.quantity_on_hand, 
                g.gondola_code
            FROM BRANCH_INVENTORY bi
            JOIN PRODUCTS p ON bi.product_id = p.product_id
            JOIN GONDOLAS g ON bi.gondola_id = g.gondola_id
            WHERE bi.branch_id = %s 
              AND bi.expiry_date <= %s
            ORDER BY bi.expiry_date ASC
        """
        cur.execute(sql, (current_branch_id, threshold_date))
        results = cur.fetchall()

        expiry_list = []
        for row in results:
            expiry_date = row[2]
            # Calculate status: Expired vs Expiring Soon
            status = "EXPIRED" if expiry_date < today else "EXPIRING SOON"
            
            expiry_list.append({
                "product_name": row[0],
                "batch_number": row[1],
                "expiry_date": expiry_date.strftime('%Y-%m-%d'),
                "quantity": row[3],
                "location": row[4],
                "status": status
            })

        return jsonify({
            "branch_id": current_branch_id,
            "report_date": today.strftime('%Y-%m-%d'),
            "total_count": len(expiry_list),
            "items": expiry_list
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()


# route for admmin monitoring -----------------
# VIEW STOCK AUDIT LOG
@inventory_bp.route('/admin/audit-log/<int:branch_id>', methods=['GET'])
@jwt_required()
def get_audit_log(branch_id):
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({"message": "Access Denied: Administrator privileges required"}), 403

    cur = mysql.connection.cursor()
    try:
    
        sql = """
            SELECT 
                sa.date_adjusted, 
                u.full_name, 
                p.product_name_official, 
                sa.adjustment_type, 
                sa.quantity_adjusted, 
                sa.remarks
            FROM STOCK_ADJUSTMENTS sa
            JOIN USERS u ON sa.user_id = u.user_id
            JOIN BRANCH_INVENTORY bi ON sa.inventory_id = bi.inventory_id
            JOIN PRODUCTS p ON bi.product_id = p.product_id
            WHERE bi.branch_id = %s
            ORDER BY sa.date_adjusted DESC
        """
        cur.execute(sql, (branch_id,))
        logs = cur.fetchall()

        audit_trail = []
        for log in logs:
            audit_trail.append({
                "date_time": log[0].strftime('%Y-%m-%d %H:%M:%S'),
                "performed_by": log[1],
                "product": log[2],
                "action_type": log[3],
                "quantity": log[4],
                "details": log[5]
            })

        return jsonify({
            "branch_id": branch_id,
            "total_entries": len(audit_trail),
            "logs": audit_trail
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close