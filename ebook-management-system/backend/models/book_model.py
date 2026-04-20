# models/book_model.py - Database operations for books and downloads tables

class BookModel:
    def __init__(self, mysql):
        self.mysql = mysql

    # Convert DB row to dictionary
    def _row_to_dict(self, row):
        if not row:
            return None

        return {
            'id': row[0],
            'title': row[1],
            'author': row[2],
            'category': row[3],
            'description': row[4],
            'file_name': row[5],
            'uploaded_by': row[6] if len(row) > 6 else None
        }

    # Get all books
    def get_all_books(self):
        cursor = self.mysql.connection.cursor()

        cursor.execute("""
            SELECT id, title, author, category, description, file_name, uploaded_by
            FROM books
        """)

        rows = cursor.fetchall()
        cursor.close()

        books = []

        for row in rows:
            books.append({
                "id": row[0],
                "title": row[1],
                "author": row[2],
                "category": row[3],
                "description": row[4],
                "file_name": row[5],
                "uploaded_by": row[6]
            })

        return books

    # Get a single book
    def get_book_by_id(self, book_id):
        cursor = self.mysql.connection.cursor()

        cursor.execute("""
            SELECT id, title, author, category, description, file_name, uploaded_by
            FROM books
            WHERE id = %s
        """, (book_id,))

        row = cursor.fetchone()
        cursor.close()

        return self._row_to_dict(row)

    # Search books
    def search_books(self, query):
        cursor = self.mysql.connection.cursor()

        like_query = f"%{query}%"

        cursor.execute("""
            SELECT id, title, author, category, description, file_name, uploaded_by
            FROM books
            WHERE title LIKE %s
               OR author LIKE %s
               OR category LIKE %s
        """, (like_query, like_query, like_query))

        rows = cursor.fetchall()
        cursor.close()

        return [self._row_to_dict(row) for row in rows]

    # Add book
    def add_book(self, title, author, category, description, file_name, uploaded_by):
        cursor = self.mysql.connection.cursor()

        cursor.execute("""
            INSERT INTO books (title, author, category, description, file_name, uploaded_by)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (title, author, category, description, file_name, uploaded_by))

        self.mysql.connection.commit()
        cursor.close()

    # Delete book
    def delete_book(self, book_id):
        cursor = self.mysql.connection.cursor()

        cursor.execute("DELETE FROM books WHERE id = %s", (book_id,))
        self.mysql.connection.commit()

        deleted = cursor.rowcount
        cursor.close()

        return deleted > 0

    # Save download history
    def log_download(self, user_id, book_id):
        cursor = self.mysql.connection.cursor()

        cursor.execute("""
            INSERT INTO downloads (user_id, book_id)
            VALUES (%s, %s)
        """, (user_id, book_id))

        self.mysql.connection.commit()
        cursor.close()