<?php
/**
 * Endpoint de Configurações: /api/configuracoes/
 * Armazena metadados de certificados, parâmetros do sistema e backups
 */

require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];
$key = $_GET['chave'] ?? $_GET['key'] ?? '';

// GET: Recupera configurações
if ($method === 'GET') {
    if ($key) {
        $stmt = $pdo->prepare("SELECT * FROM configuracoes WHERE setting_key = :k LIMIT 1");
        $stmt->execute([':k' => $key]);
        $row = $stmt->fetch();
        if (!$row) {
            sendResponse(null);
        }
        $val = json_decode($row['setting_value'], true);
        sendResponse($val ?? $row['setting_value']);
    }

    $stmt = $pdo->query("SELECT * FROM configuracoes");
    $all = [];
    while ($row = $stmt->fetch()) {
        $val = json_decode($row['setting_value'], true);
        $all[$row['setting_key']] = $val ?? $row['setting_value'];
    }
    sendResponse($all);
}

// POST: Salva configuração
if ($method === 'POST') {
    $input = getJsonInput();
    $targetKey = $key ?: ($input['setting_key'] ?? $input['key'] ?? '');

    if (!$targetKey) {
        sendError('Chave da configuração não informada.', 400);
    }

    $value = $input['setting_value'] ?? $input['value'] ?? $input;
    if (is_array($value) || is_object($value)) {
        $encoded = json_encode($value, JSON_UNESCAPED_UNICODE);
    } else {
        $encoded = (string)$value;
    }

    $stmt = $pdo->prepare("
        INSERT INTO configuracoes (setting_key, setting_value, updated_at)
        VALUES (:k, :v, NOW())
        ON DUPLICATE KEY UPDATE
            setting_value = VALUES(setting_value),
            updated_at = NOW()
    ");

    $stmt->execute([
        ':k' => $targetKey,
        ':v' => $encoded
    ]);

    sendResponse([
        'setting_key' => $targetKey,
        'setting_value' => $value
    ], 200, 'Configuração salva no MySQL com sucesso.');
}

sendError('Método HTTP não suportado', 405);
