import pandas as pd
import mysql.connector
from mysql.connector import Error
from datetime import datetime
import time
import os

# ==========================================
# 1. DATABASE CONFIGURATION
# ==========================================
DB_CONFIG = {
    'host': 'turntable.proxy.rlwy.net',
    'port': 30250,
    'user': 'root',
    'password': 'uLAhjyGhrysHRAQzKTnfvxKsXiCeQuOm', 
    'database': 'Knopper_Database',
    'connection_timeout': 30  # Don't wait forever if DB is locked
}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(BASE_DIR, 'Knopper_DBv2.csv')
TARGET_BRANCH_ID = 1 
    
# ==========================================
# 2. CLEANING FUNCTIONS
# ==========================================
def clean_str(val):
    if pd.isna(val) or val == '' or str(val).lower() == 'nan': return None
    return str(val).strip()

def clean_float(val):
    if pd.isna(val) or val == '': return 0.0
    try:
        return float(str(val).replace(',', '').replace('$', '').strip())
    except:
        return 0.0

def clean_date(val):
    if pd.isna(val) or val == '': return None
    s = str(val).strip()
    # Try multiple formats
    for fmt in ['%m/%d/%Y', '%Y-%m-%d', '%d-%m-%Y', '%m-%d-%y']:
        try:
            return datetime.strptime(s, fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    return None

# ==========================================
# 3. DATABASE SETUP
# ==========================================
def setup_branches(cursor):
    branches = [
        (1, 'KNOPPER BMC MAIN', 'K-BMC'),
        (2, 'KNOPPER DIVERSION', 'K-DIV'),
        (3, 'KNOPPER PANGANIBAN', 'K-PAN')
    ]
    sql = "INSERT INTO BRANCHES (branch_id, branch_name, branch_code) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE branch_name=VALUES(branch_name)"
    cursor.executemany(sql, branches)

def get_or_create_supplier(cursor, supplier_name):
    if not supplier_name: return None
    cursor.execute("SELECT supplier_id FROM SUPPLIERS WHERE supplier_name = %s", (supplier_name,))
    res = cursor.fetchone()
    if res: return res[0]
    
    cursor.execute("SELECT MAX(supplier_id) FROM SUPPLIERS")
    mx = cursor.fetchone()[0]
    new_id = (mx + 1) if mx else 1001
    cursor.execute("INSERT INTO SUPPLIERS (supplier_id, supplier_name) VALUES (%s, %s)", (new_id, supplier_name))
    return new_id

def get_or_create_gondola(cursor, branch_id, gondola_code):
    if not gondola_code: gondola_code = "GEN"
    cursor.execute("SELECT gondola_id FROM GONDOLAS WHERE gondola_code = %s AND branch_id = %s", (gondola_code, branch_id))
    res = cursor.fetchone()
    if res: return res[0]
    
    cursor.execute("SELECT MAX(gondola_id) FROM GONDOLAS")
    mx = cursor.fetchone()[0]
    new_id = (mx + 1) if mx else 1
    cursor.execute("INSERT INTO GONDOLAS (gondola_id, branch_id, gondola_code, floor_area) VALUES (%s, %s, %s, 'General')", (new_id, branch_id, gondola_code))
    return new_id

# ==========================================
# 4. MAIN IMPORT LOOP
# ==========================================
def run_import():
    conn = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Setup Initial Data
        print("Setting up Branches...")
        setup_branches(cursor)
        conn.commit()

        print(f"Reading CSV: {CSV_FILE}...")
        # Read as Object to prevent pandas guessing wrong types
        df = pd.read_csv(CSV_FILE, dtype=object)
        
        print(f"Total Rows to Process: {len(df)}")
        print("---------------------------------------------------")

        for index, row in df.iterrows():
            try:
                # --- A. CLEANING ---
                p_id_raw = row.get('Id', '0')
                p_id = int(clean_float(p_id_raw))
                
                # SPECIAL DIAGNOSTIC FOR THE CRASH ZONE
                if p_id in [41298, 41305, 41308]:
                    print(f"Processing Critical ID {p_id}...", end=" ")

                name = clean_str(row.get('Generic'))
                if not name:
                    if p_id in [41305]: print("FAILED (Missing Name)")
                    continue

                barcode = clean_str(row.get('Barcode'))
                classification = clean_str(row.get('Classification'))
                
                cat_map = {'MEDICAL SUPPLIES': 'MEDICINE', 'MEDICINES SUPPLIES': 'MEDICINE', 'GROCERIES SUPPLIES': 'GROCERY'}
                cat_type = cat_map.get(classification, 'EQUIPMENT')

                price_reg = clean_float(row.get('Regular Price'))
                price_snr = clean_float(row.get('Senior/PWD Price'))
                cost = clean_float(row.get('UnitCost'))

                # --- B. INSERT PRODUCTS ---
                cursor.execute("""
                    INSERT INTO PRODUCTS (product_id, product_name_official, product_name_receipt, 
                                          price_regular, price_senior_pwd, price_box_wholesale, is_active, category_type)
                    VALUES (%s, %s, %s, %s, %s, 0, TRUE, %s)
                    ON DUPLICATE KEY UPDATE price_regular=VALUES(price_regular)
                """, (p_id, name, name[:50], price_reg, price_snr, cat_type))

                # --- C. INSERT DETAILS ---
                pack_size = clean_str(row.get('Pack/Unit Size (Measure)')) or "Unit"
                if cat_type == 'MEDICINE':
                    cursor.execute("""
                        INSERT INTO MEDICINES (med_id, product_id, generic_name, dosage) VALUES (%s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE generic_name=VALUES(generic_name)
                    """, (p_id, p_id, name, pack_size))
                elif cat_type == 'GROCERY':
                    cursor.execute("""
                        INSERT INTO GROCERIES (gro_id, product_id, brand) VALUES (%s, %s, 'Generic')
                        ON DUPLICATE KEY UPDATE brand=VALUES(brand)
                    """, (p_id, p_id))

                # --- D. INSERT BARCODE ---
                # Note: If barcode is duplicate, we skip gracefully using INSERT IGNORE or checking
                cursor.execute("""
                    INSERT INTO PRODUCT_BARCODES (barcode_id, product_id, barcode_value, barcode_type, is_primary)
                    VALUES (%s, %s, %s, 'UNIT', TRUE)
                    ON DUPLICATE KEY UPDATE barcode_value=VALUES(barcode_value)
                """, (p_id, p_id, barcode))

                # --- E. INSERT SUPPLIER ---
                supp_name = clean_str(row.get('Supplier'))
                supp_id = get_or_create_supplier(cursor, supp_name)
                if supp_id:
                    cursor.execute("""
                        INSERT INTO PRODUCT_SUPPLIER_LINK (link_id, product_id, supplier_id, cost_per_unit)
                        VALUES (%s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE cost_per_unit=VALUES(cost_per_unit)
                    """, (p_id, p_id, supp_id, cost))

                # --- F. INSERT INVENTORY ---
                gondola_code = clean_str(row.get(' Gondola')) # Note the space in CSV header
                g_id = get_or_create_gondola(cursor, TARGET_BRANCH_ID, gondola_code)
                
                expiry = clean_date(row.get('Expiration'))
                batch = clean_str(row.get('LotNumber')) or 'BATCH-001'
                reorder = int(clean_float(row.get('Reorder Point')))

                cursor.execute("""
                    INSERT INTO BRANCH_INVENTORY (inventory_id, branch_id, product_id, gondola_id, 
                                                  reorder_level, batch_number, expiry_date, quantity_on_hand)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 0)
                    ON DUPLICATE KEY UPDATE batch_number=VALUES(batch_number)
                """, (p_id, TARGET_BRANCH_ID, p_id, g_id, reorder, batch, expiry))

                # If we are here, everything worked for this row
                if p_id in [41298, 41305, 41308]:
                    print("SUCCESS.")

            except Error as e:
                # PRINT THE EXACT ERROR FOR THE USER
                print(f"\n!!! ERROR at ID {p_id} !!!")
                print(f"MySQL Error Message: {e}")
                print("Skipping this row and continuing...\n")

            # Commit periodically
            if index > 0 and index % 100 == 0:
                conn.commit()
                print(f"Progress: {index} rows committed...")

        conn.commit()
        print("\n=============================================")
        print("IMPORT COMPLETE.")
        print("=============================================")

    except Error as e:
        print(f"CRITICAL DB CONNECTION ERROR: {e}")
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    run_import()