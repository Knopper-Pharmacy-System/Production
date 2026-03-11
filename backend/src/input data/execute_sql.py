import mysql.connector
from mysql.connector import Error
import os

DB_CONFIG = {
    'host': 'turntable.proxy.rlwy.net',
    'port': 30250,
    'user': 'root',
    'password': 'uLAhjyGhrysHRAQzKTnfvxKsXiCeQuOm',
    'database': 'Knopper_Database',
    'connection_timeout': 30
}

def execute_sql_file():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        sql_file = '/home/user/Production/backend/src/knopper_database_v1 (1).sql'
        with open(sql_file, 'r') as f:
            sql_script = f.read()

        # Split by semicolon and execute each statement
        statements = sql_script.split(';')
        for statement in statements:
            statement = statement.strip()
            if statement:
                try:
                    cursor.execute(statement)
                    print(f"Executed: {statement[:50]}...")
                except Error as e:
                    print(f"Error executing statement: {e}")
                    print(f"Statement: {statement[:100]}")

        conn.commit()
        print("SQL file executed successfully")

    except Error as e:
        print(f"Database error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    execute_sql_file()