-- ==============================================================================
-- SCHEMA POSTGRESQL PARA SUPABASE — PROJETO 2+DOIS= APRENDER!
-- Plataforma Educacional Centralizada Multi-dispositivo
-- ==============================================================================
-- Execute este script completo no Supabase SQL Editor para provisionar todas
-- as tabelas, índices, constraints, triggers e políticas RLS de segurança.
-- ==============================================================================

-- 1. Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Função utilitária para manter updated_at sincronizado automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- TABELA: schools (Escolas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.schools (
  entity_id VARCHAR(120) PRIMARY KEY,
  school_name TEXT NOT NULL,
  school_city TEXT NOT NULL,
  school_contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schools_city ON public.schools (school_city);
CREATE INDEX IF NOT EXISTS idx_schools_name ON public.schools (school_name);

DROP TRIGGER IF EXISTS trg_schools_updated_at ON public.schools;
CREATE TRIGGER trg_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- TABELA: classes (Turmas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.classes (
  entity_id VARCHAR(120) PRIMARY KEY,
  class_name TEXT NOT NULL,
  class_school_id VARCHAR(120) REFERENCES public.schools(entity_id) ON DELETE SET NULL,
  class_school_name TEXT,
  class_teacher TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes (class_school_id);
CREATE INDEX IF NOT EXISTS idx_classes_name ON public.classes (class_name);

DROP TRIGGER IF EXISTS trg_classes_updated_at ON public.classes;
CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- TABELA: students (Alunos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.students (
  entity_id VARCHAR(120) PRIMARY KEY,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL UNIQUE,
  student_class_id VARCHAR(120) REFERENCES public.classes(entity_id) ON DELETE SET NULL,
  student_class_name TEXT,
  student_matricula TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students (student_class_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students (student_email);
CREATE INDEX IF NOT EXISTS idx_students_matricula ON public.students (student_matricula);

DROP TRIGGER IF EXISTS trg_students_updated_at ON public.students;
CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- TABELA: activities (Atividades)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activities (
  entity_id VARCHAR(120) PRIMARY KEY,
  activity_name TEXT NOT NULL,
  activity_class_id VARCHAR(120) REFERENCES public.classes(entity_id) ON DELETE CASCADE,
  activity_class_name TEXT,
  activity_discipline TEXT NOT NULL,
  activity_due_date TEXT NOT NULL,
  activity_description TEXT,
  activity_link TEXT,
  activity_embed_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_class_id ON public.activities (activity_class_id);
CREATE INDEX IF NOT EXISTS idx_activities_discipline ON public.activities (activity_discipline);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON public.activities (activity_due_date);

DROP TRIGGER IF EXISTS trg_activities_updated_at ON public.activities;
CREATE TRIGGER trg_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- TABELA: grades (Notas e Entregas dos Alunos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.grades (
  entity_id VARCHAR(120) PRIMARY KEY,
  grade_student_id VARCHAR(120) REFERENCES public.students(entity_id) ON DELETE CASCADE,
  grade_student_name TEXT,
  grade_activity_id VARCHAR(120) REFERENCES public.activities(entity_id) ON DELETE CASCADE,
  grade_activity_name TEXT,
  grade_value NUMERIC(5,2) DEFAULT 0,
  grade_feedback TEXT,
  grade_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  student_submission TEXT,
  student_submission_link TEXT,
  student_submitted_at TIMESTAMPTZ,
  status VARCHAR(40) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_student_activity UNIQUE (grade_student_id, grade_activity_id)
);

CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades (grade_student_id);
CREATE INDEX IF NOT EXISTS idx_grades_activity_id ON public.grades (grade_activity_id);
CREATE INDEX IF NOT EXISTS idx_grades_status ON public.grades (status);

DROP TRIGGER IF EXISTS trg_grades_updated_at ON public.grades;
CREATE TRIGGER trg_grades_updated_at
  BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- TABELA: posts (Mural Escolar de Avisos e Comunicações)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
  entity_id VARCHAR(120) PRIMARY KEY,
  post_content TEXT NOT NULL,
  post_author_id VARCHAR(120) NOT NULL,
  post_author_name TEXT NOT NULL,
  post_author_type VARCHAR(20) NOT NULL DEFAULT 'admin',
  post_class_id VARCHAR(120) REFERENCES public.classes(entity_id) ON DELETE CASCADE,
  post_is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  post_parent_id VARCHAR(120),
  post_link TEXT,
  post_image TEXT,
  post_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_pinned ON public.posts (post_is_pinned);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_class_id ON public.posts (post_class_id);

DROP TRIGGER IF EXISTS trg_posts_updated_at ON public.posts;
CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- TABELA: events (Calendário Acadêmico)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.events (
  entity_id VARCHAR(120) PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  end_date TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'event',
  description TEXT,
  discipline TEXT,
  class_id VARCHAR(120) REFERENCES public.classes(entity_id) ON DELETE CASCADE,
  class_name TEXT,
  school_id VARCHAR(120) REFERENCES public.schools(entity_id) ON DELETE CASCADE,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events (date);
CREATE INDEX IF NOT EXISTS idx_events_school ON public.events (school_id);

DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events;
CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- TABELA: admins (Administradores da Plataforma)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admins (
  entity_id VARCHAR(120) PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'Administrador Geral',
  photo_url TEXT,
  auth_uid UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_username ON public.admins (LOWER(username));

DROP TRIGGER IF EXISTS trg_admins_updated_at ON public.admins;
CREATE TRIGGER trg_admins_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Inserir administrador principal se não existir
INSERT INTO public.admins (entity_id, username, password, name, email, role, created_at)
VALUES (
  'admin_1',
  'dyon.gomes',
  '@gomes2026',
  'Dyon Gomes',
  'dyonnes90@gmail.com',
  'Administrador Geral',
  NOW()
)
ON CONFLICT (username) DO NOTHING;

-- ==============================================================================
-- TABELA: collaborative_files (Documentos Colaborativos em Tempo Real)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.collaborative_files (
  entity_id VARCHAR(120) PRIMARY KEY,
  title TEXT NOT NULL,
  category VARCHAR(60) NOT NULL DEFAULT 'planejamento',
  content TEXT NOT NULL DEFAULT '',
  author_id VARCHAR(120) NOT NULL,
  author_name TEXT NOT NULL,
  last_modified_by VARCHAR(120),
  last_modified_by_name TEXT,
  last_modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INT NOT NULL DEFAULT 1,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_field TEXT,
  collaborators JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collab_files_category ON public.collaborative_files (category);
CREATE INDEX IF NOT EXISTS idx_collab_files_author ON public.collaborative_files (author_id);

DROP TRIGGER IF EXISTS trg_collab_files_updated_at ON public.collaborative_files;
CREATE TRIGGER trg_collab_files_updated_at
  BEFORE UPDATE ON public.collaborative_files
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- TABELA: system_logs (Trilha de Auditoria e Logs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.system_logs (
  entity_id VARCHAR(120) PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action_type VARCHAR(40) NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_title TEXT NOT NULL,
  user_id VARCHAR(120) NOT NULL,
  user_name TEXT NOT NULL,
  user_role VARCHAR(40) NOT NULL,
  details TEXT,
  restore_point_id VARCHAR(120)
);

CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON public.system_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_entity ON public.system_logs (entity_type, entity_id);

-- ==============================================================================
-- TABELA: restore_points (Pontos de Restauração e Snapshots)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.restore_points (
  entity_id VARCHAR(120) PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trigger_reason TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role VARCHAR(40) NOT NULL,
  action_type VARCHAR(40) NOT NULL,
  is_auto BOOLEAN NOT NULL DEFAULT TRUE,
  label TEXT,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_restore_points_timestamp ON public.restore_points (timestamp DESC);

-- ==============================================================================
-- TABELA: online_users (Presença de Usuários em Tempo Real)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.online_users (
  session_id VARCHAR(120) PRIMARY KEY,
  user_id VARCHAR(120) NOT NULL,
  user_name TEXT NOT NULL,
  user_role VARCHAR(40) NOT NULL,
  role_detail TEXT,
  device_type VARCHAR(30) DEFAULT 'desktop',
  browser_name VARCHAR(50) DEFAULT 'Navegador',
  current_page TEXT,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_millis BIGINT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_online_users_last_seen ON public.online_users (last_seen DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborative_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restore_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_users ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público controlado para a chave anon (Frontend educacional)
-- Permite leitura de escolas, turmas, atividades, posts, eventos e arquivos colaborativos
CREATE POLICY "Public read schools" ON public.schools FOR SELECT USING (true);
CREATE POLICY "Public write schools" ON public.schools FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Public write classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Public write students" ON public.students FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Public write activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read grades" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Public write grades" ON public.grades FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Public write posts" ON public.posts FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public write events" ON public.events FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read admins" ON public.admins FOR SELECT USING (true);
CREATE POLICY "Public write admins" ON public.admins FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read files" ON public.collaborative_files FOR SELECT USING (true);
CREATE POLICY "Public write files" ON public.collaborative_files FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read logs" ON public.system_logs FOR SELECT USING (true);
CREATE POLICY "Public write logs" ON public.system_logs FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read restore_points" ON public.restore_points FOR SELECT USING (true);
CREATE POLICY "Public write restore_points" ON public.restore_points FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read online_users" ON public.online_users FOR SELECT USING (true);
CREATE POLICY "Public write online_users" ON public.online_users FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- HABILITAR REALTIME DO SUPABASE (Sincronização instantânea multi-dispositivo)
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
      public.schools,
      public.classes,
      public.students,
      public.activities,
      public.grades,
      public.posts,
      public.events,
      public.admins,
      public.collaborative_files,
      public.online_users,
      public.system_logs,
      public.restore_points;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignora se as tabelas já pertencerem à publicação
  NULL;
END $$;
