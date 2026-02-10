<?php
// db_config.php
// File ini menyimpan kredensial database secara terpisah untuk keamanan.

$host = 'localhost';
$db   = 'pkkiipendidikanu_ruangpdb';
$user = 'pkkiipendidikanu_dioarsip';
$pass = '@Dioadam27';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // Return 500 Error tapi jangan tampilkan detail error database ke publik untuk keamanan
    http_response_code(500);
    echo json_encode(["error" => "Koneksi Database Gagal. Silakan hubungi administrator."]);
    exit();
}
?>