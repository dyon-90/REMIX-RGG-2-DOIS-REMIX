<?php
/**
 * Endpoint de Sincronização: /api/sincronizacao/
 * Garante a mesma base central para computadores, notebooks, celulares e tablets
 * com revalidação periódica, snapshot completo e detecção de alterações multi-dispositivo.
 */

require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];
$check = isset($_GET['check']);
$since = $_GET['since'] ?? '';

// GET: Sincronização centralizada
if ($method === 'GET') {
    // 1. Verificação leve de versão/timestamp para polling inteligente
    if ($check) {
        $stmt = $pdo->query("
            SELECT GREATEST(
                COALESCE((SELECT MAX(updated_at) FROM escolas), '2000-01-01'),
                COALESCE((SELECT MAX(updated_at) FROM turmas), '2000-01-01'),
                COALESCE((SELECT MAX(updated_at) FROM alunos), '2000-01-01'),
                COALESCE((SELECT MAX(updated_at) FROM atividades), '2000-01-01'),
                COALESCE((SELECT MAX(updated_at) FROM resultados), '2000-01-01'),
                COALESCE((SELECT MAX(updated_at) FROM posts), '2000-01-01'),
                COALESCE((SELECT MAX(updated_at) FROM eventos), '2000-01-01'),
                COALESCE((SELECT MAX(updated_at) FROM administradores), '2000-01-01'),
                COALESCE((SELECT MAX(updated_at) FROM arquivos_colaborativos), '2000-01-01')
            ) AS latest_change
        ");
        $latest = $stmt->fetchColumn() ?: date('Y-m-d H:i:s');
        $hasChanged = ($since === '') || (strtotime($latest) > strtotime($since));

        sendResponse([
            'has_changed' => $hasChanged,
            'server_time' => date('c'),
            'latest_change' => $latest
        ]);
    }

    // 2. Snapshot Completo Oficial da Aplicação
    $schools = $pdo->query("SELECT * FROM escolas ORDER BY school_name ASC")->fetchAll();
    $classes = $pdo->query("SELECT * FROM turmas ORDER BY class_name ASC")->fetchAll();
    $students = $pdo->query("SELECT * FROM alunos ORDER BY student_name ASC")->fetchAll();
    $activities = $pdo->query("SELECT * FROM atividades ORDER BY created_at DESC")->fetchAll();
    $grades = $pdo->query("SELECT * FROM resultados ORDER BY created_at DESC")->fetchAll();
    $posts = $pdo->query("SELECT * FROM posts ORDER BY post_is_pinned DESC, created_at DESC")->fetchAll();
    $events = $pdo->query("SELECT * FROM eventos ORDER BY date ASC")->fetchAll();
    $admins = $pdo->query("SELECT entity_id, username, name, email, role, photo_url, created_at FROM administradores ORDER BY name ASC")->fetchAll();
    
    // Arquivos com decodificação segura de tags e colaboradores
    $rawFiles = $pdo->query("SELECT * FROM arquivos_colaborativos ORDER BY updated_at DESC")->fetchAll();
    $files = array_map(function($f) {
        $f['tags'] = $f['tags'] ? json_decode($f['tags'], true) : [];
        $f['collaborators'] = $f['collaborators'] ? json_decode($f['collaborators'], true) : [];
        return $f;
    }, $rawFiles);

    // Converte posts fixados para booleano
    $posts = array_map(function($p) {
        $p['post_is_pinned'] = (bool)$p['post_is_pinned'];
        return $p;
    }, $posts);

    // Converte valores de notas para float
    $grades = array_map(function($g) {
        $g['grade_value'] = (float)$g['grade_value'];
        return $g;
    }, $grades);

    $snapshot = [
        'schools' => $schools,
        'classes' => $classes,
        'students' => $students,
        'activities' => $activities,
        'grades' => $grades,
        'posts' => $posts,
        'events' => $events,
        'admins' => $admins,
        'collaborative_files' => $files,
        'server_time' => date('c')
    ];

    sendResponse($snapshot, 200, 'Base central do MySQL Hostinger sincronizada com sucesso.');
}

// POST: Presença online de usuários em tempo real
if ($method === 'POST') {
    $input = getJsonInput();
    $action = $input['action'] ?? '';

    // Atualiza heartbeat de presença
    if ($action === 'presence' || !empty($input['session_id'])) {
        $sessionId = trim($input['session_id'] ?? '');
        $userId = trim($input['user_id'] ?? '');
        $userName = trim($input['user_name'] ?? '');
        $userRole = trim($input['user_role'] ?? 'visitor');
        $roleDetail = trim($input['role_detail'] ?? '');
        $deviceType = trim($input['device_type'] ?? 'desktop');
        $browserName = trim($input['browser_name'] ?? '');
        $currentPage = trim($input['current_page'] ?? '');
        $now = date('c');
        $millis = (int)(microtime(true) * 1000);

        if ($sessionId && $userName) {
            $stmt = $pdo->prepare("
                INSERT INTO usuarios_online (
                    session_id, user_id, user_name, user_role, role_detail,
                    device_type, browser_name, current_page, last_seen, last_seen_millis, joined_at
                ) VALUES (
                    :sid, :uid, :unm, :urole, :rdetail,
                    :dtype, :bname, :cpage, :ls, :lsm, :ja
                )
                ON DUPLICATE KEY UPDATE
                    user_name = VALUES(user_name),
                    user_role = VALUES(user_role),
                    role_detail = VALUES(role_detail),
                    device_type = VALUES(device_type),
                    browser_name = VALUES(browser_name),
                    current_page = VALUES(current_page),
                    last_seen = VALUES(last_seen),
                    last_seen_millis = VALUES(last_seen_millis)
            ");
            $stmt->execute([
                ':sid' => $sessionId,
                ':uid' => $userId ?: 'visitor',
                ':unm' => $userName,
                ':urole' => $userRole,
                ':rdetail' => $roleDetail,
                ':dtype' => $deviceType,
                ':bname' => $browserName,
                ':cpage' => $currentPage,
                ':ls' => $now,
                ':lsm' => $millis,
                ':ja' => $now
            ]);
        }

        // Limpa sessões inativas há mais de 45 segundos
        $staleMillis = $millis - 45000;
        $pdo->prepare("DELETE FROM usuarios_online WHERE last_seen_millis < :stale")->execute([':stale' => $staleMillis]);

        // Retorna todos os usuários ativos
        $activeUsers = $pdo->query("SELECT * FROM usuarios_online ORDER BY user_name ASC")->fetchAll();
        sendResponse($activeUsers, 200);
    }

    sendError('Ação de sincronização não suportada.', 400);
}

sendError('Método HTTP não suportado', 405);
