<?php
/**
 * Endpoint de Alunos: /api/alunos/
 * Operações CRUD com Prepared Statements e PDO
 */

require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? '';
$turmaId = $_GET['turma_id'] ?? '';

// GET: Lista alunos
if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM alunos WHERE entity_id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $student = $stmt->fetch();
        if (!$student) {
            sendError('Aluno não encontrado.', 404);
        }
        sendResponse($student);
    }

    if ($turmaId) {
        $stmt = $pdo->prepare("SELECT * FROM alunos WHERE student_class_id = :turmaId ORDER BY student_name ASC");
        $stmt->execute([':turmaId' => $turmaId]);
        sendResponse($stmt->fetchAll());
    }

    $stmt = $pdo->query("SELECT * FROM alunos ORDER BY student_name ASC");
    sendResponse($stmt->fetchAll());
}

// POST: Cria ou cadastra aluno
if ($method === 'POST') {
    $input = getJsonInput();

    $name = trim($input['student_name'] ?? '');
    $email = trim($input['student_email'] ?? '');
    $classId = trim($input['student_class_id'] ?? '');
    $className = trim($input['student_class_name'] ?? '');
    $matricula = trim($input['student_matricula'] ?? '');
    $entityId = trim($input['entity_id'] ?? '') ?: ('student_' . bin2hex(random_bytes(8)));

    if (!$name || !$classId || !$matricula) {
        sendError('Nome, turma e matrícula são obrigatórios para cadastro do aluno.', 400);
    }

    // Se não forneceu email, gera identificador único baseado no nome/matrícula
    if (!$email) {
        $slug = preg_replace('/[^a-z0-9]/', '', strtolower($name));
        $email = $slug . '.' . substr($matricula, -4) . '@aluno.aprender';
    }

    $stmt = $pdo->prepare("
        INSERT INTO alunos (entity_id, student_name, student_email, student_class_id, student_class_name, student_matricula, created_at)
        VALUES (:id, :name, :email, :classId, :className, :matricula, NOW())
        ON DUPLICATE KEY UPDATE
            student_name = VALUES(student_name),
            student_email = VALUES(student_email),
            student_class_id = VALUES(student_class_id),
            student_class_name = VALUES(student_class_name),
            student_matricula = VALUES(student_matricula)
    ");

    $stmt->execute([
        ':id' => $entityId,
        ':name' => $name,
        ':email' => $email,
        ':classId' => $classId,
        ':className' => $className,
        ':matricula' => $matricula
    ]);

    $stmt = $pdo->prepare("SELECT * FROM alunos WHERE entity_id = :id LIMIT 1");
    $stmt->execute([':id' => $entityId]);
    $created = $stmt->fetch();

    sendResponse($created, 201, 'Aluno salvo com sucesso no banco de dados.');
}

// PUT: Atualiza aluno
if ($method === 'PUT') {
    $input = getJsonInput();
    $targetId = $id ?: ($input['entity_id'] ?? '');

    if (!$targetId) {
        sendError('ID do aluno não informado para atualização.', 400);
    }

    $name = trim($input['student_name'] ?? '');
    $email = trim($input['student_email'] ?? '');
    $classId = trim($input['student_class_id'] ?? '');
    $className = trim($input['student_class_name'] ?? '');
    $matricula = trim($input['student_matricula'] ?? '');

    $stmt = $pdo->prepare("
        UPDATE alunos
        SET student_name = :name,
            student_email = :email,
            student_class_id = :classId,
            student_class_name = :className,
            student_matricula = :matricula
        WHERE entity_id = :id
    ");

    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':classId' => $classId,
        ':className' => $className,
        ':matricula' => $matricula,
        ':id' => $targetId
    ]);

    $stmt = $pdo->prepare("SELECT * FROM alunos WHERE entity_id = :id LIMIT 1");
    $stmt->execute([':id' => $targetId]);
    $updated = $stmt->fetch();

    sendResponse($updated, 200, 'Dados do aluno atualizados com sucesso.');
}

// DELETE: Remove aluno
if ($method === 'DELETE') {
    $input = getJsonInput();
    $targetId = $id ?: ($input['entity_id'] ?? '');

    if (!$targetId) {
        sendError('ID do aluno não informado para exclusão.', 400);
    }

    $stmt = $pdo->prepare("DELETE FROM alunos WHERE entity_id = :id");
    $stmt->execute([':id' => $targetId]);

    sendResponse(['entity_id' => $targetId], 200, 'Aluno removido com sucesso.');
}

sendError('Método HTTP não suportado', 405);
