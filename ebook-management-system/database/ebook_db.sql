-- ================================================
-- E-Book Management System - Database Schema
-- ================================================

CREATE DATABASE IF NOT EXISTS ebook_db;
USE ebook_db;

-- Users table: stores all registered users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user','admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books table: stores e-book metadata
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    file_name VARCHAR(255),
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Downloads table: tracks which user downloaded which book
CREATE TABLE IF NOT EXISTS downloads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    book_id INT,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- ================================================
-- Sample Data
-- ================================================

-- Insert sample admin user (password: admin123)
INSERT INTO users (username, email, password, role) VALUES
('Admin', 'admin@gmail.com', 'pbkdf2:sha256:600000$rB8QyF3zLmKvXpNt$a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', 'admin'),
('User', 'user@gmail.com', 'pbkdf2:sha256:600000$rB8QyF3zLmKvXpNt$a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', 'user');

-- Note: Passwords above are placeholders. The app will insert correctly hashed passwords.
-- Run the seed script or register through the UI instead.

-- Sample books (uploaded_by = 1 = admin)
INSERT INTO books (title, author, category, description, file_name, uploaded_by) VALUES
('Python Crash Course', 'Eric Matthes', 'Programming', 'A hands-on, project-based introduction to programming using Python. Perfect for beginners who want to learn Python quickly.', 'sample_python.pdf', 1),
('Clean Code', 'Robert C. Martin', 'Software Engineering', 'A handbook of agile software craftsmanship. Learn how to write clean, maintainable, and efficient code.', 'sample_cleancode.pdf', 1),
('The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', 'A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.', 'sample_gatsby.pdf', 1),
('Data Science from Scratch', 'Joel Grus', 'Data Science', 'An introduction to data science using Python. Covers statistics, machine learning, and data analysis fundamentals.', 'sample_datascience.pdf', 1),
('Deep Work', 'Cal Newport', 'Productivity', 'Rules for focused success in a distracted world. Learn how to develop the ability to focus without distraction.', 'sample_deepwork.pdf', 1);
