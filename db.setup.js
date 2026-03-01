import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// administrative connection uses superuser credentials from environment variables
const adminConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_SUPERUSER || 'mster',
  password: process.env.DB_SUPERPASS || '',
  multipleStatements: true
};

// SQL sequence mirroring the original schema.sql contents
const schemaSql = `
CREATE DATABASE IF NOT EXISTS download_portal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'download_user'@'%'
  IDENTIFIED BY '269608Raj$';

GRANT ALL PRIVILEGES ON download_portal.* 
  TO 'download_user'@'%';

FLUSH PRIVILEGES;

USE download_portal;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin') DEFAULT 'admin',
  is_active TINYINT(1) DEFAULT 1,
  last_login DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO categories (name, description, is_active) VALUES
('Utility', 'System utilities and tools', 1),
('Software', 'Main application installers', 1),
('Documents', 'PDFs, manuals, guides', 1),
('Updates', 'Patch files and updates', 1),
('Apps', 'Desktop or mobile apps', 1),
('Drivers', 'Hardware drivers', 1),
('Reports', 'Generated system reports', 1),
('Installers', 'Setup and installation files', 1),
('Media', 'Images, videos, audio files', 1),
('Archives', 'Compressed files and backups', 1);


CREATE TABLE files (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  category_id INT UNSIGNED,
  file_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL,
  downloads INT UNSIGNED DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  uploaded_by INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_files_category
    FOREIGN KEY (category_id)
    REFERENCES categories(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_files_user
    FOREIGN KEY (uploaded_by)
    REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE download_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_id INT UNSIGNED NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent VARCHAR(255),
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_logs_file
    FOREIGN KEY (file_id)
    REFERENCES files(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_files_active ON files(is_active);
CREATE INDEX idx_files_category ON files(category_id);
CREATE INDEX idx_logs_file ON download_logs(file_id);
`;

async function run() {
  console.log('🔌 connecting to mysql as', adminConfig.user);
  const conn = await mysql.createConnection(adminConfig);

  try {
    await conn.query(schemaSql);
    console.log('✅ database, user and tables created/updated successfully');
  } catch (err) {
    console.error('❌ error running setup queries:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

run();
