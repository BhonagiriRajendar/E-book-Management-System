# config.py - Application configuration settings

import os

class Config:
    # ── MySQL Database Configuration ──────────────────────────────────────────
    # Update these values to match your MySQL installation
    MYSQL_HOST     = os.environ.get('MYSQL_HOST', 'localhost')
    MYSQL_USER     = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'password')   # change to your MySQL root password
    MYSQL_DB       = os.environ.get('MYSQL_DB', 'ebook_db')
    MYSQL_PORT     = int(os.environ.get('MYSQL_PORT', 3306))

    # ── JWT Secret Key ────────────────────────────────────────────────────────
    # Used to sign JWT tokens — change this to a long random string in production
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'ebook-super-secret-jwt-key-2024')

    # ── File Upload Settings ──────────────────────────────────────────────────
    UPLOAD_FOLDER       = os.path.join(os.path.dirname(__file__), 'uploads', 'books')
    MAX_CONTENT_LENGTH  = 50 * 1024 * 1024   # 50 MB max upload size
    ALLOWED_EXTENSIONS  = {'pdf'}

    # ── Flask Settings ────────────────────────────────────────────────────────
    DEBUG = os.environ.get('FLASK_DEBUG', 'True') == 'True'
    SECRET_KEY = os.environ.get('SECRET_KEY', 'flask-secret-key-change-me')

def allowed_file(filename):
    """Return True if the uploaded filename has an allowed extension."""
    return (
        '.' in filename and
        filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS
    )
