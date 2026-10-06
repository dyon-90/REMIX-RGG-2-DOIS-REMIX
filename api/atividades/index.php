<?php
/**
 * Endpoint de Atividades: /api/atividades/
 * Operações CRUD com Prepared Statements e PDO
 */

require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? '';
$turmaId = $_GET['turma_id'] ?? '';

// GET: Lista atividades
if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM atividades WHERE entity_id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $act = $stmt->fetch();
        if (!$act) {
            sendError('Atividade não encontrada.', 404);
        }
        sendResponse($act);
    }

    if ($turmaId) {
        $stmt = $pdo->prepare("SELECT * FROM atividades WHERE activity_class_id = :turmaId ORDER BY created_at DESC");
        $stmt->execute([':turmaId' => $turmaId]);
        sendResponse($stmt->fetchAll());
    }

    $stmt = $pdo->query("SELECT * FROM atividades ORDER BY created_at DESC");
    sendResponse($stmt->fetchAll());
}

// POST: Cria atividade
if ($method === 'POST') {
    $input = getJsonInput();

    $name = trim($input['activity_name'] ?? '');
    $classId = trim($input['activity_class_id'] ?? '');
    $className = trim($input['activity_class_name'] ?? '');
    $discipline = trim($input['activity_discipline'] ?? '');
    $dueDate = trim($input['activity_due_date'] ?? '');
    $description = trim($input['activity_description'] ?? '');
    $link = trim($input['activity_link'] ?? '');
    $embedUrl = trim($input['activity_embed_url'] ?? '');
    $entityId = trim($input['entity_id'] ?? '') ?: ('act_' . bin2hex(random_bytes(8)));

    if (!$name || !$classId || !$discipline || !$dueDate) {
        sendError('Nome da atividade, turma, disciplina e data de entrega são obrigatórios.', 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO atividades (
            entity_id, activity_name, activity_class_id, activity_class_name,
            activity_discipline, activity_due_date, activity_description,
            activity_link, activity_embed_url, created_at
        ) VALUES (
            :id, :name, :classId, :className,
            :discipline, :dueDate, :description,
            :link, :embedUrl, NOW()
        )
        ON DUPLICATE KEY UPDATE
            activity_name = VALUES(activity_name),
            activity_class_id = VALUES(activity_class_id),
            activity_class_name = VALUES(activity_class_name),
            activity_discipline = VALUES(activity_discipline),
            activity_due_date = VALUES(activity_due_date),
            activity_description = VALUES(activity_description),
            activity_link = VALUES(activity_link),
            activity_embed_url = VALUES(activity_embed_url)
    ");

    $stmt->execute([
        ':id' => $entityId,
        ':name' => $name,
        ':classId' => $classId,
        ':className' => $className,
        ':discipline' => $discipline,
        ':dueDate' => $dueDate,
        ':description' => $description,
        ':link' => $link,
        ':embedUrl' => $embedUrl
    ]);

    $stmt = $pdo->prepare("SELECT * FROM atividades WHERE entity_id = :id LIMIT 1");
    $stmt->execute([':id' => $entityId]);
    $created = $stmt->fetch();

    sendResponse($created, 201, 'Atividade cadastrada com sucesso.');
}

// PUT: Atualiza atividade
if ($method === 'PUT') {
    $input = getJsonInput();
    $targetId = $id ?: ($input['entity_id'] ?? '');

    if (!$targetId) {
        sendError('ID da atividade não informado para atualização.', 400);
    }

    $name = trim($input['activity_name'] ?? '');
    $classId = trim($input['activity_class_id'] ?? '');
    $className = trim($input['activity_class_name'] ?? '');
    $discipline = trim($input['activity_discipline'] ?? '');
    $dueDate = trim($input['activity_due_date'] ?? '');
    $description = trim($input['activity_description'] ?? '');
    $link = trim($input['activity_link'] ?? '');
    $embedUrl = trim($input['activity_embed_url'] ?? '');

    $stmt = $pdo->prepare("
        UPDATE atividades
        SET activity_name = :name,
            activity_class_id = :classId,
            activity_class_name = :className,
            activity_discipline = :discipline,
            activity_due_date = :dueDate,
            activity_description = :description,
            activity_link = :link,
            activity_embed_url = :embedUrl
        WHERE entity_id = :id
    ");

    $stmt->execute([
        ':name' => $name,
        ':classId' => $classId,
        ':className' => $className,
        ':discipline' => $discipline,
        ':dueDate' => $dueDate,
        ':description' => $description,
        ':link' => $link,
        ':embedUrl' => $embedUrl,
        ':id' => $targetId
    ]);

    $stmt = $pdo->prepare("SELECT * FROM atividades WHERE entity_id = :id LIMIT 1");
    $stmt->execute([':id' => $targetId]);
    $updated = $stmt->fetch();

    sendResponse($updated, 200, 'Atividade atualizada com sucesso.');
}

// DELETE: Exclui atividade
if ($method === 'DELETE') {
    $input = getJsonInput();
    $targetId = $id ?: ($input['entity_id'] ?? '');

    if (!$targetId) {
        sendError('ID da atividade não informado para exclusão.', 400);
    }

    $stmt = $pdo->prepare("DELETE FROM atividades WHERE entity_id = :id");
    $stmt->execute([':id' => $targetId]);

    sendResponse(['entity_id' => $targetId], 200, 'Atividade excluída com sucesso.');
}

sendError('Método HTTP não suportado', 405);
