<?php
/**
 * Endpoint de Arquivos Colaborativos: /api/arquivos/
 * Operações CRUD com Prepared Statements e PDO
 */

require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? '';

// GET: Lista documentos colaborativos
if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM arquivos_colaborativos WHERE entity_id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $file = $stmt->fetch();
        if (!$file) {
            sendError('Documento não encontrado.', 404);
        }
        $file['tags'] = $file['tags'] ? json_decode($file['tags'], true) : [];
        $file['collaborators'] = $file['collaborators'] ? json_decode($file['collaborators'], true) : [];
        sendResponse($file);
    }

    $stmt = $pdo->query("SELECT * FROM arquivos_colaborativos ORDER BY updated_at DESC");
    $files = array_map(function($f) {
        $f['tags'] = $f['tags'] ? json_decode($f['tags'], true) : [];
        $f['collaborators'] = $f['collaborators'] ? json_decode($f['collaborators'], true) : [];
        return $f;
    }, $stmt->fetchAll());

    sendResponse($files);
}

// POST: Cria documento
if ($method === 'POST') {
    $input = getJsonInput();

    $title = trim($input['title'] ?? '');
    $category = trim($input['category'] ?? 'planejamento');
    $content = $input['content'] ?? '';
    $authorId = trim($input['author_id'] ?? '');
    $authorName = trim($input['author_name'] ?? '');
    $lastModifiedBy = trim($input['last_modified_by'] ?? $authorId);
    $lastModifiedByName = trim($input['last_modified_by_name'] ?? $authorName);
    $lastModifiedAt = trim($input['last_modified_at'] ?? '') ?: date('c');
    $version = intval($input['version'] ?? 1);
    $tags = json_encode($input['tags'] ?? [], JSON_UNESCAPED_UNICODE);
    $collaborators = json_encode($input['collaborators'] ?? [], JSON_UNESCAPED_UNICODE);
    $entityId = trim($input['entity_id'] ?? '') ?: ('file_' . bin2hex(random_bytes(8)));

    if (!$title) {
        sendError('Título do documento é obrigatório.', 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO arquivos_colaborativos (
            entity_id, title, category, content, author_id, author_name,
            last_modified_by, last_modified_by_name, last_modified_at,
            version, tags, collaborators, created_at
        ) VALUES (
            :id, :title, :category, :content, :authorId, :authorName,
            :lastModBy, :lastModByName, :lastModAt,
            :version, :tags, :collaborators, NOW()
        )
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            category = VALUES(category),
            content = VALUES(content),
            last_modified_by = VALUES(last_modified_by),
            last_modified_by_name = VALUES(last_modified_by_name),
            last_modified_at = VALUES(last_modified_at),
            version = VALUES(version),
            tags = VALUES(tags),
            collaborators = VALUES(collaborators)
    ");

    $stmt->execute([
        ':id' => $entityId,
        ':title' => $title,
        ':category' => $category,
        ':content' => $content,
        ':authorId' => $authorId,
        ':authorName' => $authorName,
        ':lastModBy' => $lastModifiedBy,
        ':lastModByName' => $lastModifiedByName,
        ':lastModAt' => $lastModifiedAt,
        ':version' => $version,
        ':tags' => $tags,
        ':collaborators' => $collaborators
    ]);

    $stmt = $pdo->prepare("SELECT * FROM arquivos_colaborativos WHERE entity_id = :id LIMIT 1");
    $stmt->execute([':id' => $entityId]);
    $created = $stmt->fetch();
    $created['tags'] = $created['tags'] ? json_decode($created['tags'], true) : [];
    $created['collaborators'] = $created['collaborators'] ? json_decode($created['collaborators'], true) : [];

    sendResponse($created, 201, 'Documento colaborativo salvo com sucesso.');
}

// PUT: Atualiza conteúdo
if ($method === 'PUT') {
    $input = getJsonInput();
    $targetId = $id ?: ($input['entity_id'] ?? '');

    if (!$targetId) {
        sendError('ID do documento não informado para atualização.', 400);
    }

    $stmt = $pdo->prepare("
        UPDATE arquivos_colaborativos
        SET title = COALESCE(:title, title),
            content = COALESCE(:content, content),
            last_modified_by = :lastModBy,
            last_modified_by_name = :lastModByName,
            last_modified_at = :lastModAt,
            version = version + 1
        WHERE entity_id = :id
    ");

    $stmt->execute([
        ':title' => isset($input['title']) ? trim($input['title']) : null,
        ':content' => $input['content'] ?? null,
        ':lastModBy' => trim($input['last_modified_by'] ?? ''),
        ':lastModByName' => trim($input['last_modified_by_name'] ?? ''),
        ':lastModAt' => date('c'),
        ':id' => $targetId
    ]);

    $stmt = $pdo->prepare("SELECT * FROM arquivos_colaborativos WHERE entity_id = :id LIMIT 1");
    $stmt->execute([':id' => $targetId]);
    $updated = $stmt->fetch();
    $updated['tags'] = $updated['tags'] ? json_decode($updated['tags'], true) : [];
    $updated['collaborators'] = $updated['collaborators'] ? json_decode($updated['collaborators'], true) : [];

    sendResponse($updated, 200, 'Documento colaborativo atualizado.');
}

// DELETE: Exclui documento
if ($method === 'DELETE') {
    $input = getJsonInput();
    $targetId = $id ?: ($input['entity_id'] ?? '');

    if (!$targetId) {
        sendError('ID do documento não informado para exclusão.', 400);
    }

    $stmt = $pdo->prepare("DELETE FROM arquivos_colaborativos WHERE entity_id = :id");
    $stmt->execute([':id' => $targetId]);

    sendResponse(['entity_id' => $targetId], 200, 'Documento excluído com sucesso.');
}

sendError('Método HTTP não suportado', 405);
