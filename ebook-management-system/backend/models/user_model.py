# models/user_model.py - Database operations for the users table

from werkzeug.security import generate_password_hash, check_password_hash

class UserModel:
    def __init__(self, mysql):
        self.mysql = mysql

    def create_user(self, username, email, password, role='user'):
        """Insert a new user into the database with a hashed password."""
        hashed_password = generate_password_hash(password)
        cur = self.mysql.connection.cursor()
        try:
            cur.execute(
                "INSERT INTO users (username, email, password, role) VALUES (%s, %s, %s, %s)",
                (username, email, hashed_password, role)
            )
            self.mysql.connection.commit()
            return True, "User created successfully"
        except Exception as e:
            self.mysql.connection.rollback()
            # Duplicate email will raise IntegrityError
            if 'Duplicate entry' in str(e):
                return False, "Email already registered"
            return False, str(e)
        finally:
            cur.close()

    def get_user_by_email(self, email):
        """Fetch a single user record by email address."""
        cur = self.mysql.connection.cursor()
        cur.execute("SELECT id, username, email, password, role FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close()
        return user  # Returns tuple: (id, username, email, password, role)

    def get_user_by_id(self, user_id):
        """Fetch a single user record by ID."""
        cur = self.mysql.connection.cursor()
        cur.execute("SELECT id, username, email, role FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        cur.close()
        return user

    def verify_password(self, plain_password, hashed_password):
        """Return True if the plain password matches the stored hash."""
        return check_password_hash(hashed_password, plain_password)

    def get_all_users(self):
        """Return all users (for admin overview)."""
        cur = self.mysql.connection.cursor()
        cur.execute("SELECT id, username, email, role, created_at FROM users ORDER BY id DESC")
        users = cur.fetchall()
        cur.close()
        return users

    def seed_admin(self):
        """
        Create the default admin and user accounts if they don't exist.
        Called on app startup to ensure sample accounts are always available.
        """
        for username, email, password, role in [
            ('Admin', 'admin@gmail.com', 'admin123', 'admin'),
            ('User',  'user@gmail.com',  'user123',  'user'),
        ]:
            cur = self.mysql.connection.cursor()
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            exists = cur.fetchone()
            cur.close()
            if not exists:
                self.create_user(username, email, password, role)
