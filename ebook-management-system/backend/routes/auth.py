# routes/auth.py - Authentication routes: register and login

from flask import Blueprint, request, jsonify, current_app
from models.user_model import UserModel
import jwt
import datetime

auth_bp = Blueprint('auth', __name__)

def get_user_model():
    """Lazily fetch the UserModel from the app context."""
    from app import mysql
    return UserModel(mysql)

def generate_token(user_id, role):
    """
    Create a JWT token that encodes user_id and role.
    Token expires in 24 hours.
    """
    payload = {
        'user_id': user_id,
        'role':    role,
        'exp':     datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        'iat':     datetime.datetime.utcnow()
    }
    token = jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
    return token


# ── POST /register ────────────────────────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user account."""
    data = request.get_json()

    # Validate required fields
    username = (data.get('username') or '').strip()
    email    = (data.get('email')    or '').strip().lower()
    password = (data.get('password') or '').strip()

    if not username or not email or not password:
        return jsonify({'success': False, 'message': 'All fields are required'}), 400

    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400

    model = get_user_model()
    success, message = model.create_user(username, email, password, role='user')

    if success:
        return jsonify({'success': True, 'message': 'Registration successful! Please log in.'}), 201
    else:
        return jsonify({'success': False, 'message': message}), 409


# ── POST /login ───────────────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate a user and return a JWT token + role."""
    data = request.get_json()

    email    = (data.get('email')    or '').strip().lower()
    password = (data.get('password') or '').strip()

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required'}), 400

    model = get_user_model()
    user  = model.get_user_by_email(email)

    if not user:
        return jsonify({'success': False, 'message': 'Invalid email or password'}), 401

    user_id, username, user_email, hashed_pw, role = user

    if not model.verify_password(password, hashed_pw):
        return jsonify({'success': False, 'message': 'Invalid email or password'}), 401

    # Generate JWT
    token = generate_token(user_id, role)

    return jsonify({
        'success':  True,
        'message':  'Login successful',
        'token':    token,
        'role':     role,
        'username': username,
        'user_id':  user_id
    }), 200
