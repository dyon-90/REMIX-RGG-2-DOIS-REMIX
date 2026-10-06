<?php
/**
 * Endpoint do Mural de Recados: /api/mural/
 * Operações CRUD com Prepared Statements e PDO
 */

require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? '';

// GET: Lista posts
if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM posts WHERE entity_id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $post = $stmt->fetch();
        if (!$post) {
            sendError('Publicação não encontrada.', 404);
        }
        $post['post_is_pinned'] = (bool)$post['post_is_pinned'];
        sendResponse($post);
    }

    $stmt = $pdo->query("SELECT * FROM posts ORDER BY post_is_pinned DESC, created_at DESC");
    $posts = array_map(function($p) {
        $p['post_is_pinned'] = (bool)$p['post_is_pinned'];
        return $p;
    }, $stmt->fetchAll());

    sendResponse($posts);
}

// POST: Publica no mural
if ($method === 'POST') {
    $input = getJsonInput();

    $content = trim($input['post_content'] ?? '');
    $authorId = trim($input['post_author_id'] ?? '');
    $authorName = trim($input['post_author_name'] ?? '');
    $authorType = trim($input['post_author_type'] ?? 'admin');
    $classId = trim($input['post_class_id'] ?? '') ?: null;
    $isPinned = !empty($input['post_is_pinned']) ? 1 : 0;
    $parentId = trim($input['post_parent_id'] ?? '') ?: null;
    $link = trim($input['post_link'] ?? '') ?: null;
    $image = trim($input['post_image'] ?? '') ?: null;
    $postCreatedAt = trim($input['post_created_at'] ?? '') ?: date('c');
    $entityId = trim($input['entity_id'] ?? '') ?: ('post_' . bin2hex(random_bytes(8)));

    if (!$content || !$authorName) {
        sendError('Conteúdo e autor são obrigatórios para publicar no mural.', 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO posts (
            entity_id, post_content, post_author_id, post_author_name,
            post_author_type, post_class_id, post_is_pinned, post_parent_id,
            post_link, post_image, post_created_at, created_at
        ) VALUES (
            :id, :content, :authorId, :authorName,
            :authorType, :classId, :isPinned, :parentId,
            :link, :image, :postCreatedAt, NOW()
        )
        ON DUPLICATE KEY UPDATE
            post_content = VALUES(post_content),
            post_is_pinned = VALUES(post_is_pinned),
            post_link = VALUES(post_link),
            post_image = VALUES(post_image)
    ");

    $stmt->execute([
        ':id' => $entityId,
        ':content' => $content,
        ':authorId' => $authorId,
        ':authorName' => $authorName,
        ':authorType' => $authorType,
        ':classId' => $classId,
        ':isPinned' => $isPinned,
        ':parentId' => $parentId,
        ':link' => $link,
        ':image' => $image,
        ':postCreatedAt' => $postCreatedAt
    ]);

    $stmt = $pdo->prepare("SELECT * FROM posts WHERE entity_id = :id LIMIT 1");
    $stmt->execute([':id' => $entityId]);
    $created = $stmt->fetch();
    $created['post_is_pinned'] = (bool)$created['post_is_pinned'];

    sendResponse($created, 201, 'Publicação enviada para o mural com sucesso.');
}

// PUT: Alterna fixação ou edita conteúdo
if ($method === 'PUT') {
    $input = getJsonInput();
    $targetId = $id ?: ($input['entity_id'] ?? '');

    if (!$targetId) {
        sendError('ID da publicação não informado.', 400);
    }

    if (isset($input['post_is_pinned'])) {
        $pinned = !empty($input['post_is_pinned']) ? 1 : 0;
        $stmt = $pdo->prepare("UPDATE posts SET post_is_pinned = :p WHERE entity_id = :id");
        $stmt->execute([':p' => $pinned, ':id' => $targetId]);
    }

    if (isset($input['post_content'])) {
        $stmt = $pdo->prepare("UPDATE posts SET post_content = :c WHERE entity_id = :id");
        $stmt->execute([':c' => trim($input['post_content']), ':id' => $targetId]);
    }

    $stmt = $pdo->prepare("SELECT * FROM posts WHERE entity_id = :id LIMIT 1");
    $stmt->execute([':id' => $targetId]);
    $updated = $stmt->fetch();
    $updated['post_is_pinned'] = (bool)$updated['post_is_pinned'];

    sendResponse($updated, 200, 'Publicação atualizada.');
}

// DELETE: Exclui post
if ($method === 'DELETE') {
    $input = getJsonInput();
    $targetId = $id ?: ($input['entity_id'] ?? '');

    if (!$targetId) {
        sendError('ID da publicação não informado para exclusão.', 400);
    }

    $stmt = $pdo->prepare("DELETE FROM posts WHERE entity_id = :id");
    $stmt->execute([':id' => $targetId]);

    sendResponse(['entity_id' => $targetId], 200, 'Publicação excluída do mural.');
}

sendError('Método HTTP não suportado', 405);
