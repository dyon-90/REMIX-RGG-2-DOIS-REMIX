export interface School {
  entity_id: string;
  school_name: string;
  school_city: string;
  school_contact?: string;
  created_at: string;
}

export interface ClassRoom {
  entity_id: string;
  class_name: string;
  class_school_id: string;
  class_school_name: string;
  class_teacher: string;
  created_at: string;
}

export interface Student {
  entity_id: string;
  student_name: string;
  student_email: string; // Used as Login
  student_class_id: string;
  student_class_name: string;
  student_matricula: string; // Used as Password
  created_at: string;
}

export interface Activity {
  entity_id: string;
  activity_name: string;
  activity_class_id: string;
  activity_class_name: string;
  activity_discipline: string; // e.g., "Português" | "Matemática"
  activity_due_date: string;
  activity_description?: string;
  activity_link?: string;
  activity_embed_url?: string;
  created_at: string;
}

export interface Grade {
  entity_id: string;
  grade_student_id: string;
  grade_student_name: string;
  grade_activity_id: string;
  grade_activity_name: string;
  grade_value: number;
  grade_feedback?: string;
  grade_date: string;
  student_submission?: string;
  student_submission_link?: string;
  student_submitted_at?: string;
  status?: 'pending' | 'submitted' | 'graded';
  created_at: string;
}

export interface Post {
  entity_id: string;
  post_content: string;
  post_author_id: string;
  post_author_name: string;
  post_author_type: 'admin' | 'student';
  post_class_id?: string;
  post_is_pinned: boolean;
  post_parent_id?: string;
  post_link?: string;
  post_image?: string;
  post_created_at: string;
  created_at: string;
}

export type AcademicEventType = 'exam' | 'holiday' | 'deadline' | 'event' | 'meeting';

export interface AcademicEvent {
  entity_id: string;
  title: string;
  date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  type: AcademicEventType;
  description?: string;
  discipline?: string;
  class_id?: string;
  class_name?: string;
  school_id?: string;
  location?: string;
  created_at: string;
}

export interface AdminUser {
  entity_id: string;
  username: string; // Login de acesso (ex: dyon.gomes)
  password: string; // Senha de acesso
  name: string; // Nome completo do administrador
  email?: string;
  role?: string; // Cargo/função (ex: Administrador Geral, Coordenador Pedagógico)
  photo_url?: string;
  auth_uid?: string;
  created_at: string;
}

export interface CollaborativeFile {
  entity_id: string;
  title: string;
  category: string; // 'planejamento' | 'ata' | 'roteiro' | 'projeto' | 'geral'
  content: string; // Texto/conteúdo colaborativo do arquivo
  author_id: string;
  author_name: string;
  last_modified_by: string;
  last_modified_by_name: string;
  last_modified_at: string;
  version: number;
  created_at: string;
  tags?: string[];
  active_field?: string;
  collaborators?: string[];
}

export interface AppData {
  schools: School[];
  classes: ClassRoom[];
  students: Student[];
  activities: Activity[];
  grades: Grade[];
  posts: Post[];
  events?: AcademicEvent[];
  admins?: AdminUser[];
  collaborative_files?: CollaborativeFile[];
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface OnlineUserPresence {
  session_id: string;
  user_id: string;
  user_name: string;
  user_role: 'admin' | 'student' | 'visitor';
  role_detail?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  browser_name?: string;
  current_page?: string;
  last_seen: string;
  last_seen_millis?: number;
  joined_at: string;
}

export type LogActionType = 'create' | 'update' | 'delete' | 'submit' | 'evaluate' | 'restore' | 'import' | 'clear';
export type LogEntityType = 'school' | 'class' | 'student' | 'activity' | 'grade' | 'post' | 'event' | 'admin' | 'file' | 'backup' | 'system';

export interface SystemLog {
  entity_id: string;
  timestamp: string; // ISO string
  action_type: LogActionType;
  entity_type: LogEntityType;
  entity_title: string;
  user_id: string;
  user_name: string;
  user_role: 'admin' | 'student' | 'system';
  details?: string;
  restore_point_id?: string;
}

export interface RestorePointMetrics {
  schoolsCount: number;
  classesCount: number;
  studentsCount: number;
  activitiesCount: number;
  gradesCount: number;
  postsCount: number;
  eventsCount: number;
  adminsCount: number;
  filesCount: number;
  totalEntities: number;
}

export interface RestorePoint {
  entity_id: string; // rp_timestamp_random
  timestamp: string; // ISO string
  trigger_reason: string; // e.g. "Alteração por Maria (Aluno) - Entrega de atividade"
  author_name: string;
  author_role: 'admin' | 'student' | 'system';
  action_type: LogActionType;
  is_auto: boolean; // true for background auto-backup, false for manual restore points
  label?: string; // Custom label if created manually
  metrics: RestorePointMetrics;
  snapshot: AppData; // Full state at that point in time
}

export interface CertificateCriteria {
  minGrade: number; // e.g. 6.0 ou 7.0
  minAttendance: number; // e.g. 75%
  workloadHours: number; // e.g. 120 horas
  courseTitle: string;
  coordinatorName: string;
  directorName: string;
  issueDate: string;
  institutionName: string;
  mentionSchoolInCertificate: boolean;
}

export interface StudentCertificateData {
  student: Student;
  classRoom?: ClassRoom;
  school?: School;
  averageGrade: number;
  gradedCount: number;
  totalActivitiesCount: number;
  submittedCount: number;
  attendancePercent: number;
  isAttendanceCustom?: boolean;
  status: 'eligible' | 'pending_grade' | 'pending_attendance' | 'ineligible';
  certificateCode: string;
}
