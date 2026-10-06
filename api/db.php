<?php
/**
 * ==============================================================================
 * 2+DOIS= Aprender! - Conexão Central PDO com MySQL / MariaDB (Hostinger)
 * ==============================================================================
 * 
 * Este arquivo estabelece a conexão segura PDO com o banco de dados MySQL/MariaDB
 * na Hostinger. Suporta prepared statements, transações atômicas, UTF-8 (utf8mb4)
 * e cabeçalhos CORS completos para requisições HTTPS e JSON.
 */

// 1. Configurações de CORS e Headers HTTP para API REST
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Cache-Control");
header("Content-Type: application/json; charset=UTF-8");

// Trata requisições pre-flight OPTIONS do navegador
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Credenciais de Banco de Dados da Hostinger
// Você pode definir as variáveis de ambiente ou ajustar as constantes abaixo com os dados
// do seu painel hPanel da Hostinger (Bancos de Dados MySQL).
$host = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: 'u123456789_aprender';
$user = getenv('DB_USER') ?: 'u123456789_root';
$pass = getenv('DB_PASS') ?: '';
$charset = 'utf8mb4';

$dsn = "mysql:host={$host};dbname={$dbname};charset={$charset}";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset} COLLATE utf8mb4_unicode_ci"
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    // Se a conexão direta com o banco da Hostinger falhar ou o banco ainda não tiver sido criado
    // retorna erro estruturado em JSON sem expor senhas
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Falha na conexão com o banco de dados MySQL da Hostinger: ' . $e->getMessage(),
        'instructions' => 'Certifique-se de configurar o arquivo database_schema.sql e ajustar as credenciais no arquivo api/db.php.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Função utilitária para leitura segura do corpo JSON da requisição
 */
function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * Envia uma resposta JSON padronizada de sucesso
 */
function sendResponse(mixed $data = null, int $statusCode = 200, string $message = 'Operação realizada com sucesso'): void {
    http_response_code($statusCode);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('c')
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Envia uma resposta JSON padronizada de erro
 */
function sendError(string $message, int $statusCode = 400, mixed $details = null): void {
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'details' => $details,
        'timestamp' => date('c')
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
