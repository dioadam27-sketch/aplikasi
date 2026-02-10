<?php
// UNIVERSAL API FOR PDB APPS
// Handles: SIMPDB, Helpdesk, Asset Booking, Monev, Ruang PDB
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// --- DB CONFIG ---
require_once __DIR__ . '/db_config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? ($input['action'] ?? '');

// --- ROUTING ---

if ($method === 'GET') {
    // 1. GLOBAL FETCH (Legacy support for SIMPDB smart sync)
    if ($action === 'fetch_all_simpdb') {
        $data = [];
        $tables = ['courses', 'lecturers', 'rooms', 'classes', 'schedule', 'teaching_logs'];
        foreach ($tables as $t) {
            try {
                $stmt = $pdo->query("SELECT * FROM `$t`");
                $data[$t] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) {
                // Ignore missing tables for legacy fetch to prevent crash
                $data[$t] = [];
            }
        }
        echo json_encode($data);
        exit;
    }

    // 2. HELPDESK FETCH
    if ($action === 'fetch_helpdesk') {
        $reqs = $pdo->query("SELECT * FROM helpdesk_requests ORDER BY createdAt DESC")->fetchAll(PDO::FETCH_ASSOC);
        $comps = $pdo->query("SELECT * FROM helpdesk_complaints ORDER BY createdAt DESC")->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['requests' => $reqs, 'complaints' => $comps]);
        exit;
    }

    // 3. RUANG PDB: Fetch Rooms
    if ($action === 'fetch_pdb_rooms') {
        $stmt = $pdo->query("SELECT * FROM rooms");
        $rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);
        // Cast isAvailable to boolean for frontend consistency
        foreach ($rooms as &$room) {
            $room['isAvailable'] = (bool)$room['isAvailable'];
        }
        echo json_encode($rooms);
        exit;
    }

    // 4. RUANG PDB: Fetch Bookings (Nested Format)
    if ($action === 'fetch_pdb_bookings') {
        $sql = "SELECT 
                  b.*, 
                  r.name as roomName, r.capacity as roomCapacity, r.location as roomLocation 
                FROM bookings b 
                JOIN rooms r ON b.roomId = r.id
                ORDER BY b.timestamp DESC";
        
        $stmt = $pdo->query($sql);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
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
        exit;
    }

    // 5. MONEV: Fetch Active Surveys for User
    if ($action === 'monev_surveys') {
        $nip = $_GET['nip'] ?? '';
        $isAdmin = $_GET['admin'] === 'true';
        
        if ($isAdmin) {
            $sql = "SELECT * FROM monev_surveys ORDER BY createdAt DESC";
            $stmt = $pdo->query($sql);
        } else {
            // Check allowlist and date
            $sql = "SELECT s.* FROM monev_surveys s 
                    JOIN monev_allowlist a ON s.id = a.surveyId 
                    WHERE a.nip = ? AND s.isActive = 1 AND CURDATE() BETWEEN s.startDate AND s.endDate";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$nip]);
        }
        $surveys = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($surveys);
        exit;
    }

    // 6. MONEV: Fetch Questions
    if ($action === 'monev_questions') {
        $surveyId = $_GET['surveyId'];
        $stmt = $pdo->prepare("SELECT * FROM monev_questions WHERE surveyId = ? ORDER BY orderNum ASC");
        $stmt->execute([$surveyId]);
        $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse JSON fields
        foreach ($questions as &$q) {
            $q['options'] = json_decode($q['options']);
            $q['config'] = json_decode($q['config']);
        }
        echo json_encode($questions);
        exit;
    }

    // 7. MONEV: Fetch Results (Chart Data)
    if ($action === 'monev_results') {
        $surveyId = $_GET['surveyId'];
        
        // Get Total Respondents
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM monev_responses WHERE surveyId = ?");
        $stmt->execute([$surveyId]);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Get Answers Aggregation
        $questionsStmt = $pdo->prepare("SELECT * FROM monev_questions WHERE surveyId = ? ORDER BY orderNum ASC");
        $questionsStmt->execute([$surveyId]);
        $questions = $questionsStmt->fetchAll(PDO::FETCH_ASSOC);

        $results = [];
        foreach ($questions as $q) {
            // Count answers grouping
            $ansStmt = $pdo->prepare("SELECT value, COUNT(*) as count FROM monev_answers WHERE questionId = ? GROUP BY value");
            $ansStmt->execute([$q['id']]);
            $answers = $ansStmt->fetchAll(PDO::FETCH_ASSOC);
            
            $q['options'] = json_decode($q['options']);
            $q['config'] = json_decode($q['config']);
            
            $results[] = [
                'question' => $q,
                'data' => $answers
            ];
        }

        echo json_encode(['totalRespondents' => $total, 'results' => $results]);
        exit;
    }
}

if ($method === 'POST') {
    $table = $input['table'] ?? '';
    
    // --- HELPER: BASIC INSERT/UPDATE ---
    // (Used by SIMPDB mainly)
    if ($table && in_array($table, ['courses', 'lecturers', 'rooms', 'schedule', 'teaching_logs', 'classes', 'helpdesk_requests', 'helpdesk_complaints', 'bookings'])) {
        // Special Handling for Ruang PDB generic actions if needed, otherwise standard CRUD
        handleStandardCrud($pdo, $input['action'], $table, $input['data'], $input['id'] ?? null);
        exit;
    }

    // --- RUANG PDB SPECIFIC ACTIONS ---
    
    if ($action === 'pdb_create_booking') {
        // Handle complex nested object from PDB App
        $sql = "INSERT INTO bookings (
            id, roomId, studentName, studentNim, pdbClass, subject, contact, date, timeSlot, timestamp, status, aiMessage
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
        
        $stmt = $pdo->prepare($sql);
        try {
            $stmt->execute([
                $input['id'],
                $input['room']['id'], // Extract nested
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
            echo json_encode(["status" => "success", "message" => "Booking created"]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'pdb_delete_booking') {
        $id = $input['id'];
        $stmt = $pdo->prepare("DELETE FROM bookings WHERE id = ?");
        try {
            $stmt->execute([$id]);
            echo json_encode(["status" => "success", "message" => "Booking deleted"]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'pdb_create_room') {
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
            echo json_encode(["status" => "success", "message" => "Room created"]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'pdb_delete_room') {
        $id = $input['id'];
        $stmt = $pdo->prepare("DELETE FROM rooms WHERE id = ?");
        try {
            $stmt->execute([$id]);
            echo json_encode(["status" => "success", "message" => "Room deleted"]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }

    // --- MONEV ACTIONS ---
    
    // 1. Create Survey
    if ($action === 'monev_create_survey') {
        $data = $input['data'];
        $sql = "INSERT INTO monev_surveys (id, title, description, startDate, endDate, isActive) VALUES (?, ?, ?, ?, ?, ?)";
        $pdo->prepare($sql)->execute([
            $data['id'], $data['title'], $data['description'], $data['startDate'], $data['endDate'], 1
        ]);
        
        // Add Questions
        foreach ($data['questions'] as $idx => $q) {
            $qSql = "INSERT INTO monev_questions (id, surveyId, text, type, options, config, orderNum) VALUES (?, ?, ?, ?, ?, ?, ?)";
            $pdo->prepare($qSql)->execute([
                $q['id'], $data['id'], $q['text'], $q['type'], 
                json_encode($q['options']), json_encode($q['config']), $idx
            ]);
        }

        // Add Allowlist (Lecturers)
        if (!empty($data['allowedNips'])) {
            $allowSql = "INSERT INTO monev_allowlist (surveyId, nip) VALUES (?, ?)";
            $stmt = $pdo->prepare($allowSql);
            foreach ($data['allowedNips'] as $nip) {
                $stmt->execute([$data['id'], $nip]);
            }
        }
        echo json_encode(["status" => "success"]);
        exit;
    }

    // 2. Submit Response
    if ($action === 'monev_submit') {
        $surveyId = $input['surveyId'];
        $nip = $input['nip'];
        $answers = $input['answers']; // Array of {questionId, value}
        
        // Check if already submitted
        $check = $pdo->prepare("SELECT id FROM monev_responses WHERE surveyId = ? AND respondentNip = ?");
        $check->execute([$surveyId, $nip]);
        if ($check->rowCount() > 0) {
            echo json_encode(["status" => "error", "message" => "Anda sudah mengisi kuesioner ini."]);
            exit;
        }

        $responseId = 'RESP-' . time() . '-' . rand(100,999);
        
        $pdo->beginTransaction();
        try {
            $pdo->prepare("INSERT INTO monev_responses (id, surveyId, respondentNip) VALUES (?, ?, ?)")
                ->execute([$responseId, $surveyId, $nip]);
            
            $ansStmt = $pdo->prepare("INSERT INTO monev_answers (responseId, questionId, value) VALUES (?, ?, ?)");
            foreach ($answers as $ans) {
                $val = is_array($ans['value']) ? json_encode($ans['value']) : $ans['value'];
                $ansStmt->execute([$responseId, $ans['questionId'], $val]);
            }
            $pdo->commit();
            echo json_encode(["status" => "success"]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }
}

function handleStandardCrud($pdo, $act, $tbl, $data, $id) {
    try {
        if ($act === 'add' || $act === 'create') {
            $cols = array_keys($data);
            $vals = array_values($data);
            $qs = str_repeat("?,", count($cols)-1) . "?";
            $colStr = implode(",", $cols);
            
            // Handle array to json conversion if needed for standard tables
            foreach($vals as &$v) { if(is_array($v)) $v = json_encode($v); }

            $sql = "INSERT INTO `$tbl` ($colStr) VALUES ($qs)";
            $pdo->prepare($sql)->execute($vals);
        } 
        elseif ($act === 'update') {
            $set = "";
            $vals = [];
            foreach ($data as $k => $v) {
                $set .= "$k = ?, ";
                $vals[] = is_array($v) ? json_encode($v) : $v;
            }
            $set = rtrim($set, ", ");
            $vals[] = $id ?? $data['id'];
            $sql = "UPDATE `$tbl` SET $set WHERE id = ?";
            $pdo->prepare($sql)->execute($vals);
        }
        elseif ($act === 'delete') {
            $pdo->prepare("DELETE FROM `$tbl` WHERE id = ?")->execute([$id]);
        }
        echo json_encode(["status" => "success"]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>