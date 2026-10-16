CREATE DATABASE IF NOT EXISTS campus_maintenance;
USE campus_maintenance;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('requester','technician','admin') NOT NULL DEFAULT 'requester',
  phone VARCHAR(30) NULL,
  specialty VARCHAR(50) NULL,
  is_active TINYINT(1) DEFAULT 1,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tracking_number VARCHAR(20) NOT NULL UNIQUE,
  requester_id INT NOT NULL,
  building VARCHAR(100) NOT NULL,
  location VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  is_safety_issue TINYINT(1) NOT NULL DEFAULT 0,
  priority ENUM('Low','Medium','High') NULL,
  status ENUM('Submitted','Assigned','In Progress','On Hold','Completed') NOT NULL DEFAULT 'Submitted',
  assigned_to INT NULL,
  admin_note TEXT NULL,
  completion_notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);