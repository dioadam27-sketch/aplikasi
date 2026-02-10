
-- DATABASE TERPUSAT PDB APPS (SIMPDB, HELPDESK, ASSET, MONEV)
-- Excludes Repository (Arsip)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

-- ==========================================
-- 1. CORE & AUTH (Lecturers & Admin)
-- ==========================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL, -- In production use password_hash
  `role` ENUM('admin', 'staff') DEFAULT 'admin'
);

INSERT IGNORE INTO `users` (`username`, `password`, `role`) VALUES
('admin', '112233', 'admin');

CREATE TABLE IF NOT EXISTS `lecturers` (
  `id` VARCHAR(50) PRIMARY KEY,
  `nip` VARCHAR(50) UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `position` VARCHAR(100),
  `expertise` TEXT,
  `password` VARCHAR(255) -- Default is NIP
);

-- ==========================================
-- 2. SIMPDB (Akademik & Jadwal)
-- ==========================================

CREATE TABLE IF NOT EXISTS `courses` (
  `id` VARCHAR(50) PRIMARY KEY,
  `code` VARCHAR(20),
  `name` VARCHAR(255),
  `credits` INT,
  `coordinatorId` VARCHAR(50)
);

-- Shared Table for SIMPDB and Ruang PDB
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(100),
  `capacity` INT,
  `building` VARCHAR(100),
  `location` TEXT,
  `isAvailable` TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS `classes` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS `schedule` (
  `id` VARCHAR(50) PRIMARY KEY,
  `courseId` VARCHAR(50),
  `lecturerIds` TEXT, -- JSON Array
  `pjmkLecturerId` VARCHAR(50),
  `roomId` VARCHAR(50),
  `className` VARCHAR(50),
  `day` VARCHAR(20),
  `timeSlot` VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS `teaching_logs` (
  `id` VARCHAR(50) PRIMARY KEY,
  `scheduleId` VARCHAR(50),
  `lecturerId` VARCHAR(50),
  `week` INT,
  `timestamp` DATETIME,
  `date` DATE
);

-- ==========================================
-- 3. ASSET / RUANG PDB (Booking)
-- ==========================================

CREATE TABLE IF NOT EXISTS `bookings` (
    `id` VARCHAR(50) PRIMARY KEY,
    `roomId` VARCHAR(50) NOT NULL,
    `studentName` VARCHAR(255),
    `studentNim` VARCHAR(50),
    `pdbClass` VARCHAR(50),
    `subject` VARCHAR(255),
    `contact` VARCHAR(50),
    `date` VARCHAR(20),
    `timeSlot` VARCHAR(50),
    `timestamp` BIGINT,
    `status` VARCHAR(20) DEFAULT 'APPROVED',
    `aiMessage` TEXT,
    FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE
);

-- ==========================================
-- 4. HELPDESK (Layanan Mahasiswa)
-- ==========================================

CREATE TABLE IF NOT EXISTS `helpdesk_requests` (
    `id` VARCHAR(50) PRIMARY KEY,
    `studentName` VARCHAR(255),
    `studentId` VARCHAR(50),
    `studentClass` VARCHAR(20),
    `courseName` VARCHAR(255),
    `lecturerName` VARCHAR(255),
    `date` DATE,
    `type` VARCHAR(50),
    `reason` TEXT,
    `evidenceBase64` LONGTEXT,
    `status` VARCHAR(20) DEFAULT 'Menunggu',
    `rejectionReason` TEXT,
    `createdAt` BIGINT
);

CREATE TABLE IF NOT EXISTS `helpdesk_complaints` (
    `id` VARCHAR(50) PRIMARY KEY,
    `studentName` VARCHAR(255),
    `studentId` VARCHAR(50),
    `studentClass` VARCHAR(20),
    `category` VARCHAR(50),
    `description` TEXT,
    `adminNote` TEXT,
    `createdAt` BIGINT
);

-- ==========================================
-- 5. MONEV (Monitoring & Evaluasi)
-- ==========================================

CREATE TABLE IF NOT EXISTS `monev_surveys` (
    `id` VARCHAR(50) PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `startDate` DATE,
    `endDate` DATE,
    `isActive` TINYINT(1) DEFAULT 1,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `monev_questions` (
    `id` VARCHAR(50) PRIMARY KEY,
    `surveyId` VARCHAR(50),
    `text` TEXT NOT NULL,
    `type` ENUM('text', 'choice', 'likert', 'checkbox') NOT NULL,
    `options` TEXT, -- JSON Array for Choice/Checkbox e.g. ["Ya", "Tidak"]
    `config` TEXT, -- JSON Object for Custom Labels & Visualization e.g. {"chart": "pie", "minLabel": "Buruk", "maxLabel": "Baik"}
    `orderNum` INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `monev_allowlist` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `surveyId` VARCHAR(50),
    `nip` VARCHAR(50),
    UNIQUE KEY `unique_access` (`surveyId`, `nip`)
);

CREATE TABLE IF NOT EXISTS `monev_responses` (
    `id` VARCHAR(50) PRIMARY KEY,
    `surveyId` VARCHAR(50),
    `respondentNip` VARCHAR(50),
    `submittedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `monev_answers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `responseId` VARCHAR(50),
    `questionId` VARCHAR(50),
    `value` TEXT, -- Stores the answer (text, selected option, or rating number)
    INDEX `idx_q_val` (`questionId`, `value`(50))
);

COMMIT;
