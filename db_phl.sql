
-- Database Schema untuk Sistem Booking PDB
-- Platform: Universal SQL (SQLite / MySQL Compatible)

-- 1. Tabel Rooms (Ruangan)
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL,
    location VARCHAR(255) NOT NULL,
    isAvailable TINYINT(1) DEFAULT 1
);

-- 2. Tabel Bookings (Pemesanan)
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(255) PRIMARY KEY,
    roomId VARCHAR(255) NOT NULL,
    studentName VARCHAR(255) NOT NULL,
    studentNim VARCHAR(255) NOT NULL,
    pdbClass VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    contact VARCHAR(255),
    date VARCHAR(20) NOT NULL,
    timeSlot VARCHAR(50) NOT NULL,
    timestamp BIGINT,
    status VARCHAR(50) DEFAULT 'APPROVED',
    aiMessage TEXT,
    FOREIGN KEY (roomId) REFERENCES rooms (id) ON DELETE CASCADE
);
