# 📚 E-Book Management System

A full-stack digital library application built with **HTML/CSS/JS** (frontend), **Python Flask** (backend), and **MySQL** (database). Users can browse, search, and download PDF books. Admins can upload, edit, and delete books through a dedicated dashboard.

---

## 🗂 Folder Structure

```
ebook-management-system/
├── backend/
│   ├── app.py              # Flask application entry point
│   ├── config.py           # DB, JWT, and upload configuration
│   ├── requirements.txt    # Python dependencies
│   ├── routes/
│   │   ├── auth.py         # POST /register, POST /login
│   │   ├── books.py        # GET /books, GET /search, GET /download/<id>
│   │   └── admin.py        # POST /upload-book, PUT /update-book, DELETE /delete-book
│   ├── models/
│   │   ├── user_model.py   # User DB operations + password hashing
│   │   └── book_model.py   # Book & download DB operations
│   └── uploads/books/      # Uploaded PDF files stored here
│
├── frontend/
│   ├── index.html          # Landing page
│   ├── login.html          # Login page
│   ├── register.html       # Registration page
│   ├── dashboard.html      # User book browser
│   ├── admin.html          # Admin management panel
│   ├── css/style.css       # Global stylesheet
│   └── js/
│       ├── login.js
│       ├── register.js
│       ├── dashboard.js
│       └── admin.js
│
├── database/
│   └── ebook_db.sql        # MySQL schema + sample data
│
└── README.md
```

---

## ⚙️ Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.9+ | [python.org](https://python.org) |
| MySQL | 8.0+ | [mysql.com](https://mysql.com) |
| pip | latest | Comes with Python |
| A browser | any modern | Chrome / Firefox recommended |

> **Windows users**: You may need `mysqlclient` via `pip install mysqlclient`. If it fails, install the [MySQL C connector](https://dev.mysql.com/downloads/connector/c/) first, or use `PyMySQL` as an alternative (see Troubleshooting).

---

## 🚀 Quick Start

### Step 1 — Set Up the Database

Open MySQL and run:

```sql
SOURCE /path/to/ebook-management-system/database/ebook_db.sql;
```

Or using the MySQL CLI:

```bash
mysql -u root -p < database/ebook_db.sql
```

This creates the `ebook_db` database with tables: `users`, `books`, `downloads`.

---

### Step 2 — Configure the Backend

Open `backend/config.py` and update your MySQL credentials:

```python
MYSQL_USER     = 'root'          # your MySQL username
MYSQL_PASSWORD = 'your_password' # your MySQL password
MYSQL_HOST     = 'localhost'
MYSQL_DB       = 'ebook_db'
```

---

### Step 3 — Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

---

### Step 4 — Start the Backend Server

```bash
cd backend
python app.py
```

You should see:
```
==================================================
  E-Book Management System - Backend
  Running on http://localhost:5000
==================================================
```

> The server automatically creates the default admin/user accounts and seeds sample books on first run.

---

### Step 5 — Open the Frontend

Open `frontend/index.html` in your browser. You can either:

- **Double-click** the file (works for basic use), or
- **Serve it with a local server** for full functionality:

```bash
# Python built-in server (from the frontend/ folder)
cd frontend
python -m http.server 8080
# Then open: http://localhost:8080
```

---

## 🔑 Demo Accounts

| Role  | Email             | Password  |
|-------|-------------------|-----------|
| Admin | admin@gmail.com   | admin123  |
| User  | user@gmail.com    | user123   |

These accounts are created automatically when the Flask server starts for the first time.

---

## 🌐 API Reference

### Authentication

| Method | Endpoint    | Body                              | Description         |
|--------|-------------|-----------------------------------|---------------------|
| POST   | /register   | `{username, email, password}`     | Register a new user |
| POST   | /login      | `{email, password}`               | Login, returns JWT  |

### Books (Public)

| Method | Endpoint              | Auth | Description                  |
|--------|-----------------------|------|------------------------------|
| GET    | /books                | No   | Fetch all books              |
| GET    | /search?query=python  | No   | Search by title/author/cat   |
| GET    | /download/\<id\>      | Yes  | Download a PDF file          |

### Admin (Requires Admin JWT)

| Method | Endpoint               | Auth  | Description           |
|--------|------------------------|-------|-----------------------|
| POST   | /upload-book           | Admin | Upload a new PDF book |
| PUT    | /update-book/\<id\>    | Admin | Edit book metadata    |
| DELETE | /delete-book/\<id\>    | Admin | Delete a book + file  |
| GET    | /admin/stats           | Admin | Dashboard stats       |

### JWT Usage

Include the token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 🛠 Troubleshooting

### `mysqlclient` installation fails on Windows

```bash
pip install PyMySQL
```

Then in `backend/app.py`, add before `mysql.init_app(app)`:

```python
import pymysql
pymysql.install_as_MySQLdb()
```

### CORS error in browser

Ensure the Flask server is running on `http://localhost:5000`. The API base URL in all JS files is set to this address. If you change the port, update `API_BASE` in all four JS files.

### "Can't connect to MySQL"

1. Make sure MySQL service is running.
2. Verify credentials in `backend/config.py`.
3. Make sure the `ebook_db` database was created (Step 1).

### Files not downloading

Make sure the `backend/uploads/books/` directory exists and Flask has write permission to it. The app creates it automatically, but you can create it manually:

```bash
mkdir -p backend/uploads/books
```

---

## 🔒 Security Notes

- Passwords are hashed using **Werkzeug's PBKDF2-SHA256** — never stored in plaintext.
- JWT tokens expire after **24 hours**.
- Admin routes are protected server-side — the role check happens in the backend, not just the frontend.
- Only `.pdf` files are accepted for upload (validated on both client and server).
- Filenames are sanitised using `werkzeug.utils.secure_filename` and prefixed with a timestamp to prevent collisions.

---

## 📸 Page Descriptions

| Page | URL | Description |
|------|-----|-------------|
| Landing | index.html | Hero page with CTA buttons |
| Login | login.html | Email + password form with demo credentials |
| Register | register.html | Sign-up form with validation |
| Dashboard | dashboard.html | Book grid with search + download |
| Admin | admin.html | Upload form + book table with edit/delete |

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Python 3, Flask, Flask-CORS |
| Database | MySQL 8 |
| Auth | JWT (PyJWT) + Werkzeug password hashing |
| File Storage | Local filesystem (`uploads/books/`) |

---

## 📄 License

This project is provided for educational purposes. Feel free to extend and customise it.
