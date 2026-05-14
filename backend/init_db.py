#!/usr/bin/env python3
"""
Database initialization script for Railway deployment.
Run this once to create all tables and seed initial data.
"""

import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def init_database():
    try:
        # Connect to MySQL
        conn = pymysql.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_NAME'),
            port=int(os.getenv('DB_PORT', 3306))
        )
        
        cursor = conn.cursor()
        
        # Read the SQL schema
        with open('src/knopper_database_v1 (1).sql', 'r') as f:
            sql_script = f.read()
        
        # Execute the schema
        for statement in sql_script.split(';'):
            statement = statement.strip()
            if statement:
                cursor.execute(statement)
        
        conn.commit()
        print("✅ Database schema created successfully!")
        
        # Create default admin user
        from extensions import bcrypt
        admin_password = bcrypt.generate_password_hash('admin').decode('utf-8')
        
        cursor.execute("""
            INSERT INTO USERS (user_id, branch_id, username, password_hash, full_name, role, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, TRUE)
            ON DUPLICATE KEY UPDATE password_hash=%s
        """, (1, 1, 'admin', admin_password, 'Administrator', 'admin', admin_password))
        
        # Create default branch
        cursor.execute("""
            INSERT INTO BRANCHES (branch_id, branch_name, branch_code)
            VALUES (1, 'BMC MAIN', 'K-MAIN')
            ON DUPLICATE KEY UPDATE branch_name=branch_name
        """)
        
        conn.commit()
        print("✅ Default admin user created (username: admin, password: admin)")
        print("✅ Default branch created")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise

if __name__ == '__main__':
    init_database()
