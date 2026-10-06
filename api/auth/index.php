<?php
/**
 * Endpoint de Autenticação: /api/auth/
 * Suporta Login de Administrador, Login de Aluno e Validação de Credenciais
 */

require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST') {
    $input = getJsonInput();

    // 1. Login de Administrador
    if ($action === 'admin' || (!empty($input['user_type']) && $input['user_type'] === 'admin') || (!empty($input['username']) && !empty($input['password']))) {
        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');

        if (!$username || !$password) {
            sendError('Usuário e senha são obrigatórios para acesso administrativo.', 400);
        }

        // Remove '@' inicial se o usuário digitou
        $cleanUsername = ltrim($username, '@');

        $stmt = $pdo->prepare("SELECT * FROM administradores WHERE username = :u1 OR username = :u2 OR email = :u3 LIMIT 1");
        $stmt->execute([
            ':u1' => $username,
            ':u2' => $cleanUsername,
            ':u3' => $username
        ]);
        $admin = $stmt->fetch();

        if (!$admin) {
            sendError('Administrador não encontrado ou credenciais incorretas.', 401);
        }

        // Validação da senha (suporta tanto hash seguro quanto texto claro para contas padrão iniciais)
        $passwordMatch = ($admin['password'] === $password) || password_verify($password, $admin['password']);

        if (!$passwordMatch) {
            sendError('Senha incorreta para o usuário informado.', 401);
        }

        // Não retorna o hash da senha na resposta
        unset($admin['password']);

        // Gera token de sessão opaco
        $token = bin2hex(random_bytes(32));

        sendResponse([
            'token' => $token,
            'role' => 'admin',
            'user' => $admin
        ], 200, 'Acesso administrativo autorizado com sucesso.');
    }

    // 2. Login de Aluno
    if ($action === 'student' || (!empty($input['user_type']) && $input['user_type'] === 'student') || (!empty($input['email']) && !empty($input['matricula']))) {
        $email = trim($input['email'] ?? $input['username'] ?? '');
        $matricula = trim($input['matricula'] ?? $input['password'] ?? '');

        if (!$email || !$matricula) {
            sendError('Identificador do aluno e matrícula são obrigatórios.', 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM alunos WHERE (student_email = :e1 OR student_name = :e2) AND student_matricula = :m LIMIT 1");
        $stmt->execute([
            ':e1' => $email,
            ':e2' => $email,
            ':m' => $matricula
        ]);
        $student = $stmt->fetch();

        if (!$student) {
            sendError('Aluno não localizado ou matrícula incorreta.', 401);
        }

        $token = bin2hex(random_bytes(32));

        sendResponse([
            'token' => $token,
            'role' => 'student',
            'student' => $student
        ], 200, 'Acesso de aluno autorizado com sucesso.');
    }

    sendError('Ação de autenticação não reconhecida.', 400);
}

if ($method === 'GET') {
    // Listagem pública segura de administradores (apenas para verificação de inicialização, sem senhas)
    $stmt = $pdo->query("SELECT entity_id, username, name, email, role, photo_url, created_at FROM administradores ORDER BY name ASC");
    $admins = $stmt->fetchAll();
    sendResponse($admins, 200);
}

sendError('Método HTTP não suportado', 405);
