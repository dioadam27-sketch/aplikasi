<?php
// Database Configuration
$host = 'localhost';
$db_name = 'pkkiipendidikanu_aplikasi';
$username = 'pkkiipendidikanu_dioarsip';
$password = '@Dioadam27';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database Connection failed: " . $e->getMessage()]);
    exit;
}
?>