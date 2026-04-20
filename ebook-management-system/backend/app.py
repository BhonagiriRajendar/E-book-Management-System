# app.py - Main Flask application entry point

import os
import pymysql
pymysql.install_as_MySQLdb()

from flask import Flask, jsonify
from flask_cors import CORS
from flask_mysqldb import MySQL
from config import Config
from flask_cors import CORS

# Initialise MySQL globally
mysql = MySQL()


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "http://localhost:8080"}})
    # Load config from config.py
    app.config.from_object(Config)

    # Initialize MySQL and CORS
    mysql.init_app(app)
    CORS(app)

    # Ensure uploads folder exists
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

    # Register routes
    from routes.auth import auth_bp
    from routes.books import books_bp
    from routes.admin import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(books_bp)
    app.register_blueprint(admin_bp)

    @app.route('/')
    def index():
        return jsonify({
            'message': 'E-Book Management API is running'
        })

    return app


if __name__ == '__main__':
    app = create_app()
    print("=" * 50)
    print("E-Book Management System Backend Running")
    print("http://127.0.0.1:5000")
    print("=" * 50)
    app.run(debug=True)