<?php
// --- HEADER CORS & CONFIG ---
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    exit(0);
}

header("Content-Type: application/json; charset=UTF-8");

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

// --- GENERIC HANDLER ---
if (!function_exists('handleGenericSimpdb')) {
    function handleGenericSimpdb($pdo, $action, $input) {
        $table = $input['table'] ?? '';
        $validTables = [
            'courses', 'lecturers', 'rooms', 'classes', 'schedule', 'teaching_logs', 'settings',
            'helpdesk_requests', 'helpdesk_complaints',
            'monev_surveys', 'monev_questions', 'monev_responses', 'monev_answers', 'monev_allowlist',
            'student_surveys', 'student_questions', 'student_responses', 'student_answers',
            'workshop_participants', 'portal_apps'
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
            $cols = array_keys($data);
            foreach ($data as $k => $v) {
                if (is_array($v)) $data[$k] = json_encode($v);
            }
            $vals = array_values($data);
            $colsStr = implode(",", $cols);
            $placeholders = implode(",", array_fill(0, count($cols), "?"));
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

// --- MAIN ROUTING ---
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$jsonInput = getJsonInput();
if (empty($action) && isset($jsonInput['action'])) {
    $action = $jsonInput['action'];
}

try {
    switch ($action) {
        // --- 1. RUANG PDB ---
        case 'fetch_pdb_rooms':
            $stmt = $pdo->query("SELECT * FROM rooms");
            $rooms = $stmt->fetchAll();
            foreach($rooms as &$r) $r['isAvailable'] = (bool)$r['isAvailable'];
            jsonResponse($rooms);
            break;
        case 'fetch_pdb_bookings':
            $sql = "SELECT b.*, r.name as roomName, r.capacity, r.location FROM bookings b JOIN rooms r ON b.roomId = r.id ORDER BY b.timestamp DESC";
            $stmt = $pdo->query($sql);
            jsonResponse($stmt->fetchAll());
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

        // --- 2. MONEV (DOSEN) ---
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
                $q['options'] = isset($q['options']) ? json_decode($q['options']) : [];
                $q['config'] = isset($q['config']) ? json_decode($q['config']) : null;
            }
            jsonResponse($qs);
            break;
        case 'monev_create_survey':
            $data = $jsonInput['data'] ?? $jsonInput;
            $sid = $data['id'];
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO monev_surveys (id, title, description, startDate, endDate, isActive) VALUES (?,?,?,?,?,?)");
            $stmt->execute([$sid, $data['title'], $data['description'], $data['startDate'], $data['endDate'], 1]);
            if (isset($data['questions']) && is_array($data['questions'])) {
                $qStmt = $pdo->prepare("INSERT INTO monev_questions (id, surveyId, text, type, options, config, orderNum) VALUES (?,?,?,?,?,?,?)");
                $idx = 0;
                foreach ($data['questions'] as $q) {
                    $qStmt->execute([
                        $q['id'], $sid, $q['text'], $q['type'], 
                        json_encode($q['options'] ?? []), json_encode($q['config'] ?? []), $idx++
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
            $pdo->beginTransaction();
            try {
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
            $sid = $jsonInput['surveyId'];
            $nip = $jsonInput['nip'] ?? 'ANONYMOUS';
            $answers = $jsonInput['answers'];
            $rid = uniqid('resp_');
            $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM monev_responses WHERE surveyId = ? AND respondentNip = ?");
            $checkStmt->execute([$sid, $nip]);
            if ($checkStmt->fetchColumn() > 0) jsonResponse(["status" => "error", "message" => "Anda sudah mengisi kuesioner ini."], 400);
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO monev_responses (id, surveyId, respondentNip) VALUES (?,?,?)");
            $stmt->execute([$rid, $sid, $nip]);
            if (is_array($answers)) {
                $aStmt = $pdo->prepare("INSERT INTO monev_answers (responseId, questionId, value) VALUES (?,?,?)");
                foreach ($answers as $ans) {
                    $aStmt->execute([$rid, $ans['questionId'], $ans['value']]);
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
                $config = isset($q['config']) ? json_decode($q['config']) : null;
                $qData = ["id" => $q['id'], "text" => $q['text'], "type" => $q['type'], "config" => $config];
                if ($q['type'] === 'text') {
                    $ansStmt = $pdo->prepare("SELECT value FROM monev_answers WHERE questionId = ? LIMIT 20");
                    $ansStmt->execute([$q['id']]);
                    $data = $ansStmt->fetchAll(PDO::FETCH_ASSOC);
                } else {
                    $ansStmt = $pdo->prepare("SELECT value, COUNT(*) as count FROM monev_answers WHERE questionId = ? GROUP BY value");
                    $ansStmt->execute([$q['id']]);
                    $data = $ansStmt->fetchAll(PDO::FETCH_ASSOC);
                }
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
                $results[] = ["question" => $qData, "data" => $data, "details" => $details];
            }
            jsonResponse(["totalRespondents" => $total, "results" => $results]);
            break;

        // --- 3. STUDENT SURVEY (Kuesioner Mahasiswa) ---
        case 'student_surveys':
            $adminMode = isset($_GET['admin']) && $_GET['admin'] === 'true';
            $nim = $_GET['nip'] ?? ''; 
            
            if ($adminMode) {
                $stmt = $pdo->query("SELECT * FROM student_surveys ORDER BY createdAt DESC");
                $surveys = $stmt->fetchAll();
            } else {
                $sql = "SELECT s.*, 
                        (SELECT COUNT(*) FROM student_responses r WHERE r.surveyId = s.id AND r.respondentNim = ?) as responseCount
                        FROM student_surveys s 
                        WHERE s.isActive = 1 
                        ORDER BY s.createdAt DESC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$nim]);
                $surveys = $stmt->fetchAll();
            }
            foreach($surveys as &$s) {
                $s['isActive'] = (bool)$s['isActive'];
                $s['hasResponded'] = isset($s['responseCount']) && $s['responseCount'] > 0;
                unset($s['responseCount']);
            }
            jsonResponse($surveys);
            break;

        case 'student_questions':
            $sid = $_GET['surveyId'];
            $stmt = $pdo->prepare("SELECT * FROM student_questions WHERE surveyId = ? ORDER BY orderNum ASC");
            $stmt->execute([$sid]);
            $qs = $stmt->fetchAll();
            foreach($qs as &$q) {
                $q['options'] = isset($q['options']) ? json_decode($q['options']) : [];
                $q['config'] = isset($q['config']) ? json_decode($q['config']) : null;
            }
            jsonResponse($qs);
            break;

        case 'student_create_survey':
            $data = $jsonInput['data'] ?? $jsonInput;
            $sid = $data['id'];
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO student_surveys (id, title, description, startDate, endDate, isActive) VALUES (?,?,?,?,?,?)");
            $stmt->execute([$sid, $data['title'], $data['description'], $data['startDate'], $data['endDate'], 1]);
            
            if (isset($data['questions']) && is_array($data['questions'])) {
                $qStmt = $pdo->prepare("INSERT INTO student_questions (id, surveyId, text, type, options, config, orderNum) VALUES (?,?,?,?,?,?,?)");
                $idx = 0;
                foreach ($data['questions'] as $q) {
                    $qStmt->execute([
                        $q['id'], $sid, $q['text'], $q['type'], 
                        json_encode($q['options'] ?? []), json_encode($q['config'] ?? []), $idx++
                    ]);
                }
            }
            $pdo->commit();
            jsonResponse(["status" => "success"]);
            break;

        case 'student_delete_survey':
            $id = $jsonInput['id'];
            $pdo->beginTransaction();
            try {
                $pdo->prepare("DELETE FROM student_answers WHERE responseId IN (SELECT id FROM student_responses WHERE surveyId = ?)")->execute([$id]);
                $pdo->prepare("DELETE FROM student_responses WHERE surveyId = ?")->execute([$id]);
                $pdo->prepare("DELETE FROM student_questions WHERE surveyId = ?")->execute([$id]);
                $pdo->prepare("DELETE FROM student_surveys WHERE id = ?")->execute([$id]);
                $pdo->commit();
                jsonResponse(["status" => "success"]);
            } catch (Exception $e) {
                $pdo->rollBack();
                jsonResponse(["status" => "error", "message" => $e->getMessage()], 500);
            }
            break;

        case 'student_submit':
            $sid = $jsonInput['surveyId'];
            $nim = $jsonInput['nip'] ?? 'ANONYMOUS'; 
            $answers = $jsonInput['answers'];
            $rid = uniqid('resp_stu_');

            $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM student_responses WHERE surveyId = ? AND respondentNim = ?");
            $checkStmt->execute([$sid, $nim]);
            if ($checkStmt->fetchColumn() > 0) jsonResponse(["status" => "error", "message" => "Anda sudah mengisi kuesioner ini."], 400);

            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO student_responses (id, surveyId, respondentNim) VALUES (?,?,?)");
            $stmt->execute([$rid, $sid, $nim]);

            if (is_array($answers)) {
                $aStmt = $pdo->prepare("INSERT INTO student_answers (responseId, questionId, value) VALUES (?,?,?)");
                foreach ($answers as $ans) {
                    $aStmt->execute([$rid, $ans['questionId'], $ans['value']]);
                }
            }
            $pdo->commit();
            jsonResponse(["status" => "success"]);
            break;

        case 'student_results':
            $sid = $_GET['surveyId'];
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM student_responses WHERE surveyId = ?");
            $stmt->execute([$sid]);
            $total = $stmt->fetchColumn();

            $qStmt = $pdo->prepare("SELECT * FROM student_questions WHERE surveyId = ? ORDER BY orderNum ASC");
            $qStmt->execute([$sid]);
            $questions = $qStmt->fetchAll();

            $results = [];
            foreach ($questions as $q) {
                $config = isset($q['config']) ? json_decode($q['config']) : null;
                $qData = ["id" => $q['id'], "text" => $q['text'], "type" => $q['type'], "config" => $config];

                if ($q['type'] === 'text') {
                    $ansStmt = $pdo->prepare("SELECT value FROM student_answers WHERE questionId = ? LIMIT 20");
                    $ansStmt->execute([$q['id']]);
                    $data = $ansStmt->fetchAll(PDO::FETCH_ASSOC);
                } else {
                    $ansStmt = $pdo->prepare("SELECT value, COUNT(*) as count FROM student_answers WHERE questionId = ? GROUP BY value");
                    $ansStmt->execute([$q['id']]);
                    $data = $ansStmt->fetchAll(PDO::FETCH_ASSOC);
                }
                
                $detailStmt = $pdo->prepare("
                    SELECT a.value, r.respondentNim as respondentName, r.respondentNim 
                    FROM student_answers a 
                    JOIN student_responses r ON a.responseId = r.id 
                    WHERE a.questionId = ?
                    ORDER BY r.respondentNim ASC
                ");
                $detailStmt->execute([$q['id']]);
                $details = $detailStmt->fetchAll(PDO::FETCH_ASSOC);

                $results[] = ["question" => $qData, "data" => $data, "details" => $details];
            }
            jsonResponse(["totalRespondents" => $total, "results" => $results]);
            break;

        // --- 4. WORKSHOP PDB ---
        case 'fetch_workshop_participants':
            $stmt = $pdo->query("SELECT * FROM workshop_participants ORDER BY createdAt DESC");
            jsonResponse($stmt->fetchAll());
            break;

        // --- 5. PORTAL APPS (Custom Links) ---
        case 'fetch_portal_apps':
            $stmt = $pdo->query("SELECT * FROM portal_apps ORDER BY createdAt ASC");
            jsonResponse($stmt->fetchAll());
            break;

        // --- 6. CUSTOM ACTIONS ---
        case 'lock_all_schedule':
            $isLocked = !empty($jsonInput['data']['isLocked']) ? 1 : 0;
            $stmt = $pdo->prepare("UPDATE schedule SET isLocked = ?");
            $stmt->execute([$isLocked]);
            jsonResponse(["status" => "success"]);
            break;

        // --- 7. GENERIC CRUD ---
        case 'add':
        case 'update':
        case 'delete':
        case 'clear':
        case 'bulk_add':
            handleGenericSimpdb($pdo, $action, $jsonInput);
            break;

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