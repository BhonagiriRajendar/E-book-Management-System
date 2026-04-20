# routes/books.py - Public book routes: list, search, download

import os
import jwt
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from models.book_model import BookModel

books_bp = Blueprint('books', __name__)


def get_book_model():
    from app import mysql
    return BookModel(mysql)


def get_current_user():
    """
    Extract and verify the JWT token from the Authorization header.
    Returns (user_id, role) if valid, otherwise (None, None)
    """
    auth_header = request.headers.get('Authorization', '')

    if not auth_header.startswith('Bearer '):
        return None, None

    token = auth_header.split(' ', 1)[1]

    try:
        payload = jwt.decode(
            token,
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256']
        )

        return payload['user_id'], payload['role']

    except jwt.ExpiredSignatureError:
        return None, None

    except jwt.InvalidTokenError:
        return None, None


# GET /books
@books_bp.route('/books', methods=['GET'])
def get_books():
    """
    Return all books
    """
    model = get_book_model()
    books = model.get_all_books()

    return jsonify({
        'success': True,
        'books': books,
        'count': len(books)
    }), 200


# GET /search?query=<term>
@books_bp.route('/search', methods=['GET'])
def search_books():
    """
    Search books by title, author, or category
    """
    query = request.args.get('query', '').strip()

    if not query:
        return jsonify({
            'success': False,
            'message': 'Search query is required'
        }), 400

    model = get_book_model()
    books = model.search_books(query)

    return jsonify({
        'success': True,
        'books': books,
        'count': len(books)
    }), 200


# GET /download/<book_id>
@books_bp.route('/download/<int:book_id>', methods=['GET'])
def download_book(book_id):
    """
    Download a PDF file for an authenticated user
    """
    user_id, role = get_current_user()

    if not user_id:
        return jsonify({
            'success': False,
            'message': 'Authentication required'
        }), 401

    model = get_book_model()
    book = model.get_book_by_id(book_id)

    if not book:
        return jsonify({
            'success': False,
            'message': 'Book not found'
        }), 404

    file_name = book['file_name']
    upload_folder = current_app.config['UPLOAD_FOLDER']

    file_path = os.path.join(upload_folder, file_name)

    if not os.path.exists(file_path):
        return jsonify({
            'success': False,
            'message': 'File not found on server'
        }), 404

    # Save download history
    model.log_download(user_id, book_id)

    return send_from_directory(
        upload_folder,
        file_name,
        as_attachment=True,
        download_name=f"{book['title']}.pdf"
    )