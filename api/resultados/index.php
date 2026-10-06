<?php
/**
 * Endpoint de Resultados (Notas e Submissões): /api/resultados/
 * Operações CRUD com Prepared Statements e PDO
 */

require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? '';
$alunoId = $_GET['aluno_id'] ?? '';
$atividadeId = $_GET['atividade_id'] ?? '';

// GET: Lista notas e submissões
if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM resultados WHERE entity_id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $res = $stmt->fetch();
        if (!$res) {
            sendError('Registro de resultado não encontrado.', 404);
        }
        sendResponse($res);
    }

    if ($alunoId && $atividadeId) {
        $stmt = $pdo->prepare("SELECT * FROM resultados WHERE grade_student_id = :aId AND grade_activity_id = :actId LIMIT 1");
        $stmt->execute([':aId' => $alunoId, ':actId' => $atividadeId]);
        sendResponse($stmt->fetch() ?: null);
    }

    if ($alunoId) {
        $stmt = $pdo->prepare("SELECT * FROM resultados WHERE grade_student_id = :aId ORDER BY created_at DESC");
        $stmt->execute([':aId' => $alunoId]);
        sendResponse($stmt->fetchAll());
    }

    if ($atividadeId) {
        $stmt = $pdo->prepare("SELECT * FROM resultados WHERE grade_activity_id = :actId ORDER BY grade_student_name ASC");
        $stmt->execute([':actId' => $atividadeId]);
        sendResponse($stmt->fetchAll());
    }

    $stmt = $pdo->query("SELECT * FROM resultados ORDER BY created_at DESC");
    sendResponse($stmt->fetchAll());
}

// POST: Salva ou insere entrega/nota
if ($method === 'POST') {
    $input = getJsonInput();

    $studentId = trim($input['grade_student_id'] ?? '');
    $studentName = trim($input['grade_student_name'] ?? '');
    $activityId = trim($input['grade_activity_id'] ?? '');
    $activityName = trim($input['grade_activity_name'] ?? '');
    $gradeValue = floatval($input['grade_value'] ?? 0);
    $feedback = trim($input['grade_feedback'] ?? '');
    $gradeDate = trim($input['grade_date'] ?? '') ?: date('c');
    $submissionText = trim($input['student_submission'] ?? '');
    $submissionLink = trim($input['student_submission_link'] ?? '');
    $submittedAt = trim($input['student_submitted_at'] ?? '');
    $status = trim($input['status'] ?? 'pending');
    $entityId = trim($input['entity_id'] ?? '') ?: ('grade_' . bin2hex(random_bytes(8)));

    if (!$studentId || !$activityId) {
        sendError('Aluno e atividade são obrigatórios para registrar notas/entregas.', 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO resultados (
            entity_id, grade_student_id, grade_student_name,
            grade_activity_id, grade_activity_name, grade_value,
            grade_feedback, grade_date, student_submission,
            student_submission_link, student_submitted_at, status, created_at
        ) VALUES (
            :id, :studentId, :studentName,
            :activityId, :activityName, :gradeValue,
            :feedback, :gradeDate, :subText,
            :subLink, :subAt, :status, NOW()
        )
        ON DUPLICATE KEY UPDATE
            grade_student_name = VALUES(grade_student_name),
            grade_activity_name = VALUES(grade_activity_name),
            grade_value = VALUES(grade_value),
            grade_feedback = VALUES(grade_feedback),
            grade_date = VALUES(grade_date),
            student_submission = VALUES(student_submission),
            student_submission_link = VALUES(student_submission_link),
            student_submitted_at = VALUES(student_submitted_at),
            status = VALUES(status)
    ");

    $stmt->execute([
        ':id' => $entityId,
        ':studentId' => $studentId,
        ':studentName' => $studentName,
        ':activityId' => $activityId,
        ':activityName' => $activityName,
        ':gradeValue' => $gradeValue,
        ':feedback' => $feedback,
        ':gradeDate' => $gradeDate,
        ':subText' => $submissionText,
        ':subLink' => $submissionLink,
        ':subAt' => $submittedAt ?: ($submissionText ? date('c') : null),
        ':status' => $status
    ]);

    $stmt = $pdo->prepare("SELECT * FROM resultados WHERE entity_id = :id LIMIT 1");
    $stmt->execute([':id' => $entityId]);
    $created = $stmt->fetch();

    sendResponse($created, 201, 'Resultado gravado com sucesso.');
}

// PUT: Avaliação ou atualização de entrega
if ($method === 'PUT') {
    $input = getJsonInput();
    $targetId = $id ?: ($input['entity_id'] ?? '');

    if (!$targetId) {
        sendError('ID do resultado não informado para atualização.', 400);
    }

    $gradeValue = isset($input['grade_value']) ? floatval($input['grade_value']) : null;
    $feedback = trim($input['grade_feedback'] ?? '');
    $status = trim($input['status'] ?? 'graded');
    $gradeDate = trim($input['grade_date'] ?? '') ?: date('c');

    $stmt = $pdo->prepare("
        UPDATE resultados
        SET grade_value = COALESCE(:val, grade_value),
            grade_feedback = :feedback,
            grade_date = :gDate,
            status = :status
        WHERE entity_id = :id
    ");

    $stmt->execute([
        ':val' => $gradeValue,
        ':feedback' => $feedback,
        ':gDate' => $gradeDate,
        ':status' => $status,
        ':id' => $targetId
    ]);

    $stmt = $pdo->prepare("SELECT * FROM resultados WHERE entity_id = :id LIMIT 1");
    $stmt->execute([':id' => $targetId]);
    $updated = $stmt->fetch();

    sendResponse($updated, 200, 'Avaliação lançada com sucesso.');
}

// DELETE: Exclusão de resultado
if ($method === 'DELETE') {
    $input = getJsonInput();
    $targetId = $id ?: ($input['entity_id'] ?? '');

    if (!$targetId) {
        sendError('ID do resultado não informado para exclusão.', 400);
    }

    $stmt = $pdo->prepare("DELETE FROM resultados WHERE entity_id = :id");
    $stmt->execute([':id' => $targetId]);

    sendResponse(['entity_id' => $targetId], 200, 'Resultado removido com sucesso.');
}

sendError('Método HTTP não suportado', 405);
