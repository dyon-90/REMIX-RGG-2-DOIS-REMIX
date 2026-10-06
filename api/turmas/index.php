<?php
/**
 * Endpoint de Turmas: /api/turmas/
 * Operações CRUD com Prepared Statements e PDO
 */

require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? '';
$escolaId = $_GET['escola_id'] ?? '';

// GET: Lista turmas
if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM turmas WHERE entity_id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $class = $stmt->fetch();
        if (!$class) {
            sendError('Turma não encontrada.', 404);
        }
        sendResponse($class);
    }

    if ($escolaId) {
        $stmt = $pdo->prepare("SELECT * FROM turmas WHERE class_school_id = :escolaId ORDER BY class_name ASC");
        $stmt->execute([':escolaId' => $escolaId]);
        sendResponse($stmt->fetchAll());
    }

    $stmt = $pdo->query("SELECT * FROM turmas ORDER BY class_name ASC");
    sendResponse($stmt->fetchAll());
}

// POST: Cria ou insere turma
if ($method === 'POST') {
    $input = getJsonInput();

    $name = trim($input['class_name'] ?? '');
    $schoolId = trim($input['class_school_id'] ?? '');
    $schoolName = trim($input['class_school_name'] ?? '');
    $teacher = trim($input['class_teacher'] ?? '');
    $entityId = trim($input['entity_id'] ?? '') ?: ('class_' . bin2hex(random_bytes(8)));

    if (!$name || !$schoolId) {
        sendError('Nome da turma e identificador da escola são obrigatórios.', 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO turmas (entity_id, class_name, class_school_id, class_school_name, class_teacher, created_at)
        VALUES (:id, :name, :schoolId, :schoolName, :teacher, NOW())
        ON DUPLICATE KEY UPDATE
            class_name = VALUES(class_name),
            class_school_id = VALUES(class_school_id),
            class_school_name = VALUES(class_school_name),
            class_teacher = VALUES(class_teacher)
    ");

    $stmt->execute([
        ':id' => $entityId,
        ':name' => $name,
        ':schoolId' => $schoolId,
        ':schoolName' => $schoolName,
        ':teacher' => $teacher
    ]);

    $stmt = $pdo->prepare("SELECT * FROM turmas WHERE entity_id = :id LIMIT 1");
    $stmt->execute([':id' => $entityId]);
    $created = $stmt->fetch();

    sendResponse($created, 201, 'Turma cadastrada com sucesso.');
}

// PUT: Atualiza turma
if ($method === 'PUT') {
    $input = getJsonInput();
    $targetId = $id ?: ($input['entity_id'] ?? '');

    if (!$targetId) {
        sendError('ID da turma não informado para atualização.', 400);
    }

    $name = trim($input['class_name'] ?? '');
    $schoolId = trim($input['class_school_id'] ?? '');
    $schoolName = trim($input['class_school_name'] ?? '');
    $teacher = trim($input['class_teacher'] ?? '');

    $stmt = $pdo->prepare("
        UPDATE turmas
        SET class_name = :name, class_school_id = :schoolId, class_school_name = :schoolName, class_teacher = :teacher
        WHERE entity_id = :id
    ");

    $stmt->execute([
        ':name' => $name,
        ':schoolId' => $schoolId,
        ':schoolName' => $schoolName,
        ':teacher' => $teacher,
        ':id' => $targetId
    ]);

    $stmt = $pdo->prepare("SELECT * FROM turmas WHERE entity_id = :id LIMIT 1");
    $stmt->execute([':id' => $targetId]);
    $updated = $stmt->fetch();

    sendResponse($updated, 200, 'Turma atualizada com sucesso.');
}

// DELETE: Exclui turma
if ($method === 'DELETE') {
    $input = getJsonInput();
    $targetId = $id ?: ($input['entity_id'] ?? '');

    if (!$targetId) {
        sendError('ID da turma não informado para exclusão.', 400);
    }

    $stmt = $pdo->prepare("DELETE FROM turmas WHERE entity_id = :id");
    $stmt->execute([':id' => $targetId]);

    sendResponse(['entity_id' => $targetId], 200, 'Turma removida com sucesso.');
}

sendError('Método HTTP não suportado', 405);
