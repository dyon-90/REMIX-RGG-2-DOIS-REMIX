-- ==============================================================================
-- 2+DOIS= Aprender! - Estrutura de Banco de Dados MySQL / MariaDB (Hostinger)
-- Compatível com PHP 8.x, PDO, Prepared Statements e Multi-usuário Simultâneo
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. Tabela: administradores (Usuários com acesso ao painel de gestão)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `administradores` (
  `entity_id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) DEFAULT NULL,
  `role` VARCHAR(100) NOT NULL DEFAULT 'Administrador Geral',
  `photo_url` TEXT DEFAULT NULL,
  `auth_uid` VARCHAR(128) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`entity_id`),
  UNIQUE KEY `idx_admin_username` (`username`),
  KEY `idx_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Tabela: escolas (Instituições de Ensino)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `escolas` (
  `entity_id` VARCHAR(64) NOT NULL,
  `school_name` VARCHAR(255) NOT NULL,
  `school_city` VARCHAR(150) NOT NULL,
  `school_contact` VARCHAR(150) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`entity_id`),
  KEY `idx_escola_nome` (`school_name`),
  KEY `idx_escola_cidade` (`school_city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Tabela: turmas (Classes / Anos Letivos vinculadas a escolas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `turmas` (
  `entity_id` VARCHAR(64) NOT NULL,
  `class_name` VARCHAR(150) NOT NULL,
  `class_school_id` VARCHAR(64) NOT NULL,
  `class_school_name` VARCHAR(255) DEFAULT NULL,
  `class_teacher` VARCHAR(150) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`entity_id`),
  KEY `idx_turma_escola` (`class_school_id`),
  KEY `idx_turma_nome` (`class_name`),
  CONSTRAINT `fk_turmas_escolas` FOREIGN KEY (`class_school_id`) REFERENCES `escolas` (`entity_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Tabela: alunos (Estudantes matriculados com login individual)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `alunos` (
  `entity_id` VARCHAR(64) NOT NULL,
  `student_name` VARCHAR(150) NOT NULL,
  `student_email` VARCHAR(191) NOT NULL,
  `student_class_id` VARCHAR(64) NOT NULL,
  `student_class_name` VARCHAR(150) DEFAULT NULL,
  `student_matricula` VARCHAR(100) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`entity_id`),
  UNIQUE KEY `idx_aluno_email` (`student_email`),
  KEY `idx_aluno_turma` (`student_class_id`),
  KEY `idx_aluno_matricula` (`student_matricula`),
  CONSTRAINT `fk_alunos_turmas` FOREIGN KEY (`student_class_id`) REFERENCES `turmas` (`entity_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Tabela: atividades (Tarefas, exercícios e projetos pedagógicos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `atividades` (
  `entity_id` VARCHAR(64) NOT NULL,
  `activity_name` VARCHAR(255) NOT NULL,
  `activity_class_id` VARCHAR(64) NOT NULL,
  `activity_class_name` VARCHAR(150) DEFAULT NULL,
  `activity_discipline` VARCHAR(100) NOT NULL,
  `activity_due_date` VARCHAR(50) NOT NULL,
  `activity_description` TEXT DEFAULT NULL,
  `activity_link` VARCHAR(500) DEFAULT NULL,
  `activity_embed_url` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`entity_id`),
  KEY `idx_atividade_turma` (`activity_class_id`),
  KEY `idx_atividade_disciplina` (`activity_discipline`),
  CONSTRAINT `fk_atividades_turmas` FOREIGN KEY (`activity_class_id`) REFERENCES `turmas` (`entity_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Tabela: resultados (Notas, submissões de alunos e avaliações)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `resultados` (
  `entity_id` VARCHAR(64) NOT NULL,
  `grade_student_id` VARCHAR(64) NOT NULL,
  `grade_student_name` VARCHAR(150) NOT NULL,
  `grade_activity_id` VARCHAR(64) NOT NULL,
  `grade_activity_name` VARCHAR(255) NOT NULL,
  `grade_value` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `grade_feedback` TEXT DEFAULT NULL,
  `grade_date` VARCHAR(50) NOT NULL,
  `student_submission` LONGTEXT DEFAULT NULL,
  `student_submission_link` VARCHAR(500) DEFAULT NULL,
  `student_submitted_at` VARCHAR(50) DEFAULT NULL,
  `status` ENUM('pending', 'submitted', 'graded') NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`entity_id`),
  KEY `idx_resultado_aluno` (`grade_student_id`),
  KEY `idx_resultado_atividade` (`grade_activity_id`),
  KEY `idx_resultado_status` (`status`),
  CONSTRAINT `fk_resultados_alunos` FOREIGN KEY (`grade_student_id`) REFERENCES `alunos` (`entity_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_resultados_atividades` FOREIGN KEY (`grade_activity_id`) REFERENCES `atividades` (`entity_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Tabela: posts (Mural de recados, comunicados e projetos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `posts` (
  `entity_id` VARCHAR(64) NOT NULL,
  `post_content` TEXT NOT NULL,
  `post_author_id` VARCHAR(64) NOT NULL,
  `post_author_name` VARCHAR(150) NOT NULL,
  `post_author_type` ENUM('admin', 'student') NOT NULL,
  `post_class_id` VARCHAR(64) DEFAULT NULL,
  `post_is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `post_parent_id` VARCHAR(64) DEFAULT NULL,
  `post_link` VARCHAR(500) DEFAULT NULL,
  `post_image` LONGTEXT DEFAULT NULL,
  `post_created_at` VARCHAR(50) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`entity_id`),
  KEY `idx_posts_turma` (`post_class_id`),
  KEY `idx_posts_fixado` (`post_is_pinned`),
  KEY `idx_posts_autor` (`post_author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Tabela: eventos (Calendário escolar e compromissos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `eventos` (
  `entity_id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `end_date` VARCHAR(50) DEFAULT NULL,
  `type` ENUM('exam', 'holiday', 'deadline', 'event', 'meeting') NOT NULL DEFAULT 'event',
  `description` TEXT DEFAULT NULL,
  `discipline` VARCHAR(100) DEFAULT NULL,
  `class_id` VARCHAR(64) DEFAULT NULL,
  `class_name` VARCHAR(150) DEFAULT NULL,
  `school_id` VARCHAR(64) DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`entity_id`),
  KEY `idx_eventos_data` (`date`),
  KEY `idx_eventos_tipo` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Tabela: arquivos_colaborativos (Documentos, atas e planejamentos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `arquivos_colaborativos` (
  `entity_id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `author_id` VARCHAR(64) NOT NULL,
  `author_name` VARCHAR(150) NOT NULL,
  `last_modified_by` VARCHAR(64) NOT NULL,
  `last_modified_by_name` VARCHAR(150) NOT NULL,
  `last_modified_at` VARCHAR(50) NOT NULL,
  `version` INT NOT NULL DEFAULT 1,
  `tags` JSON DEFAULT NULL,
  `collaborators` JSON DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`entity_id`),
  KEY `idx_arquivos_categoria` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. Tabela: configuracoes (Metadados do sistema, certificados, backups)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `configuracoes` (
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` LONGTEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. Tabela: usuarios_online (Presença em tempo real entre dispositivos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios_online` (
  `session_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `user_role` VARCHAR(50) NOT NULL,
  `role_detail` VARCHAR(150) DEFAULT NULL,
  `device_type` VARCHAR(50) DEFAULT NULL,
  `browser_name` VARCHAR(100) DEFAULT NULL,
  `current_page` VARCHAR(100) DEFAULT NULL,
  `last_seen` VARCHAR(50) NOT NULL,
  `last_seen_millis` BIGINT NOT NULL,
  `joined_at` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`session_id`),
  KEY `idx_online_last_seen` (`last_seen_millis`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. Tabela: logs_sistema (Auditoria operacional)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `logs_sistema` (
  `entity_id` VARCHAR(64) NOT NULL,
  `timestamp` VARCHAR(50) NOT NULL,
  `action_type` VARCHAR(50) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_title` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `user_role` VARCHAR(50) NOT NULL,
  `details` TEXT DEFAULT NULL,
  `restore_point_id` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`entity_id`),
  KEY `idx_logs_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. Tabela: pontos_restauracao (Snapshots de recuperação e histórico)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pontos_restauracao` (
  `entity_id` VARCHAR(64) NOT NULL,
  `timestamp` VARCHAR(50) NOT NULL,
  `trigger_reason` TEXT NOT NULL,
  `author_name` VARCHAR(150) NOT NULL,
  `author_role` VARCHAR(50) NOT NULL,
  `action_type` VARCHAR(50) NOT NULL,
  `is_auto` TINYINT(1) NOT NULL DEFAULT 1,
  `label` VARCHAR(255) DEFAULT NULL,
  `metrics` JSON NOT NULL,
  `snapshot` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`entity_id`),
  KEY `idx_pontos_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Inserção do Administrador Principal Oficial (dyon.gomes)
-- ------------------------------------------------------------------------------
INSERT INTO `administradores` (`entity_id`, `username`, `password`, `name`, `email`, `role`, `created_at`)
VALUES
  ('admin_1', 'dyon.gomes', '@gomes2026', 'Dyon Gomes', 'dyonnes90@gmail.com', 'Administrador Geral', NOW())
ON DUPLICATE KEY UPDATE
  `password` = VALUES(`password`),
  `name` = VALUES(`name`);

-- ------------------------------------------------------------------------------
-- Inserção do Documento Inicial de Planejamento Pedagógico
-- ------------------------------------------------------------------------------
INSERT INTO `arquivos_colaborativos` (
  `entity_id`, `title`, `category`, `content`, `author_id`, `author_name`,
  `last_modified_by`, `last_modified_by_name`, `last_modified_at`, `version`, `tags`
) VALUES (
  'doc_planejamento_2026',
  'Planejamento Pedagógico Integrado - 9º Ano',
  'planejamento',
  'PLANEJAMENTO PEDAGÓGICO INTEGRADO • 9º ANO\nProfessores e Coordenadores Responsáveis: Dyon Gomes, Levi Oliveira, Clarice Monteiro.\n\n1. OBJETIVOS DE APRENDIZAGEM\n- Desenvolver habilidades prioritárias de resolução de problemas e interpretação textual alinhadas à matriz SPAECE.\n- Fomentar o raciocínio lógico-matemático através de metodologias ativas e tecnologia digital.\n- Garantir o acompanhamento formativo contínuo dos estudantes com foco em equidade.\n\n2. CRONOGRAMA DE ATIVIDADES E METAS\n- Semana 1: Diagnóstico inicial e nivelamento das turmas.\n- Semana 2: Aplicação de desafios matemáticos contextuais e oficinas de leitura.\n- Semana 3: Avaliação intermediária e círculos de reforço pedagógico.\n- Semana 4: Simulado diagnóstico e devolutiva individualizada aos estudantes.\n\n3. RECURSOS E MATERIAIS ADOTADOS\n- Cadernos de atividades pedagógicas integradas.\n- Plataforma digital 2+DOIS= Aprender com submissão online de tarefas.\n- Mural escolar interativo para avisos e projetos interdisciplinares.',
  'admin_1',
  'Dyon Gomes',
  'admin_1',
  'Dyon Gomes',
  '2026-03-01T10:00:00.000Z',
  1,
  '["9º Ano", "Planejamento", "SPAECE", "Matemática", "Português"]'
) ON DUPLICATE KEY UPDATE `version` = `version`;

SET FOREIGN_KEY_CHECKS = 1;
