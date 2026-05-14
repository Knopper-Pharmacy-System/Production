import pymysql
# This is required to make Flask-MySQLdb work with the PyMySQL driver
pymysql.install_as_MySQLdb()

import os
from flask import Flask
from datetime import timedelta
from dotenv import load_dotenv
from flask_cors import CORS

# Import your extensions and blueprints
from extensions import mysql, bcrypt, jwt
from user import user_bp
from inventory import inventory_bp
from pos import pos_bp
from procurement import procurement_bp
from branch import branch_bp
from dashboard import dashboard_bp
from analytics import analytics_bp

# Load environment variables from .env (for local) or Railway (production)
load_dotenv()

app = Flask(__name__)

# --- CORS CONFIGURATION (THE FIX) ---
# This allows your frontend on one Railway domain to talk to your backend on another.
CORS(app, resources={r"/*": {
    "origins": [
        "https://knopper-deployed.up.railway.app",  # Your Frontend URL
        "http://localhost:5173",                   # Local Vite development
        "http://localhost:5175",                   # Local Vite development (alternate port)
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5175"
    ],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# --- DATABASE CONFIGURATION ---
app.config['MYSQL_HOST'] = os.getenv('DB_HOST')
app.config['MYSQL_USER'] = os.getenv('DB_USER')
app.config['MYSQL_PASSWORD'] = os.getenv('DB_PASSWORD') 
app.config['MYSQL_DB'] = os.getenv('DB_NAME')
# Ensure DB_PORT is an integer; default to 3306 if not found
app.config['MYSQL_PORT'] = int(os.getenv('DB_PORT', 3306))

# --- SECURITY CONFIGURATION ---
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'super-secret-fallback-key') 
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=12)

# Initialize Extensions
mysql.init_app(app)
bcrypt.init_app(app)
jwt.init_app(app)

# Register Blueprints
app.register_blueprint(user_bp)
app.register_blueprint(inventory_bp)
app.register_blueprint(pos_bp)
app.register_blueprint(procurement_bp)
app.register_blueprint(branch_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(analytics_bp)

# Health Check Route (To verify backend is alive)
@app.route('/')
def health_check():
    return {"status": "success", "message": "Knopper Backend is running"}, 200

if __name__ == '__main__':
    # Get port from environment for Railway compatibility
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port, debug=True)