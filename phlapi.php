<?php
// Konfigurasi Header untuk CORS dan JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle Preflight Request (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- KONEKSI DATABASE ---
require_once 'db_config.php';

try {
    createTables($pdo);
} catch (\Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Gagal menginisialisasi tabel: " . $e->getMessage()]);
    exit();
}

// --- FUNGSI UTAMA ---

function createTables($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        capacity INTEGER NOT NULL,
        location VARCHAR(255) NOT NULL,
        isAvailable TINYINT(1) DEFAULT 1
    ) ENGINE=InnoDB");

    $pdo->exec("CREATE TABLE IF NOT EXISTS bookings (
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
    ) ENGINE=InnoDB");
}

// --- ROUTING LOGIC (DIPERBAIKI) ---

// 1. Ambil URI dan Script Name
$request_uri = $_SERVER['REQUEST_URI'];
$script_name = $_SERVER['SCRIPT_NAME'];

// 2. Ambil path saja (buang query string ?param=value)
$request_path = parse_url($request_uri, PHP_URL_PATH);

// 3. Hitung endpoint relatif
// Jika script dijalankan di /folder/api.php, dan request ke /folder/api.php/rooms
// Maka kita ingin mendapatkan string "/rooms"
if (strpos($request_path, $script_name) === 0) {
    $path_info = substr($request_path, strlen($script_name));
} else {
    $path_info = $request_path;
}

// 4. Pastikan path_info tidak kosong (default ke '/')
if (empty($path_info)) {
    $path_info = '/';
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// --- DEFINISI ROUTES ---

// Route: Root (Untuk Cek Status)
if ($path_info === '/') {
    echo json_encode([
        "status" => "online", 
        "message" => "PDB Booking API is running",
        "endpoints" => [
            "GET /rooms",
            "POST /rooms",
            "GET /bookings",
            "POST /bookings"
        ]
    ]);
}

// Route: Rooms (allow trailing slash)
elseif (preg_match('#^/rooms/?$#', $path_info)) {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM rooms");
        $rooms = $stmt->fetchAll();
        foreach ($rooms as &$room) {
            $room['isAvailable'] = (bool)$room['isAvailable'];
        }
        echo json_encode($rooms);
    } 
    elseif ($method === 'POST') {
        $sql = "INSERT INTO rooms (id, name, capacity, location, isAvailable) VALUES (?,?,?,?,?)";
        $stmt = $pdo->prepare($sql);
        try {
            $stmt->execute([
                $input['id'],
                $input['name'],
                $input['capacity'],
                $input['location'],
                isset($input['isAvailable']) && $input['isAvailable'] ? 1 : 0
            ]);
            echo json_encode(["message" => "Room created", "data" => $input]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["error" => $e->getMessage()]);
        }
    }
}
// Route: Delete Room
elseif (preg_match('#^/rooms/(.+)$#', $path_info, $matches) && $method === 'DELETE') {
    $id = $matches[1];
    $sql = "DELETE FROM rooms WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    try {
        $stmt->execute([$id]);
        echo json_encode(["message" => "Room deleted", "changes" => $stmt->rowCount()]);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
// Route: Bookings (allow trailing slash)
elseif (preg_match('#^/bookings/?$#', $path_info)) {
    if ($method === 'GET') {
        $sql = "SELECT 
                  b.*, 
                  r.name as roomName, r.capacity as roomCapacity, r.location as roomLocation 
                FROM bookings b 
                JOIN rooms r ON b.roomId = r.id
                ORDER BY b.timestamp DESC";
        
        $stmt = $pdo->query($sql);
        $rows = $stmt->fetchAll();
        
        $bookings = array_map(function($row) {
            return [
                "id" => $row['id'],
                "room" => [
                    "id" => $row['roomId'],
                    "name" => $row['roomName'],
                    "capacity" => (int)$row['roomCapacity'],
                    "location" => $row['roomLocation'],
                    "isAvailable" => true 
                ],
                "student" => [
                    "name" => $row['studentName'],
                    "nim" => $row['studentNim'],
                    "pdbClass" => $row['pdbClass'],
                    "subject" => isset($row['subject']) ? $row['subject'] : '',
                    "contact" => $row['contact']
                ],
                "date" => $row['date'],
                "timeSlot" => $row['timeSlot'],
                "timestamp" => (int)$row['timestamp'],
                "status" => $row['status'],
                "aiMessage" => $row['aiMessage']
            ];
        }, $rows);

        echo json_encode($bookings);
    }
    elseif ($method === 'POST') {
        $sql = "INSERT INTO bookings (
            id, roomId, studentName, studentNim, pdbClass, subject, contact, date, timeSlot, timestamp, status, aiMessage
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
        
        $stmt = $pdo->prepare($sql);
        try {
            $stmt->execute([
                $input['id'],
                $input['room']['id'],
                $input['student']['name'],
                $input['student']['nim'],
                $input['student']['pdbClass'],
                $input['student']['subject'] ?? '',
                $input['student']['contact'] ?? '',
                $input['date'],
                $input['timeSlot'],
                $input['timestamp'],
                $input['status'],
                $input['aiMessage']
            ]);
            echo json_encode(["message" => "Booking created", "data" => $input]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["error" => $e->getMessage()]);
        }
    }
}
// Route: Delete Booking
elseif (preg_match('#^/bookings/(.+)$#', $path_info, $matches) && $method === 'DELETE') {
    $id = $matches[1];
    $sql = "DELETE FROM bookings WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    try {
        $stmt->execute([$id]);
        echo json_encode(["message" => "Booking deleted", "changes" => $stmt->rowCount()]);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
else {
    http_response_code(404);
    echo json_encode(["error" => "Endpoint not found: " . $path_info]);
}
?>