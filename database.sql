-- =========================================
-- DATABASE SCRIPT FOR PROJECT STORAGE
-- Supports: SQLite (compatible with MySQL/PostgreSQL with minor tweaks)
-- Author: Your Project
-- =========================================

-- =========================================
-- 1. Users table (for login/registration)
-- =========================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,       -- Unique user ID
    username TEXT UNIQUE NOT NULL,               -- Username must be unique
    password_hash TEXT NOT NULL,                 -- Hashed password
    email TEXT UNIQUE,                           -- Optional email
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Optional: insert demo users (hash passwords in your backend)
INSERT OR IGNORE INTO users (username, password_hash, email) VALUES
('mohjay', 'PLACEHOLDER_HASH_1', 'mohjay@example.com'),
('fatima', 'PLACEHOLDER_HASH_2', 'fatima@example.com');

-- =========================================
-- 2. Example table: user_posts (storing user data)
-- =========================================
CREATE TABLE IF NOT EXISTS user_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,                   -- Foreign key to users
    title TEXT NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Optional: insert sample posts
INSERT OR IGNORE INTO user_posts (user_id, title, content) VALUES
(1, 'Welcome Post', 'This is a sample post for user Moh Jay'),
(2, 'Hello World', 'This is a sample post for user Fatima');

-- =========================================
-- 3. Example table: settings (project-wide or user-specific settings)
-- =========================================
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,                            -- Null for global settings
    setting_name TEXT NOT NULL,
    setting_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Sample global setting
INSERT OR IGNORE INTO settings (user_id, setting_name, setting_value) VALUES
(NULL, 'site_name', 'My Project App'),
(NULL, 'theme', 'light');

-- =========================================
-- 4. Queries to check everything
-- =========================================
-- Select all users
SELECT * FROM users;

-- Select all posts with user info
SELECT u.username, p.title, p.content, p.created_at
FROM user_posts p
JOIN users u ON p.user_id = u.id;

-- Select all settings
SELECT * FROM settings;