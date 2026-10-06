<?php
/**
 * Endpoint de Eventos Acadêmicos: /api/eventos/
 * Operações CRUD com Prepared Statements e PDO
 */

require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? '';

// GET: Lista eventos
if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM eventos WHERE entity_id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $ev = $stmt->fetch();
        if (!$ev) {
            sendError('Evento não encontrado.', 404);
        }
        sendResponse($ev);
    }

    $stmt = $pdo->query("SELECT * FROM eventos ORDER BY date ASC");
    sendResponse($stmt->fetchAll());
}

// POST: Cria evento
if ($method === 'POST') {
    $input = getJsonInput();

    $title = trim($input['title'] ?? '');
    $date = trim($input['date'] ?? '');
    $endDate = trim($input['end_date'] ?? '') ?: null;
    $type = trim($input['type'] ?? 'event');
    $description = trim($input['description'] ?? '') ?: null;
    $discipline = trim($input['discipline'] ?? '') ?: null;
    $classId = trim($input['class_id'] ?? '') ?: null;
    $className = trim($input['class_name'] ?? '') ?: null;
    $schoolId = trim($input['school_id'] ?? '') ?: null;
    $location = trim($input['location'] ?? '') ?: null;
    $entityId = trim($input['entity_id'] ?? '') ?: ('event_' . bin2hex(random_bytes(8)));

    if (!$title || !$date) {
        sendError('Título e data são obrigatórios para agendar um evento.', 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO eventos (
            entity_id, title, date, end_date, type, description,
            discipline, class_id, class_name, school_id, location, created_at
        ) VALUES (
            :id, :title, :date, :endDate, :type, :description,
            :discipline, :classId, :className, :schoolId, :location, NOW()
        )
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            date = VALUES(date),
            end_date = VALUES(end_date),
            type = VALUES(type),
            description = VALUES(description),
            discipline = VALUES(discipline),
            class_id = VALUES(class_id),
            class_name = VALUES(class_name),
            school_id = VALUES(school_id),
            location = VALUES(location)
    ");

    $stmt->execute([
        ':id' => $entityId,
        ':title' => $title,
        ':date' => $date,
        ':endDate' => $endDate,
        ':type' => $type,
        ':description' => $description,
        ':discipline' => $discipline,
        ':classId' => $classId,
        ':className' => $className,
        ':schoolId' => $schoolId,
        ':location' => $location
    ]);

    $stmt = $pdo->prepare("SELECT * FROM eventos WHERE entity_id = :id LIMIT 1");
    $stmt->execute([':id' => $entityId]);
    $created = $stmt->fetch();

    sendResponse($created, 201, 'Evento agendado com sucesso.');
}

// PUT: Atualiza evento
if ($method === 'PUT') {
    $input = getJsonInput();
    $targetId = $id ?: ($input['entity_id'] ?? '');

    if (!$targetId) {
        sendError('ID do evento não informado para atualização.', 400);
    }

    $stmt = $pdo->prepare("
        UPDATE eventos
        SET title = :title,
            date = :date,
            end_date = :endDate,
            type = :type,
            description = :description,
            discipline = :discipline,
            class_id = :classId,
            class_name = :className,
            school_id = :schoolId,
            location = :location
        WHERE entity_id = :id
    ");

    $stmt->execute([
        ':title' => trim($input['title'] ?? ''),
        ':date' => trim($input['date'] ?? ''),
        ':endDate' => trim($input['end_date'] ?? '') ?: null,
        ':type' => trim($input['type'] ?? 'event'),
        ':description' => trim($input['description'] ?? '') ?: null,
        ':discipline' => trim($input['discipline'] ?? '') ?: null,
        ':classId' => trim($input['class_id'] ?? '') ?: null,
        ':className' => trim($input['class_name'] ?? '') ?: null,
        ':schoolId' => trim($input['school_id'] ?? '') ?: null,
        ':location' => trim($input['location'] ?? '') ?: null,
        ':id' => $targetId
    ]);

    $stmt = $pdo->prepare("SELECT * FROM eventos WHERE entity_id = :id LIMIT 1");
    $stmt->execute([':id' => $targetId]);
    sendResponse($stmt->fetch(), 200, 'Evento atualizado com sucesso.');
}

// DELETE: Exclui evento
if ($method === 'DELETE') {
    $input = getJsonInput();
    $targetId = $id ?: ($input['entity_id'] ?? '');

    if (!$targetId) {
        sendError('ID do evento não informado para exclusão.', 400);
    }

    $stmt = $pdo->prepare("DELETE FROM eventos WHERE entity_id = :id");
    $stmt->execute([':id' => $targetId]);

    sendResponse(['entity_id' => $targetId], 200, 'Evento excluído do calendário.');
}

sendError('Método HTTP não suportado', 405);
