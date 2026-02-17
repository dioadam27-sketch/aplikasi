<?php
/**
 * API Backend Native cPanel untuk Repo PKKII (Metadata Only)
 * Updated: Fix CORS & Null Safety
 */

// --- 1. KONFIGURASI DATABASE ---
define('DB_HOST', 'localhost');
define('DB_USER', 'pkkiipendidikanu_dioarsip'); 
define('DB_PASS', '@Dioadam27');      
define('DB_NAME', 'pkkiipendidikanu_ruangpdb'); 

// --- 2. CORS & HEADERS (DIPERBAIKI) ---
// Izinkan semua origin jika HTTP_ORIGIN tidak terdeteksi (untuk tools/debug)
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
} else {
    header("Access-Control-Allow-Origin: *");
}

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");         
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    exit(0);
}

header("Content-Type: application/json; charset=UTF-8");

// Matikan display error agar tidak merusak format JSON
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

class ArchiveAPI {
    private $pdo;

    public function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            $this->response('error', 'Database Connection Failed: ' . $e->getMessage(), 500);
        }
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'GET') {
            $this->getAllData();
        } elseif ($method === 'POST') {
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
            if (!$input) $input = $_POST;

            if (empty($input) && json_last_error() !== JSON_ERROR_NONE) {
                 // Jangan exit, coba cek $_POST manual jika JSON gagal
                 if(empty($_POST)) {
                    $this->response('error', 'Invalid JSON payload', 400);
                 }
            }
            
            // Handle case where input is empty but method is POST (upload without body?)
            if (empty($input)) {
                $this->response('error', 'No data received', 400);
            }

            $this->routePostRequest($input);
        } else {
            $this->response('error', 'Method Not Allowed', 405);
        }
    }

    private function routePostRequest($data) {
        $action = $data['action'] ?? '';

        switch ($action) {
            case 'upload':
                $this->saveMetadata($data);
                break;
            case 'create_folder':
                $this->createFolder($data);
                break;
            case 'rename_folder':
                $this->renameFolder($data);
                break;
            case 'delete_archive':
                $this->deleteArchive($data);
                break;
            case 'delete_folder':
                $this->deleteFolder($data);
                break;
            case 'toggle_visibility': 
                $this->toggleVisibility($data);
                break;
            case 'move_archive': 
                $this->moveArchive($data);
                break;
            case 'rename_archive': 
                $this->renameArchive($data);
                break;
            default:
                $this->response('error', 'Invalid Action: ' . $action, 400);
        }
    }

    // --- GET DATA (SANITIZED) ---
    private function getAllData() {
        try {
            // Gunakan SELECT * agar aman
            $stmt = $this->pdo->query("SELECT * FROM archives ORDER BY created_at DESC");
            $archives = [];
            while ($row = $stmt->fetch()) {
                // SANITASI DATA: Memastikan tidak ada nilai NULL yang dikirim ke Frontend
                // Type casting (string) sangat penting di sini
                
                $tagsRaw = $row['tags'] ?? '';
                $tagsArray = [];
                if (!empty($tagsRaw) && is_string($tagsRaw)) {
                    $tagsArray = explode(", ", $tagsRaw);
                }
                
                $archives[] = [
                    "id" => (string)$row['id'],
                    "nomorDokumen" => !empty($row['nomor_dokumen']) ? (string)$row['nomor_dokumen'] : '-',
                    "judul" => !empty($row['judul']) ? (string)$row['judul'] : 'Tanpa Judul',
                    "deskripsi" => (string)($row['deskripsi'] ?? ''),
                    "kategori" => (string)($row['kategori'] ?? 'Lainnya'),
                    "tahun" => (string)($row['tahun'] ?? date('Y')),
                    "tags" => $tagsArray,
                    "fileUrl" => (string)($row['file_url'] ?? ''),
                    "fileSize" => (string)($row['file_size'] ?? ''),
                    "tanggalUpload" => (string)($row['created_at'] ?? ''),
                    "folderId" => (string)($row['folder_id'] ?? ''),
                    "visibility" => (string)($row['visibility'] ?? 'public')
                ];
            }

            // Gunakan SELECT * juga untuk folder
            $stmtFolder = $this->pdo->query("SELECT * FROM folders ORDER BY label ASC");
            $folders = [];
            while ($row = $stmtFolder->fetch()) {
                $folders[] = [
                    "id" => (string)$row['id'],
                    "label" => (string)($row['label'] ?? 'Folder'),
                    "parentId" => !empty($row['parent_id']) ? (string)$row['parent_id'] : null,
                    "visibility" => (string)($row['visibility'] ?? 'public')
                ];
            }

            $this->response('success', 'Data fetched', 200, [
                'archives' => $archives,
                'folders' => $folders
            ]);

        } catch (Exception $e) {
            $this->response('error', "Fetch Error: " . $e->getMessage(), 500);
        }
    }

    // --- SAVE METADATA (Dengan Fallback untuk Backward Compatibility) ---
    private function saveMetadata($data) {
        if (empty($data['fileUrl'])) {
            $this->response('error', 'Missing Drive URL.', 400);
        }

        $id = uniqid('doc_');
        // Pastikan tags array sebelum implode
        $tagsData = $data['tags'] ?? [];
        $tags = is_array($tagsData) ? implode(", ", $tagsData) : (string)$tagsData;
        
        $driveId = $data['driveId'] ?? '';
        $folderId = !empty($data['folderId']) ? $data['folderId'] : null;
        $visibility = $data['visibility'] ?? 'public';
        
        $params = [
            $id,
            $data['nomorDokumen'] ?? '-',
            $data['judul'] ?? 'Tanpa Judul',
            $data['deskripsi'] ?? '',
            $data['kategori'] ?? 'Lainnya',
            $data['tahun'] ?? date('Y'),
            $tags,
            $data['fileUrl'], 
            $driveId,
            $data['fileSize'] ?? '0 KB',
            $folderId
        ];

        try {
            // COBA 1: Insert LENGKAP dengan visibility
            $sql = "INSERT INTO archives (id, nomor_dokumen, judul, deskripsi, kategori, tahun, tags, file_url, file_path, file_size, folder_id, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $fullParams = $params;
            $fullParams[] = $visibility;
            $stmt->execute($fullParams);

            $this->response('success', 'Metadata berhasil disimpan', 200, ['id' => $id]);

        } catch (PDOException $e) {
            // ERROR 1054 = Unknown column (jika kolom visibility belum dibuat)
            if (isset($e->errorInfo[1]) && $e->errorInfo[1] == 1054) {
                try {
                    // COBA 2: Insert TANPA visibility (Fallback)
                    $sqlFallback = "INSERT INTO archives (id, nomor_dokumen, judul, deskripsi, kategori, tahun, tags, file_url, file_path, file_size, folder_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                    $stmt = $this->pdo->prepare($sqlFallback);
                    $stmt->execute($params);
                    
                    $this->response('success', 'Metadata disimpan (Mode Kompatibilitas)', 200, ['id' => $id]);
                } catch (Exception $ex) {
                    $this->response('error', "Database Error (Fallback): " . $ex->getMessage(), 500);
                }
            } else {
                $this->response('error', "Database Error: " . $e->getMessage(), 500);
            }
        }
    }

    // --- MANAGE FOLDER ---
    private function createFolder($data) {
        $params = [
            $data['id'],
            $data['label'],
            $data['parentId'] ?? null
        ];

        try {
            $stmt = $this->pdo->prepare("INSERT INTO folders (id, label, parent_id, visibility) VALUES (?, ?, ?, ?)");
            $fullParams = $params;
            $fullParams[] = $data['visibility'] ?? 'public';
            $stmt->execute($fullParams);
            $this->response('success', 'Folder created');

        } catch (PDOException $e) {
             if (isset($e->errorInfo[1]) && $e->errorInfo[1] == 1054) {
                try {
                    $stmt = $this->pdo->prepare("INSERT INTO folders (id, label, parent_id) VALUES (?, ?, ?)");
                    $stmt->execute($params);
                    $this->response('success', 'Folder created (Compatibility Mode)');
                } catch (Exception $ex) {
                    $this->response('error', $ex->getMessage(), 500);
                }
             } else {
                 $this->response('error', $e->getMessage(), 500);
             }
        }
    }

    private function renameFolder($data) {
        try {
            $stmt = $this->pdo->prepare("UPDATE folders SET label = ? WHERE id = ?");
            $stmt->execute([$data['label'], $data['id']]);
            $this->response('success', 'Folder renamed');
        } catch (PDOException $e) {
            $this->response('error', $e->getMessage(), 500);
        }
    }
    
    // --- TOGGLE VISIBILITY ---
    private function toggleVisibility($data) {
        try {
            $type = $data['type']; 
            $id = $data['id'];
            $newVisibility = $data['visibility']; 

            if ($type === 'folder') {
                $stmt = $this->pdo->prepare("UPDATE folders SET visibility = ? WHERE id = ?");
            } else {
                $stmt = $this->pdo->prepare("UPDATE archives SET visibility = ? WHERE id = ?");
            }
            
            $stmt->execute([$newVisibility, $id]);
            $this->response('success', 'Visibility updated');
        } catch (PDOException $e) {
             if (isset($e->errorInfo[1]) && $e->errorInfo[1] == 1054) {
                 $this->response('success', 'Simulated update (Database column missing)');
             }
             $this->response('error', $e->getMessage(), 500);
        }
    }
    
    // --- MOVE ARCHIVE ---
    private function moveArchive($data) {
        try {
            $archiveId = $data['id'];
            $newFolderId = $data['folderId'];

            $stmt = $this->pdo->prepare("UPDATE archives SET folder_id = ?, kategori = (SELECT label FROM folders WHERE id = ?) WHERE id = ?");
            $stmt->execute([$newFolderId, $newFolderId, $archiveId]);
            $this->response('success', 'Archive moved successfully');
        } catch (PDOException $e) {
            $this->response('error', "Move failed: " . $e->getMessage(), 500);
        }
    }
    
    // --- RENAME ARCHIVE ---
    private function renameArchive($data) {
        try {
            $id = $data['id'];
            $newTitle = $data['judul'];
            
            if (empty($newTitle)) {
                $this->response('error', 'Judul tidak boleh kosong', 400);
            }

            $stmt = $this->pdo->prepare("UPDATE archives SET judul = ? WHERE id = ?");
            $stmt->execute([$newTitle, $id]);
            $this->response('success', 'Archive renamed successfully');
        } catch (PDOException $e) {
            $this->response('error', "Rename failed: " . $e->getMessage(), 500);
        }
    }

    private function deleteFolder($data) {
        try {
            $stmt = $this->pdo->prepare("DELETE FROM folders WHERE id = ?");
            $stmt->execute([$data['id']]);
            $this->response('success', 'Folder deleted');
        } catch (PDOException $e) {
            $this->response('error', $e->getMessage(), 500);
        }
    }

    private function deleteArchive($data) {
        try {
            $stmt = $this->pdo->prepare("SELECT file_path FROM archives WHERE id = ?");
            $stmt->execute([$data['id']]);
            $row = $stmt->fetch();

            if ($row) {
                $del = $this->pdo->prepare("DELETE FROM archives WHERE id = ?");
                $del->execute([$data['id']]);
                $this->response('success', 'Arsip dihapus', 200, ['driveId' => $row['file_path']]);
            } else {
                $this->response('error', 'Arsip tidak ditemukan', 404);
            }
        } catch (Exception $e) {
            $this->response('error', $e->getMessage(), 500);
        }
    }

    private function response($status, $message, $code = 200, $data = null) {
        http_response_code($code);
        $res = ['status' => $status, 'message' => $message];
        if ($data) $res['data'] = $data;
        // Gunakan flag JSON_INVALID_UTF8_IGNORE untuk mencegah json_encode gagal jika ada karakter aneh di DB
        echo json_encode($res, JSON_INVALID_UTF8_IGNORE);
        exit();
    }
}

$api = new ArchiveAPI();
$api->handleRequest();
?>