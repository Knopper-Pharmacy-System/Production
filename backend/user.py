from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, create_access_token
from extensions import mysql, bcrypt

# Define the blueprint
user_bp = Blueprint('user', __name__)

# CREATE USER 
@user_bp.route('/create-user', methods=['POST'])
@jwt_required()
def create_user():
    claims = get_jwt()
    current_role = claims['role']

    data = request.json
    target_role = data.get('role')
    u_id = data.get('user_id')
    b_id = data.get('branch_id')
    uname = data.get('username')
    fname = data.get('full_name')
    pwd = data.get('password')

    if not all([u_id, b_id, uname, fname, pwd, target_role]):
        return jsonify({
            "message": "Validation Error: All fields (user_id, branch_id, username, password, full_name, role) are required and cannot be empty."
        }), 400

    if current_role == 'staff':
        return jsonify({"message": "Access Denied: Staff cannot create accounts"}), 403
    
    if current_role == 'manager' and target_role in ['admin', 'manager']:
        return jsonify({"message": "Access Denied: Managers can only create Staff accounts"}), 403

    cur = mysql.connection.cursor()
    try:
        # --- DUPLICATE CHECK: Look for existing ID, Username, or Name IN THE SAME BRANCH ---
        cur.execute("""
            SELECT user_id, username, full_name, branch_id 
            FROM USERS 
            WHERE user_id = %s 
               OR username = %s 
               OR (full_name = %s AND branch_id = %s)
        """, (u_id, uname, fname, b_id))
        
        existing_user = cur.fetchone()
        
        if existing_user:
            if existing_user[0] == int(u_id):
                return jsonify({"message": f"Conflict: The user_id '{u_id}' is already in use."}), 409
            
            if existing_user[1] == uname:
                return jsonify({"message": f"Conflict: The username '{uname}' is already taken. Please choose another."}), 409
            
            if existing_user[2] == fname and existing_user[3] == int(b_id):
                return jsonify({"message": f"Conflict: '{fname}' is already registered at Branch {b_id}."}), 409

        hashed_pwd = bcrypt.generate_password_hash(pwd).decode('utf-8')

        cur.execute("""
            INSERT INTO USERS (user_id, branch_id, username, password_hash, full_name, role, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, TRUE)
        """, (u_id, b_id, uname, hashed_pwd, fname, target_role))
        
        mysql.connection.commit()
        return jsonify({"message": f"User {uname} created successfully!"}), 201

    except Exception as e:
        mysql.connection.rollback() 
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

# ROUTE: LOGIN
@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    cur = mysql.connection.cursor()
    cur.execute("SELECT user_id, password_hash, role, branch_id, is_active FROM USERS WHERE username = %s", (username,))
    user = cur.fetchone()
    cur.close()

    if user and bcrypt.check_password_hash(user[1], password):
        
        if not user[4]: 
            return jsonify({"message": "Account is inactive. Please contact your administrator."}), 403

        identity = str(user[0]) 
        
        claims = {
            "role": user[2],
            "branch": user[3]
        }
        
        token = create_access_token(identity=identity, additional_claims=claims)
     
        
        return jsonify({"access_token": token, "role": user[2]}), 200
    
    return jsonify({"message": "Invalid Credentials"}), 401

# show branch info
@user_bp.route('/branch/<int:branch_id>', methods=['GET'])
@jwt_required()
def get_branch_info(branch_id):
    cur = mysql.connection.cursor()
    try:
        cur.execute("""
            SELECT branch_name, branch_code 
            FROM BRANCHES 
            WHERE branch_id = %s
        """, (branch_id,))
        
        branch = cur.fetchone()
        
        if not branch:
            return jsonify({"message": f"Branch ID {branch_id} not found."}), 404
            
        return jsonify({
            "status": "success",
            "branch_id": branch_id,
            "branch_name": branch[0],
            "branch_code": branch[1]
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()


@user_bp.route('/branches', methods=['GET'])
@jwt_required()
def get_all_branches():
    cur = mysql.connection.cursor()
    try:
        cur.execute(
            """
            SELECT branch_id, branch_name, branch_code
            FROM BRANCHES
            ORDER BY branch_id ASC
            """
        )
        rows = cur.fetchall()
        branches = [
            {
                "branch_id": row[0],
                "branch_name": row[1],
                "branch_code": row[2],
            }
            for row in rows
        ]
        return jsonify(branches), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

#  SETUP ADMIN 
@user_bp.route('/setup-admin', methods=['POST'])
def setup_admin():
    # SECURITY CHECK: Check for the secret header
    setup_key = request.headers.get('X-Setup-Key')
    
    if setup_key != "Knopper-Init-2026":
        return jsonify({"message": "Forbidden: Invalid Setup Key"}), 403

    data = request.json
    
    if not data or not data.get('password'):
        return jsonify({"message": "Missing password"}), 400

    hashed_pwd = bcrypt.generate_password_hash(data.get('password')).decode('utf-8')
    
    cur = mysql.connection.cursor()
    try:
        cur.execute("""
            INSERT INTO USERS (user_id, branch_id, username, password_hash, full_name, role, is_active)
            VALUES (%s, %s, %s, %s, %s, 'admin', TRUE)
        """, (data.get('user_id'), data.get('branch_id'), data.get('username'), hashed_pwd, data.get('full_name')))
        
        mysql.connection.commit()
        return jsonify({"message": "Superadmin created and activated successfully!"}), 201

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
# GET ALL USERS
@user_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():

    claims = get_jwt()
    if claims['role'] not in ['admin', 'manager']:
        return jsonify({"message": "Access Denied"}), 403

    cur = mysql.connection.cursor()
    try:
        sql = """
            SELECT u.user_id, u.username, u.full_name, u.role, b.branch_name, u.is_active 
            FROM USERS u
            LEFT JOIN BRANCHES b ON u.branch_id = b.branch_id
            ORDER BY u.branch_id, u.role
        """
        cur.execute(sql)
        users = cur.fetchall()

        user_list = []
        for user in users:
            user_list.append({
                "user_id": user[0],
                "username": user[1],
                "full_name": user[2],
                "role": user[3],
                "branch": user[4],
                "status": "Active" if user[5] else "Inactive"
            })

        return jsonify(user_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
# UPDATE USER
@user_bp.route('/update-users/<int:target_user_id>', methods=['PUT'])
@jwt_required()
def edit_user(target_user_id):

    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({"message": "Access Denied: Only Administrators can edit user profiles."}), 403

    data = request.json
    if not data:
        return jsonify({"message": "No data provided to update."}), 400

    username = data.get('username')
    full_name = data.get('full_name')
    role = data.get('role')
    branch_id = data.get('branch_id')
    is_active = data.get('is_active') # True or False
    password = data.get('password')

    cur = mysql.connection.cursor()
    try:
        # VERIFY USER EXISTS
        cur.execute("SELECT * FROM USERS WHERE user_id = %s", (target_user_id,))
        if not cur.fetchone():
            return jsonify({"message": f"User ID {target_user_id} not found."}), 404

        # 4. DUPLICATE CHECK 
        if username or (full_name and branch_id):
            cur.execute("""
                SELECT user_id, username, full_name, branch_id 
                FROM USERS 
                WHERE user_id != %s 
                  AND (username = %s OR (full_name = %s AND branch_id = %s))
            """, (target_user_id, username, full_name, branch_id))
            
            conflict = cur.fetchone()
            if conflict:
                if conflict[1] == username:
                    return jsonify({"message": f"Conflict: Username '{username}' is already taken."}), 409
                if conflict[2] == full_name and conflict[3] == int(branch_id):
                    return jsonify({"message": f"Conflict: '{full_name}' already exists in Branch {branch_id}."}), 409

    
        update_fields = []
        update_values = []

        if username:
            update_fields.append("username = %s")
            update_values.append(username)
        if full_name:
            update_fields.append("full_name = %s")
            update_values.append(full_name)
        if role:
            update_fields.append("role = %s")
            update_values.append(role)
        if branch_id:
            update_fields.append("branch_id = %s")
            update_values.append(branch_id)
        if is_active is not None:  
            update_fields.append("is_active = %s")
            update_values.append(is_active)
        if password:
            hashed_pwd = bcrypt.generate_password_hash(password).decode('utf-8')
            update_fields.append("password_hash = %s")
            update_values.append(hashed_pwd)

        if not update_fields:
            return jsonify({"message": "No valid fields provided to update."}), 400

    
        update_values.append(target_user_id)

        # Assemble the final SQL string
        sql = f"UPDATE USERS SET {', '.join(update_fields)} WHERE user_id = %s"
        
        cur.execute(sql, tuple(update_values))
        mysql.connection.commit()

        return jsonify({"message": f"User ID {target_user_id} updated successfully!"}), 200

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()


def _fetch_id_list(cur, query, params=()):
    cur.execute(query, params)
    return [row[0] for row in cur.fetchall()]


def _delete_with_optional_count(cur, deleted_summary, table_name, where_clause=None, params=()):
    cur.execute(
        """
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = %s
        """,
        (table_name,),
    )
    exists = cur.fetchone()[0] > 0
    if not exists:
        return

    if where_clause:
        cur.execute(f"SELECT COUNT(*) FROM {table_name} WHERE {where_clause}", params)
        before_count = int(cur.fetchone()[0])
        if before_count > 0:
            cur.execute(f"DELETE FROM {table_name} WHERE {where_clause}", params)
    else:
        cur.execute(f"SELECT COUNT(*) FROM {table_name}")
        before_count = int(cur.fetchone()[0])
        if before_count > 0:
            cur.execute(f"DELETE FROM {table_name}")

    if before_count > 0:
        deleted_summary[table_name] = deleted_summary.get(table_name, 0) + before_count


def _delete_by_ids(cur, deleted_summary, table_name, column_name, id_values):
    if not id_values:
        return

    placeholders = ', '.join(['%s'] * len(id_values))
    _delete_with_optional_count(
        cur,
        deleted_summary,
        table_name,
        f"{column_name} IN ({placeholders})",
        tuple(id_values),
    )


def _recalculate_product_totals(cur):
    cur.execute(
        """
        UPDATE PRODUCTS p
        LEFT JOIN (
            SELECT product_id, SUM(quantity_on_hand) AS total_quantity
            FROM BRANCH_INVENTORY
            GROUP BY product_id
        ) bi ON bi.product_id = p.product_id
        SET p.total_stock_quantity = COALESCE(bi.total_quantity, 0)
        """
    )


@user_bp.route('/admin/testing/reset-system-data', methods=['POST'])
@jwt_required()
def reset_system_data_for_testing():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({"message": "Access Denied: Only Administrators can reset test data."}), 403

    payload = request.json or {}
    confirm_text = str(payload.get('confirm_text', '')).strip().upper()
    if confirm_text != 'RESET TEST DATA':
        return jsonify({
            "message": "Confirmation failed. Send confirm_text='RESET TEST DATA' to continue."
        }), 400

    branch_id = payload.get('branch_id')
    branch_scope = 'all-branches' if branch_id in [None, '', 'all'] else 'single-branch'

    try:
        branch_id = None if branch_scope == 'all-branches' else int(branch_id)
    except (TypeError, ValueError):
        return jsonify({"message": "branch_id must be a valid integer or 'all'."}), 400

    requested_sections = payload.get('reset_sections') or ['sales', 'inventory', 'procurement', 'transfers']
    if not isinstance(requested_sections, list):
        return jsonify({"message": "reset_sections must be an array."}), 400

    valid_sections = {'sales', 'stock_batches', 'inventory', 'procurement', 'transfers'}
    normalized_sections = []
    for section in requested_sections:
        normalized = str(section).strip().lower()
        if normalized not in valid_sections:
            return jsonify({"message": f"Invalid reset section: {section}"}), 400
        # Treat 'inventory' as an alias for 'stock_batches'
        if normalized == 'inventory':
            normalized = 'stock_batches'
        if normalized not in normalized_sections:
            normalized_sections.append(normalized)

    if not normalized_sections:
        return jsonify({"message": "Select at least one reset section."}), 400

    if 'stock_batches' in normalized_sections and 'sales' not in normalized_sections:
        return jsonify({
            "message": "Stock batch reset also requires sales reset to avoid leaving sales records linked to deleted inventory batches."
        }), 400

    cur = mysql.connection.cursor()
    try:
        deleted_summary = {}

        if branch_id is not None:
            cur.execute(
                "SELECT branch_id, branch_name, branch_code FROM BRANCHES WHERE branch_id = %s",
                (branch_id,),
            )
            branch_row = cur.fetchone()
            if not branch_row:
                return jsonify({"message": f"Branch {branch_id} was not found."}), 404
            branch_info = {
                "branch_id": branch_row[0],
                "branch_name": branch_row[1],
                "branch_code": branch_row[2],
            }
        else:
            branch_info = None

        cur.execute("SET FOREIGN_KEY_CHECKS = 0")

        if branch_scope == 'all-branches':
            if 'sales' in normalized_sections:
                for table_name in [
                    'RETURN_ITEMS',
                    'SALES_RETURNS',
                    'SALES_DETAILS',
                    'SALES_HEADERS',
                    'CASHIER_SHIFTS',
                    'SUSPENDED_TRANSACTIONS',
                    'BRANCH_SALES_REPORTS',
                ]:
                    _delete_with_optional_count(cur, deleted_summary, table_name)

                if 'stock_batches' in normalized_sections:
                    _delete_with_optional_count(cur, deleted_summary, 'STOCK_ADJUSTMENTS')
                    _delete_with_optional_count(cur, deleted_summary, 'BRANCH_INVENTORY')

            if 'procurement' in normalized_sections:
                for table_name in [
                    'RECEIPT_ITEMS',
                    'RECEIVING_REPORTS',
                    'PURCHASE_ORDER_ITEMS',
                    'PURCHASE_ORDERS',
                ]:
                    _delete_with_optional_count(cur, deleted_summary, table_name)

            if 'transfers' in normalized_sections:
                for table_name in ['TRANSFER_ITEMS', 'TRANSFER_MANIFEST']:
                    _delete_with_optional_count(cur, deleted_summary, table_name)
        else:
            sale_ids = _fetch_id_list(
                cur,
                "SELECT sale_id FROM SALES_HEADERS WHERE branch_id = %s",
                (branch_id,),
            )
            shift_ids = _fetch_id_list(
                cur,
                "SELECT shift_id FROM CASHIER_SHIFTS WHERE branch_id = %s",
                (branch_id,),
            )
            inventory_ids = _fetch_id_list(
                cur,
                "SELECT inventory_id FROM BRANCH_INVENTORY WHERE branch_id = %s",
                (branch_id,),
            )
            order_ids = _fetch_id_list(
                cur,
                "SELECT order_id FROM PURCHASE_ORDERS WHERE branch_id = %s",
                (branch_id,),
            )
            manifest_ids = _fetch_id_list(
                cur,
                "SELECT manifest_id FROM TRANSFER_MANIFEST WHERE from_branch_id = %s OR to_branch_id = %s",
                (branch_id, branch_id),
            )

            if 'sales' in normalized_sections:
                sale_detail_ids = []
                if sale_ids:
                    placeholders = ', '.join(['%s'] * len(sale_ids))
                    sale_detail_ids = _fetch_id_list(
                        cur,
                        f"SELECT sale_detail_id FROM SALES_DETAILS WHERE sale_id IN ({placeholders})",
                        tuple(sale_ids),
                    )

                return_ids = _fetch_id_list(
                    cur,
                    "SELECT return_id FROM SALES_RETURNS WHERE branch_id = %s",
                    (branch_id,),
                )

                _delete_by_ids(cur, deleted_summary, 'RETURN_ITEMS', 'return_id', return_ids)
                if sale_detail_ids:
                    _delete_by_ids(cur, deleted_summary, 'RETURN_ITEMS', 'sale_detail_id', sale_detail_ids)
                _delete_by_ids(cur, deleted_summary, 'SALES_RETURNS', 'return_id', return_ids)
                _delete_by_ids(cur, deleted_summary, 'SALES_DETAILS', 'sale_id', sale_ids)
                _delete_by_ids(cur, deleted_summary, 'SALES_HEADERS', 'sale_id', sale_ids)
                _delete_by_ids(cur, deleted_summary, 'CASHIER_SHIFTS', 'shift_id', shift_ids)
                _delete_with_optional_count(cur, deleted_summary, 'SUSPENDED_TRANSACTIONS', 'branch_id = %s', (branch_id,))
                _delete_with_optional_count(cur, deleted_summary, 'BRANCH_SALES_REPORTS', 'branch_id = %s', (branch_id,))

                if 'stock_batches' in normalized_sections:
                    _delete_by_ids(cur, deleted_summary, 'STOCK_ADJUSTMENTS', 'inventory_id', inventory_ids)
                    _delete_with_optional_count(cur, deleted_summary, 'BRANCH_INVENTORY', 'branch_id = %s', (branch_id,))

            if 'procurement' in normalized_sections:
                po_item_ids = []
                receipt_ids = []
                if order_ids:
                    placeholders = ', '.join(['%s'] * len(order_ids))
                    po_item_ids = _fetch_id_list(
                        cur,
                        f"SELECT po_item_id FROM PURCHASE_ORDER_ITEMS WHERE order_id IN ({placeholders})",
                        tuple(order_ids),
                    )
                    receipt_ids = _fetch_id_list(
                        cur,
                        f"SELECT receipt_id FROM RECEIVING_REPORTS WHERE order_id IN ({placeholders})",
                        tuple(order_ids),
                    )

                _delete_by_ids(cur, deleted_summary, 'RECEIPT_ITEMS', 'receipt_id', receipt_ids)
                _delete_by_ids(cur, deleted_summary, 'PURCHASE_ORDER_ITEMS', 'po_item_id', po_item_ids)
                _delete_by_ids(cur, deleted_summary, 'RECEIVING_REPORTS', 'receipt_id', receipt_ids)
                _delete_by_ids(cur, deleted_summary, 'PURCHASE_ORDERS', 'order_id', order_ids)

            if 'transfers' in normalized_sections:
                _delete_by_ids(cur, deleted_summary, 'TRANSFER_ITEMS', 'manifest_id', manifest_ids)
                _delete_by_ids(cur, deleted_summary, 'TRANSFER_MANIFEST', 'manifest_id', manifest_ids)

        _recalculate_product_totals(cur)
        cur.execute("SET FOREIGN_KEY_CHECKS = 1")
        mysql.connection.commit()

        scope_message = (
            "all branches"
            if branch_info is None
            else f"branch {branch_info['branch_name']} ({branch_info['branch_code']})"
        )

        return jsonify({
            "message": f"Reset complete for {scope_message}.",
            "scope": branch_info or {"branch_id": "all", "branch_name": "All Branches", "branch_code": "ALL"},
            "reset_sections": normalized_sections,
            "deleted_rows": deleted_summary,
            "preserved": ["USERS", "BRANCHES", "PRODUCTS", "PRODUCT_BARCODES"],
        }), 200
    except Exception as e:
        mysql.connection.rollback()
        try:
            cur.execute("SET FOREIGN_KEY_CHECKS = 1")
        except Exception:
            pass
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()


@user_bp.route('/admin/testing/create-branch', methods=['POST'])
@jwt_required()
def create_testing_branch():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({"message": "Access Denied: Only Administrators can create a testing branch."}), 403

    payload = request.json or {}
    branch_name = str(payload.get('branch_name', 'TESTING BRANCH')).strip() or 'TESTING BRANCH'
    branch_code = str(payload.get('branch_code', 'TEST')).strip() or 'TEST'

    cur = mysql.connection.cursor()
    try:
        cur.execute(
            """
            SELECT branch_id, branch_name, branch_code
            FROM BRANCHES
            WHERE UPPER(branch_name) = UPPER(%s)
               OR UPPER(branch_code) = UPPER(%s)
            LIMIT 1
            """,
            (branch_name, branch_code),
        )
        existing_branch = cur.fetchone()

        if existing_branch:
            return jsonify({
                "message": "Testing branch already exists.",
                "branch": {
                    "branch_id": existing_branch[0],
                    "branch_name": existing_branch[1],
                    "branch_code": existing_branch[2],
                },
                "created": False,
            }), 200

        cur.execute("SELECT IFNULL(MAX(branch_id), 0) + 1 FROM BRANCHES")
        next_branch_id = int(cur.fetchone()[0])

        cur.execute(
            """
            INSERT INTO BRANCHES (branch_id, branch_name, branch_code)
            VALUES (%s, %s, %s)
            """,
            (next_branch_id, branch_name, branch_code),
        )

        mysql.connection.commit()
        return jsonify({
            "message": "Testing branch created successfully.",
            "branch": {
                "branch_id": next_branch_id,
                "branch_name": branch_name,
                "branch_code": branch_code,
            },
            "created": True,
        }), 201
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()