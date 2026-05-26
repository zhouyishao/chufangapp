CREATE DATABASE IF NOT EXISTS chufangapp DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chufangapp;

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(32) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(32) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_admin_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ingredient_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ingredient_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ingredients (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  category_id BIGINT UNSIGNED NULL,
  image_url VARCHAR(255) NULL,
  description TEXT NULL,
  season_months_json VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ingredients_name (name),
  KEY idx_ingredients_category_id (category_id),
  CONSTRAINT fk_ingredients_category_id FOREIGN KEY (category_id) REFERENCES ingredient_categories (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recipes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(80) NOT NULL,
  cover_url VARCHAR(255) NULL,
  description TEXT NULL,
  ingredients_json TEXT NULL,
  steps_json TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Demo admin account (username: admin, password: admin123)
-- Password hash generated with bcryptjs(10). You can rotate it anytime.
INSERT INTO admin_users (username, password_hash, nickname)
VALUES ('admin', '$2a$10$7QGwp./BqgQq2JgnyrLq7O8x8x9HkM8I0DqV9kM8iH1d5ZmzqYtTu', '管理员')
ON DUPLICATE KEY UPDATE username=username;

