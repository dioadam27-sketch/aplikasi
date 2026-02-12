<?php
// db_config.php
// File ini menyimpan kredensial database.
// PENTING: Jangan upload file ini ke public folder atau frontend hosting (Netlify/Vercel).
// Upload file ini ke folder private di server PHP/cPanel Anda.

$host = 'localhost';
$db   = 'pkkiipendidikanu_ruangpdb'; // Sesuaikan dengan DB Anda
$user = 'pkkiipendidikanu_dioarsip'; // Sesuaikan dengan User Anda
$pass = '@Dioadam27'; // Sesuaikan dengan Password Anda
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