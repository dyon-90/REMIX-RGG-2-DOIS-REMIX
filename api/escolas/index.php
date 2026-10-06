<?php
/**
 * Endpoint de Escolas: /api/escolas/
 * Operações CRUD com Prepared Statements e PDO
 */

require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? '';

// GET: Lista todas as escolas ou uma escola específica
if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM escolas WHERE entity_id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $school = $stmt->fetch();
        if (!$school) {
            sendError('Escola não encontrada.', 404);
        }
        sendResponse($school);
    }

    $stmt = $pdo->query("SELECT * FROM escolas ORDER BY school_name ASC");
    $schools = $stmt->fetchAll();
    sendResponse($schools);
}

// POST: Cria uma nova escola
if ($method === 'POST') {
    $input = getJsonInput();
    
    $name = trim($input['school_name'] ?? '');
    $city = trim($input['school_city'] ?? '');
    $contact = trim($input['school_contact'] ?? '');
    $entityId = trim($input['entity_id'] ?? '') ?: ('school_' . bin2hex(random_bytes(8)));

    if (!$name) {
        sendError('O nome da escola é obrigatório.', 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO escolas (entity_id, school_name, school_city, school_contact, created_at)
        VALUES (:id, :name, :city, :contact, NOW())
        ON DUPLICATE KEY UPDATE
            school_name = VALUES(school_name),
            school_city = VALUES(school_city),
            school_contact = VALUES(school_contact)
    ");

    $stmt->execute([
        ':id' => $entityId,
        ':name' => $name,
        ':city' => $city,
        ':contact' => $contact
    ]);

    $stmt = $pdo->prepare("SELECT * FROM escolas WHERE entity_id = :id LIMIT 1");
    $stmt->execute([':id' => $entityId]);
    $created = $stmt->fetch();

    sendResponse($created, 201, 'Escola salva com sucesso no MySQL da Hostinger.');
}

// PUT: Atualiza uma escola existente
if ($method === 'PUT') {
    $input = getJsonInput();
    $targetId = $id ?: ($input['entity_id'] ?? '');

    if (!$targetId) {
        sendError('ID da escola não informado para atualização.', 400);
    }

    $name = trim($input['school_name'] ?? '');
    $city = trim($input['school_city'] ?? '');
    $contact = trim($input['school_contact'] ?? '');

    $stmt = $pdo->prepare("
        UPDATE escolas
        SET school_name = :name, school_city = :city, school_contact = :contact
        WHERE entity_id = :id
    ");
    $stmt->execute([
        ':name' => $name,
        ':city' => $city,
        ':contact' => $contact,
        ':id' => $targetId
    ]);

    $stmt = $pdo->prepare("SELECT * FROM escolas WHERE entity_id = :id LIMIT 1");
    $stmt->execute([':id' => $targetId]);
    $updated = $stmt->fetch();

    sendResponse($updated, 200, 'Escola atualizada com sucesso.');
}

// DELETE: Remove uma escola
if ($method === 'DELETE') {
    $input = getJsonInput();
    $targetId = $id ?: ($input['entity_id'] ?? '');

    if (!$targetId) {
        sendError('ID da escola não informado para exclusão.', 400);
    }

    $stmt = $pdo->prepare("DELETE FROM escolas WHERE entity_id = :id");
    $stmt->execute([':id' => $targetId]);

    sendResponse(['entity_id' => $targetId], 200, 'Escola removida do banco de dados.');
}

sendError('Método HTTP não suportado', 405);
