# routes/admin.py - Admin-only routes: upload, update, delete books

import os
import jwt
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from models.book_model import BookModel
from config import allowed_file
from werkzeug.utils import secure_filename
admin_bp = Blueprint('admin', __name__)
@admin_bp.route('/upload-book', methods=['POST'])
def upload_book():
    try:
        title = request.form['title']
        author = request.form['author']
        category = request.form['category']
        description = request.form['description']

        pdf = request.files['pdf']

        if pdf.filename == '':
            return jsonify({'message': 'No PDF selected'}), 400

        filename = secure_filename(pdf.filename)

        upload_folder = current_app.config['UPLOAD_FOLDER']
        os.makedirs(upload_folder, exist_ok=True)

        pdf.save(os.path.join(upload_folder, filename))

        # Save filename into database here
        from app import mysql
        cursor = mysql.connection.cursor()

        query = """
        INSERT INTO books (title, author, category, description, file_name, uploaded_by)
        VALUES (%s, %s, %s, %s, %s, %s)
        """

        cursor.execute(query, (
            title,
            author,
            category,
            description,
            filename,
            1
        ))

        mysql.connection.commit()
        cursor.close()

        return jsonify({'message': 'Book uploaded successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
admin_bp = Blueprint('admin', __name__)

def get_book_model():
    from app import mysql
    return BookModel(mysql)

def require_admin(f):
    """
    Decorator that checks for a valid admin JWT token.
    Returns 401/403 if the user is not an authenticated admin.
    """
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'Authorization token required'}), 401
        token = auth_header.split(' ', 1)[1]
        try:
            payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token expired, please login again'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': 'Invalid token'}), 401

        if payload.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403

        # Pass user_id to the route via kwargs
        kwargs['admin_id'] = payload['user_id']
        return f(*args, **kwargs)
    return decorated


# ── POST /upload-book ─────────────────────────────────────────────────────────
@admin_bp.route('/upload-book', methods=['POST'])
@require_admin
def upload_book(admin_id):
    """
    Upload a new e-book.
    Expects multipart/form-data with fields: title, author, category,
    description, and file (PDF only).
    """
    title       = request.form.get('title', '').strip()
    author      = request.form.get('author', '').strip()
    category    = request.form.get('category', '').strip()
    description = request.form.get('description', '').strip()

    if not title or not author:
        return jsonify({'success': False, 'message': 'Title and author are required'}), 400

    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'PDF file is required'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'success': False, 'message': 'Only PDF files are allowed'}), 400

    # Sanitise filename and save
    filename     = secure_filename(file.filename)
    upload_path  = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_path, exist_ok=True)

    # Prevent filename collisions by prepending a timestamp
    import time
    unique_name = f"{int(time.time())}_{filename}"
    file.save(os.path.join(upload_path, unique_name))

    model  = get_book_model()
    new_id = model.add_book(title, author, category, description, unique_name, admin_id)

    return jsonify({
        'success': True,
        'message': 'Book uploaded successfully',
        'book_id': new_id
    }), 201


# ── PUT /update-book/<id> ─────────────────────────────────────────────────────
@admin_bp.route('/update-book/<int:book_id>', methods=['PUT'])
@require_admin
def update_book(book_id, admin_id):
    """
    Update book metadata and optionally replace the PDF file.
    Accepts multipart/form-data (if new file) or JSON (metadata only).
    """
    model = get_book_model()
    book  = model.get_book_by_id(book_id)
    if not book:
        return jsonify({'success': False, 'message': 'Book not found'}), 404

    # Support both JSON and form-data requests
    if request.content_type and 'multipart' in request.content_type:
        title       = request.form.get('title', book['title']).strip()
        author      = request.form.get('author', book['author']).strip()
        category    = request.form.get('category', book['category']).strip()
        description = request.form.get('description', book['description']).strip()
    else:
        data        = request.get_json() or {}
        title       = data.get('title',       book['title'])
        author      = data.get('author',      book['author'])
        category    = data.get('category',    book['category'])
        description = data.get('description', book['description'])

    new_file_name = None

    # Handle optional new PDF file
    if 'file' in request.files and request.files['file'].filename:
        file = request.files['file']
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'message': 'Only PDF files are allowed'}), 400

        import time
        new_file_name = f"{int(time.time())}_{secure_filename(file.filename)}"
        upload_path   = current_app.config['UPLOAD_FOLDER']
        file.save(os.path.join(upload_path, new_file_name))

        # Remove old file
        old_path = os.path.join(upload_path, book['file_name'])
        if os.path.exists(old_path):
            os.remove(old_path)

    model.update_book(book_id, title, author, category, description, new_file_name)

    return jsonify({'success': True, 'message': 'Book updated successfully'}), 200


# ── DELETE /delete-book/<id> ──────────────────────────────────────────────────
@admin_bp.route('/delete-book/<int:book_id>', methods=['DELETE'])
@require_admin
def delete_book(book_id, admin_id):
    """Delete a book record and remove its PDF from the server."""
    model     = get_book_model()
    file_name = model.delete_book(book_id)

    if file_name:
        upload_path = current_app.config['UPLOAD_FOLDER']
        file_path   = os.path.join(upload_path, file_name)
        if os.path.exists(file_path):
            os.remove(file_path)

    return jsonify({'success': True, 'message': 'Book deleted successfully'}), 200


# ── GET /admin/stats ──────────────────────────────────────────────────────────
@admin_bp.route('/admin/stats', methods=['GET'])
@require_admin
def get_stats(admin_id):
    """Return dashboard statistics for the admin panel."""
    from app import mysql
    cur = mysql.connection.cursor()

    cur.execute("SELECT COUNT(*) FROM books")
    total_books = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM users WHERE role = 'user'")
    total_users = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM downloads")
    total_downloads = cur.fetchone()[0]

    cur.close()

    return jsonify({
        'success':         True,
        'total_books':     total_books,
        'total_users':     total_users,
        'total_downloads': total_downloads
    }), 200
