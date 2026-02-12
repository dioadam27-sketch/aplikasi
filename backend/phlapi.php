<?php
// --- HEADER CORS & CONFIG ---
// Allow from any origin
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');    // cache for 1 day
}

// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
    
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    
    exit(0);
}

header("Content-Type: application/json; charset=UTF-8");

// Error Handling (Disable display, log to file)
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/db_config.php';

// --- HELPER FUNCTIONS ---
if (!function_exists('jsonResponse')) {
    function jsonResponse($data, $code = 200) {
        http_response_code($code);
        echo json_encode($data);
        exit();
    }
}

if (!function_exists('getJsonInput')) {
    function getJsonInput() {
        $input = json_decode(file_get_contents('php://input'), true);
        return $input ?: $_POST;
    }
}

// --- GENERIC HANDLER FOR SIMPDB ---
if (!function_exists('handleGenericSimpdb')) {
    function handleGenericSimpdb($pdo, $action, $input) {
        $table = $input['table'] ?? '';
        $validTables = [
            'courses', 'lecturers', 'rooms', 'classes', 'schedule', 'teaching_logs', 'settings',
            'helpdesk_requests', 'helpdesk_complaints',
            'monev_surveys', 'monev_questions', 'monev_responses', 'monev_answers', 'monev_allowlist'
        ];
        
        if (!in_array($table, $validTables)) {
            throw new Exception("Invalid or missing table: " . htmlspecialchars($table));
        }

        $data = $input['data'] ?? [];
        $id = $input['id'] ?? ($data['id'] ?? null);

        if ($action === 'delete') {
            $stmt = $pdo->prepare("DELETE FROM $table WHERE id = ?");
            $stmt->execute([$id]);
        } 
        elseif ($action === 'clear') {
            $pdo->query("DELETE FROM $table");
        }
        elseif ($action === 'add' || $action === 'update') {
            // Upsert Logic
            $cols = array_keys($data);
            
            // Handle JSON Arrays
            foreach ($data as $k => $v) {
                if (is_array($v)) $data[$k] = json_encode($v);
            }
            $vals = array_values($data);

            $colsStr = implode(",", $cols);
            $placeholders = implode(",", array_fill(0, count($cols), "?"));
            
            // ON DUPLICATE KEY UPDATE string
            $updateStr = "";
            foreach ($cols as $col) {
                if ($col === 'id') continue; 
                $updateStr .= "$col = VALUES($col), ";
            }
            $updateStr = rtrim($updateStr, ", ");

            $sql = "INSERT INTO $table ($colsStr) VALUES ($placeholders) ON DUPLICATE KEY UPDATE $updateStr";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($vals);
        }
        elseif ($action === 'bulk_add') {
            if (!is_array($data) || empty($data)) return;
            
            $firstItem = $data[0];
            $cols = array_keys($firstItem);
            $colsStr = implode(",", $cols);
            $placeholders = "(" . implode(",", array_fill(0, count($cols), "?")) . ")";
            
            $sql = "INSERT IGNORE INTO $table ($colsStr) VALUES ";
            $flatValues = [];
            
            $valSqls = [];
            foreach ($data as $row) {
                $valSqls[] = $placeholders;
                foreach ($row as $k => $v) {
                    $flatValues[] = is_array($v) ? json_encode($v) : $v;
                }
            }
            $sql .= implode(",", $valSqls);
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($flatValues);
        }

        jsonResponse(["status" => "success"]);
    }
}

// --- MAIN ROUTING LOGIC ---
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Fallback: Check JSON body for 'action' if not in GET
$jsonInput = getJsonInput();
if (empty($action) && isset($jsonInput['action'])) {
    $action = $jsonInput['action'];
}

try {
    switch ($action) {
        // --- 1. RUANG PDB / HR APP ---
        case 'fetch_pdb_rooms':
            $stmt = $pdo->query("SELECT * FROM rooms");
            $rooms = $stmt->fetchAll();
            foreach($rooms as &$r) $r['isAvailable'] = (bool)$r['isAvailable'];
            jsonResponse($rooms);
            break;

        case 'fetch_pdb_bookings':
            $sql = "SELECT b.*, r.name as roomName, r.capacity, r.location FROM bookings b JOIN rooms r ON b.roomId = r.id ORDER BY b.timestamp DESC";
            $stmt = $pdo->query($sql);
            $rows = $stmt->fetchAll();
            $data = array_map(function($row) {
                return [
                    "id" => $row['id'],
                    "room" => ["id" => $row['roomId'], "name" => $row['roomName'], "capacity" => $row['capacity'], "location" => $row['location']],
                    "student" => ["name" => $row['studentName'], "nim" => $row['studentNim'], "pdbClass" => $row['pdbClass'], "subject" => $row['subject'], "contact" => $row['contact']],
                    "date" => $row['date'], "timeSlot" => $row['timeSlot'], "timestamp" => (int)$row['timestamp'], "status" => $row['status'], "aiMessage" => $row['aiMessage']
                ];
            }, $rows);
            jsonResponse($data);
            break;

        case 'pdb_create_room':
            $stmt = $pdo->prepare("INSERT INTO rooms (id, name, capacity, location, isAvailable) VALUES (?,?,?,?,?)");
            $stmt->execute([$jsonInput['id'], $jsonInput['name'], $jsonInput['capacity'], $jsonInput['location'], 1]);
            jsonResponse(["status" => "success"]);
            break;

        case 'pdb_update_room_status':
            $stmt = $pdo->prepare("UPDATE rooms SET isAvailable = ? WHERE id = ?");
            $stmt->execute([$jsonInput['isAvailable'] ? 1 : 0, $jsonInput['id']]);
            jsonResponse(["status" => "success"]);
            break;

        case 'pdb_delete_room':
            $stmt = $pdo->prepare("DELETE FROM rooms WHERE id = ?");
            $stmt->execute([$jsonInput['id']]);
            jsonResponse(["status" => "success"]);
            break;

        case 'pdb_create_booking':
            $stmt = $pdo->prepare("INSERT INTO bookings (id, roomId, studentName, studentNim, pdbClass, subject, contact, date, timeSlot, timestamp, status, aiMessage) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([
                $jsonInput['id'], $jsonInput['room']['id'], $jsonInput['student']['name'], $jsonInput['student']['nim'],
                $jsonInput['student']['pdbClass'], $jsonInput['student']['subject'], $jsonInput['student']['contact'],
                $jsonInput['date'], $jsonInput['timeSlot'], $jsonInput['timestamp'], $jsonInput['status'], $jsonInput['aiMessage']
            ]);
            jsonResponse(["status" => "success"]);
            break;

        case 'pdb_delete_booking':
            $stmt = $pdo->prepare("DELETE FROM bookings WHERE id = ?");
            $stmt->execute([$jsonInput['id']]);
            jsonResponse(["status" => "success"]);
            break;

        // --- 2. MONEV / KUESIONER ---
        case 'fetch_all_simpdb': 
            $stmt = $pdo->query("SELECT * FROM lecturers ORDER BY name ASC");
            jsonResponse(['lecturers' => $stmt->fetchAll()]);
            break;

        case 'monev_surveys':
            $adminMode = isset($_GET['admin']) && $_GET['admin'] === 'true';
            $nip = $_GET['nip'] ?? '';
            
            if ($adminMode) {
                $stmt = $pdo->query("SELECT * FROM monev_surveys ORDER BY createdAt DESC");
                $surveys = $stmt->fetchAll();
            } else {
                // FIXED QUERY: Menggunakan EXISTS untuk logika Whitelist yang lebih akurat
                $sql = "SELECT s.*, 
                        (SELECT COUNT(*) FROM monev_responses r WHERE r.surveyId = s.id AND r.respondentNip = ?) as responseCount
                        FROM monev_surveys s 
                        WHERE s.isActive = 1 
                        AND (
                            NOT EXISTS (SELECT 1 FROM monev_allowlist al WHERE al.surveyId = s.id)
                            OR
                            EXISTS (SELECT 1 FROM monev_allowlist al WHERE al.surveyId = s.id AND al.nip = ?)
                        )
                        ORDER BY s.createdAt DESC";
                        
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$nip, $nip]);
                $surveys = $stmt->fetchAll();
            }
            foreach($surveys as &$s) {
                $s['isActive'] = (bool)$s['isActive'];
                $s['hasResponded'] = isset($s['responseCount']) && $s['responseCount'] > 0;
                unset($s['responseCount']);
            }
            jsonResponse($surveys);
            break;

        case 'monev_questions':
            $sid = $_GET['surveyId'];
            $stmt = $pdo->prepare("SELECT * FROM monev_questions WHERE surveyId = ? ORDER BY orderNum ASC");
            $stmt->execute([$sid]);
            $qs = $stmt->fetchAll();
            foreach($qs as &$q) {
                // VALIDATION: Check if options exist before decoding
                $q['options'] = isset($q['options']) ? json_decode($q['options']) : [];
                $q['config'] = isset($q['config']) ? json_decode($q['config']) : null;
            }
            jsonResponse($qs);
            break;

        case 'monev_create_survey':
            $data = $jsonInput['data'] ?? $jsonInput; // Handle wrapped or unwrapped data
            
            if (empty($data['id'])) {
                jsonResponse(["status" => "error", "message" => "Survey ID missing"], 400);
            }

            $sid = $data['id'];
            
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO monev_surveys (id, title, description, startDate, endDate, isActive) VALUES (?,?,?,?,?,?)");
            $stmt->execute([$sid, $data['title'], $data['description'], $data['startDate'], $data['endDate'], 1]);

            if (isset($data['questions']) && is_array($data['questions'])) {
                $qStmt = $pdo->prepare("INSERT INTO monev_questions (id, surveyId, text, type, options, config, orderNum) VALUES (?,?,?,?,?,?,?)");
                $idx = 0;
                foreach ($data['questions'] as $q) {
                    // VALIDATION: Handle missing options/config for text questions
                    $optionsJson = isset($q['options']) ? json_encode($q['options']) : json_encode([]);
                    $configJson = isset($q['config']) ? json_encode($q['config']) : json_encode([]);
                    
                    $qStmt->execute([
                        $q['id'], $sid, $q['text'], $q['type'], 
                        $optionsJson, $configJson, $idx++
                    ]);
                }
            }

            if (!empty($data['allowedNips']) && is_array($data['allowedNips'])) {
                $aStmt = $pdo->prepare("INSERT INTO monev_allowlist (surveyId, nip) VALUES (?,?)");
                foreach ($data['allowedNips'] as $nip) {
                    $aStmt->execute([$sid, $nip]);
                }
            }
            
            $pdo->commit();
            jsonResponse(["status" => "success"]);
            break;

        case 'monev_delete_survey':
            $id = $jsonInput['id'];
            if (!$id) jsonResponse(["status" => "error", "message" => "No ID provided"], 400);

            $pdo->beginTransaction();
            try {
                // Delete Deep (Cascading manually if FKs missing)
                $pdo->prepare("DELETE FROM monev_answers WHERE responseId IN (SELECT id FROM monev_responses WHERE surveyId = ?)")->execute([$id]);
                $pdo->prepare("DELETE FROM monev_responses WHERE surveyId = ?")->execute([$id]);
                $pdo->prepare("DELETE FROM monev_questions WHERE surveyId = ?")->execute([$id]);
                $pdo->prepare("DELETE FROM monev_allowlist WHERE surveyId = ?")->execute([$id]);
                $pdo->prepare("DELETE FROM monev_surveys WHERE id = ?")->execute([$id]);
                $pdo->commit();
                jsonResponse(["status" => "success"]);
            } catch (Exception $e) {
                $pdo->rollBack();
                jsonResponse(["status" => "error", "message" => $e->getMessage()], 500);
            }
            break;

        case 'monev_submit':
            // VALIDATION: Check required fields
            if (empty($jsonInput['surveyId']) || empty($jsonInput['answers'])) {
                jsonResponse(["status" => "error", "message" => "Data kuesioner tidak lengkap."], 400);
            }

            $sid = $jsonInput['surveyId'];
            $nip = $jsonInput['nip'] ?? 'ANONYMOUS';
            $answers = $jsonInput['answers'];
            $rid = uniqid('resp_');

            // Double check if already submitted
            $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM monev_responses WHERE surveyId = ? AND respondentNip = ?");
            $checkStmt->execute([$sid, $nip]);
            if ($checkStmt->fetchColumn() > 0) {
                jsonResponse(["status" => "error", "message" => "Anda sudah mengisi kuesioner ini."], 400);
            }

            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO monev_responses (id, surveyId, respondentNip) VALUES (?,?,?)");
            $stmt->execute([$rid, $sid, $nip]);

            // VALIDATION: Ensure answers is array before loop
            if (is_array($answers)) {
                $aStmt = $pdo->prepare("INSERT INTO monev_answers (responseId, questionId, value) VALUES (?,?,?)");
                foreach ($answers as $ans) {
                    if (isset($ans['questionId']) && isset($ans['value'])) {
                        $aStmt->execute([$rid, $ans['questionId'], $ans['value']]);
                    }
                }
            }
            $pdo->commit();
            jsonResponse(["status" => "success"]);
            break;

        case 'monev_results':
            $sid = $_GET['surveyId'];
            
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM monev_responses WHERE surveyId = ?");
            $stmt->execute([$sid]);
            $total = $stmt->fetchColumn();

            $qStmt = $pdo->prepare("SELECT * FROM monev_questions WHERE surveyId = ? ORDER BY orderNum ASC");
            $qStmt->execute([$sid]);
            $questions = $qStmt->fetchAll();

            $results = [];
            foreach ($questions as $q) {
                // UPDATE: Decode config agar bisa dibaca frontend untuk jenis Chart (Pie/Bar/List)
                $config = isset($q['config']) ? json_decode($q['config']) : null;
                $qData = ["id" => $q['id'], "text" => $q['text'], "type" => $q['type'], "config" => $config];

                // SAFETY: fetchAll returns false on failure, we ensure array
                if ($q['type'] === 'text') {
                    $ansStmt = $pdo->prepare("SELECT value FROM monev_answers WHERE questionId = ? LIMIT 20");
                    $ansStmt->execute([$q['id']]);
                    $data = $ansStmt->fetchAll(PDO::FETCH_ASSOC);
                } else {
                    $ansStmt = $pdo->prepare("SELECT value, COUNT(*) as count FROM monev_answers WHERE questionId = ? GROUP BY value");
                    $ansStmt->execute([$q['id']]);
                    $data = $ansStmt->fetchAll(PDO::FETCH_ASSOC);
                }
                if ($data === false) $data = [];

                // NEW: Fetch Detailed Responses with Names
                $detailStmt = $pdo->prepare("
                    SELECT a.value, COALESCE(l.name, r.respondentNip) as respondentName, r.respondentNip 
                    FROM monev_answers a 
                    JOIN monev_responses r ON a.responseId = r.id 
                    LEFT JOIN lecturers l ON r.respondentNip = l.nip 
                    WHERE a.questionId = ?
                    ORDER BY l.name ASC
                ");
                $detailStmt->execute([$q['id']]);
                $details = $detailStmt->fetchAll(PDO::FETCH_ASSOC);
                if ($details === false) $details = [];

                $results[] = ["question" => $qData, "data" => $data, "details" => $details];
            }

            jsonResponse(["totalRespondents" => $total, "results" => $results]);
            break;

        // --- 3. CUSTOM SCHEDULE ACTIONS ---
        case 'lock_all_schedule':
            $isLocked = !empty($jsonInput['data']['isLocked']) ? 1 : 0;
            $stmt = $pdo->prepare("UPDATE schedule SET isLocked = ?");
            $stmt->execute([$isLocked]);
            jsonResponse(["status" => "success", "message" => "All schedules updated"]);
            break;

        // --- 4. SIMPDB GENERIC CRUD ---
        case 'add':
        case 'update':
        case 'delete':
        case 'clear':
        case 'bulk_add':
            handleGenericSimpdb($pdo, $action, $jsonInput);
            break;

        // --- 5. DEFAULT FETCH SIMPDB ---
        default:
            $tables = ['courses', 'lecturers', 'rooms', 'classes', 'schedule', 'teaching_logs', 'settings'];
            $result = [];
            foreach ($tables as $t) {
                try {
                    $stmt = $pdo->query("SELECT * FROM $t");
                    $result[$t] = $stmt->fetchAll();
                } catch (Exception $e) {
                    $result[$t] = [];
                }
            }
            jsonResponse($result);
            break;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>