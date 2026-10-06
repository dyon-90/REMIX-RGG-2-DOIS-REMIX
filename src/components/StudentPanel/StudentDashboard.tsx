import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Student, Activity } from '../../types';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Award, 
  Trophy, 
  Calendar, 
  CalendarDays,
  Eye, 
  MessageCircle, 
  Megaphone, 
  Pin, 
  ExternalLink,
  Send,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { ActivityDetailsModal } from '../Modals/ActivityDetailsModal';
import { AcademicCalendar } from '../Calendar/AcademicCalendar';
import { StudentGradesEvolutionChart } from './StudentGradesEvolutionChart';
import { StudentDisciplineComparisonChart } from './StudentDisciplineComparisonChart';
import { StudentClassRankingModule } from './StudentClassRankingModule';
import { sanitizeUrl } from '../../utils/security';

interface StudentDashboardProps {
  student: Student;
}

type StudentTab = 'activities' | 'rankings' | 'mural' | 'calendar';

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ student }) => {
  const { data, addPost, showToast, syncStatus } = useData();
  const [activeTab, setActiveTab] = useState<StudentTab>('activities');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Student specific data
  const studentActivities = data.activities.filter(a => a.activity_class_id === student.student_class_id);
  const studentGrades = data.grades.filter(g => g.grade_student_id === student.entity_id);

  const completedCount = studentGrades.length;
  const pendingCount = Math.max(0, studentActivities.length - completedCount);
  const totalScore = studentGrades.reduce((sum, g) => sum + (Number(g.grade_value) || 0), 0);
  const gradeAverage = studentGrades.length > 0 && !isNaN(totalScore) ? (totalScore / studentGrades.length).toFixed(1) : '—';

  // Mural state for students
  const [studentPostContent, setStudentPostContent] = useState('');
  const [replyPostId, setReplyPostId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleCreateStudentPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentPostContent.trim()) return;

    addPost({
      content: studentPostContent.trim(),
      authorId: student.entity_id,
      authorName: student.student_name,
      authorType: 'student',
      classId: student.student_class_id,
      isPinned: false
    });

    setStudentPostContent('');
    showToast('✓ Mensagem enviada para o mural!');
  };

  const handleSendReply = (parentId: string) => {
    if (!replyContent.trim()) return;

    addPost({
      content: replyContent.trim(),
      authorId: student.entity_id,
      authorName: student.student_name,
      authorType: 'student',
      classId: student.student_class_id,
      isPinned: false,
      parentId
    });

    setReplyContent('');
    setReplyPostId(null);
    showToast('✓ Resposta publicada!');
  };

  // Rankings calculation based on Grade Average (Média das Notas)
  const classStudents = (data.students || []).filter(s => s.student_class_id === student.student_class_id);
  const classLeaderboard = classStudents.map(st => {
    const grades = (data.grades || []).filter(g => g.grade_student_id === st.entity_id);
    const total = grades.reduce((sum, g) => sum + (Number(g.grade_value) || 0), 0);
    return {
      id: st.entity_id,
      name: st.student_name,
      total,
      count: grades.length,
      avg: grades.length > 0 ? total / grades.length : 0
    };
  }).filter(s => s.count > 0).sort((a, b) => b.avg - a.avg || b.count - a.count || b.total - a.total);

  const myRank = classLeaderboard.findIndex(s => s.id === student.entity_id) + 1;
  const myLeaderboardItem = classLeaderboard.find(s => s.id === student.entity_id);
  const myTotal = Number(myLeaderboardItem?.total) || 0;
  const myAverageNum = myLeaderboardItem ? myLeaderboardItem.avg : 0;

  // Portuguese & Math breakdowns
  const ptGrades = studentGrades.filter(g => {
    const act = (data.activities || []).find(a => a.entity_id === g.grade_activity_id);
    return Boolean(act && act.activity_discipline && act.activity_discipline.toLowerCase().includes('portugu'));
  });
  const ptTotal = ptGrades.reduce((sum, g) => sum + (g.grade_value || 0), 0);
  const ptAvg = ptGrades.length > 0 ? (ptTotal / ptGrades.length).toFixed(1) : '—';

  const mathGrades = studentGrades.filter(g => {
    const act = (data.activities || []).find(a => a.entity_id === g.grade_activity_id);
    return Boolean(act && act.activity_discipline && act.activity_discipline.toLowerCase().includes('matem'));
  });
  const mathTotal = mathGrades.reduce((sum, g) => sum + (g.grade_value || 0), 0);
  const mathAvg = mathGrades.length > 0 ? (mathTotal / mathGrades.length).toFixed(1) : '—';

  // Best activities
  const bestActivities = [...studentGrades].sort((a, b) => b.grade_value - a.grade_value).slice(0, 5);

  // School Top Students
  const schoolId = data.classes.find(c => c.entity_id === student.student_class_id)?.class_school_id;
  const schoolClasses = data.classes.filter(c => c.class_school_id === schoolId);
  const schoolStudents = data.students.filter(s => schoolClasses.some(c => c.entity_id === s.student_class_id));
  const schoolLeaderboard = schoolStudents.map(st => {
    const grades = data.grades.filter(g => g.grade_student_id === st.entity_id);
    const total = grades.reduce((sum, g) => sum + g.grade_value, 0);
    return { name: st.student_name, total, count: grades.length };
  }).filter(s => s.count > 0).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#6924f5] via-[#7a32f7] to-[#8d47fa] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-600/25 border border-white/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-3 border border-white/30 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Espaço de Aprendizagem</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
              Olá, {student.student_name}! 👋
            </h2>
            <p className="text-purple-100 text-xs sm:text-sm mt-1">
              Turma: <strong className="text-white">{student.student_class_name}</strong> • Matrícula: {student.student_matricula}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            {/* Indicador de Auto-salvamento na Nuvem (Sem botão Salvar) */}
            <div 
              id="student-autosave-indicator"
              className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/30 text-white text-xs font-semibold shadow-xs"
              title="Todas as suas respostas e submissões são salvas automaticamente na nuvem"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>Auto-salvamento ativo</span>
            </div>

            <div 
              onClick={() => setActiveTab('rankings')}
              className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/30 shadow-xs cursor-pointer hover:bg-white/25 transition group"
              title="Clique para abrir o módulo de ranking da turma"
            >
              <Trophy className="w-8 h-8 text-amber-300 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-purple-100 flex items-center gap-1">
                  <span>Classificação por Média</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                </p>
                <p className="text-lg font-black text-white">
                  {myRank ? `#${myRank} na Turma` : 'Sem notas'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-zinc-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Atividades Pendentes</p>
            <p className="font-display text-3xl font-black text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-zinc-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Atividades Concluídas</p>
            <p className="font-display text-3xl font-black text-emerald-600 mt-1">{completedCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Average */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-zinc-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Média Geral</p>
            <p className="font-display text-3xl font-black text-[#6f2ef7] mt-1">{gradeAverage}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#6f2ef7] flex items-center justify-center border border-purple-100">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'activities'
                ? 'bg-gradient-to-r from-[#6f2ef7] to-[#5914e6] text-white shadow-md shadow-purple-600/25'
                : 'bg-white text-zinc-700 hover:bg-purple-50/50 border border-zinc-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Minhas Atividades & Notas</span>
          </button>

          <button
            onClick={() => setActiveTab('rankings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'rankings'
                ? 'bg-gradient-to-r from-[#6f2ef7] to-[#5914e6] text-white shadow-md shadow-purple-600/25'
                : 'bg-white text-zinc-700 hover:bg-purple-50/50 border border-zinc-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Ranking da Turma & Desempenho</span>
            {myRank > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                activeTab === 'rankings' ? 'bg-white/25 text-white' : 'bg-purple-100 text-purple-800'
              }`}>
                #{myRank}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('mural')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'mural'
                ? 'bg-gradient-to-r from-[#6f2ef7] to-[#5914e6] text-white shadow-md shadow-purple-600/25'
                : 'bg-white text-zinc-700 hover:bg-purple-50/50 border border-zinc-200'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Mural de Avisos</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'calendar'
                ? 'bg-gradient-to-r from-[#6f2ef7] to-[#5914e6] text-white shadow-md shadow-purple-600/25'
                : 'bg-white text-zinc-700 hover:bg-purple-50/50 border border-zinc-200'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Calendário Acadêmico</span>
          </button>
        </div>

        <div className="self-end sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Sincronizado na Nuvem</span>
        </div>
      </div>

      {/* Tab 1: Activities & Grades */}
      {activeTab === 'activities' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Ranking Highlight Bar */}
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-4 sm:p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center font-black text-base shadow-sm">
                {myRank ? `#${myRank}` : '—'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    Posição na Turma ({student.student_class_name})
                  </span>
                </div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">
                  {myRank ? (
                    <>Você está em <strong>{myRank}º Lugar</strong> com média <strong>{gradeAverage}</strong></>
                  ) : (
                    'Realize atividades para entrar no ranking da turma'
                  )}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {completedCount} atividade(s) concluída(s) • Ranking baseado na média ponderada
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('rankings')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition self-start sm:self-auto active:scale-98"
            >
              <span>Ver Ranking Completo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
          {/* Activities List */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-zinc-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Minhas Atividades</span>
              </h3>
              <span className="text-xs text-zinc-400">{studentActivities.length} total</span>
            </div>

            <div className="space-y-3">
              {studentActivities.length > 0 ? (
                studentActivities.map(act => {
                  const grade = studentGrades.find(g => g.grade_activity_id === act.entity_id);
                  const isGraded = Boolean(grade && (grade.status === 'graded' || (grade.grade_value !== undefined && grade.grade_value > 0)));
                  const isSubmitted = Boolean(grade && (grade.status === 'submitted' || grade.student_submission));
                  const dueDate = new Date(act.activity_due_date);
                  const isOverdue = !isGraded && !isSubmitted && dueDate < new Date();

                  return (
                    <div
                      key={act.entity_id}
                      onClick={() => setSelectedActivity(act)}
                      className="p-4 rounded-xl bg-white hover:bg-zinc-50/80 border border-zinc-200 hover:border-zinc-300 shadow-xs transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-sm text-zinc-900 group-hover:text-indigo-600 transition leading-snug">
                            {act.activity_name}
                          </h4>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 ${
                            isGraded
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isSubmitted
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : isOverdue
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-900 border border-amber-200'
                          }`}>
                            {isGraded
                              ? '✓ Corrigida'
                              : isSubmitted
                              ? '📥 Enviada'
                              : isOverdue
                              ? '⚠ Atrasada'
                              : '📅 Pendente'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                          <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                            {act.activity_discipline}
                          </span>
                          <span className="flex items-center gap-1 text-zinc-500">
                            <Calendar className="w-3 h-3 text-zinc-400" />
                            Prazo: {dueDate.toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        {act.activity_description && (
                          <p className="text-xs text-zinc-600 line-clamp-2 mb-2">
                            {act.activity_description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                        <span className="text-indigo-600 font-semibold flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver detalhes</span>
                        </span>
                        {isGraded && grade ? (
                          <span className="font-black text-emerald-700 text-sm">
                            Nota: {(Number(grade.grade_value) || 0).toFixed(1)}
                          </span>
                        ) : isSubmitted ? (
                          <span className="font-bold text-blue-700 text-xs">
                            Aguardando Correção
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-10 text-xs text-zinc-400">
                  Nenhuma atividade atribuída para a sua turma.
                </p>
              )}
            </div>
          </div>

          {/* Grades List */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-zinc-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Minhas Notas & Feedbacks</span>
              </h3>
              <span className="text-xs text-zinc-400">{studentGrades.length} avaliações</span>
            </div>

            <div className="space-y-3">
              {studentGrades.length > 0 ? (
                studentGrades.map(grade => (
                  <div
                    key={grade.entity_id}
                    className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900">
                          {grade.grade_activity_name}
                        </h4>
                        <p className="text-xs text-zinc-400">
                          Avaliado em {new Date(grade.grade_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-extrabold text-base">
                        {(Number(grade.grade_value) || 0).toFixed(1)}
                      </div>
                    </div>

                    {grade.grade_feedback && (
                      <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs text-zinc-700 mt-1 italic">
                        💬 "{grade.grade_feedback}"
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center py-10 text-xs text-zinc-400">
                  Você ainda não possui notas atribuídas.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Tab 2: Rankings & Performance */}
      {activeTab === 'rankings' && (
        <div className="space-y-8 animate-fade-in">
          {/* Dedicated Class Ranking Module based strictly on grade average */}
          <StudentClassRankingModule 
            student={student} 
            onNavigateToActivities={() => setActiveTab('activities')} 
          />

          {/* Analytical Charts */}
          <div className="space-y-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <h3 className="font-black text-lg text-zinc-900 dark:text-white">
                Análises Comparativas e Evolução das Notas
              </h3>
            </div>

            {/* Recharts Bar Chart: Student vs Class Average per Discipline */}
            <StudentDisciplineComparisonChart student={student} />

            {/* Recharts Grade Evolution Over the Bimester */}
            <StudentGradesEvolutionChart
              student={student}
              grades={studentGrades}
              activities={data.activities}
            />
          </div>

          {/* Discipline Breakdown and Best Activities */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Discipline Performance */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Desempenho por Disciplina</span>
              </h3>

              <div className="space-y-3">
                {/* Portuguese */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900">📖 Português</h4>
                    <p className="text-xs text-zinc-500">{ptGrades.length} atividade(s) avaliada(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-base text-indigo-600">{(Number(ptTotal) || 0).toFixed(1)} pts</p>
                    <p className="text-[11px] text-zinc-500">Média: {ptAvg}</p>
                  </div>
                </div>

                {/* Mathematics */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900">🔢 Matemática</h4>
                    <p className="text-xs text-zinc-500">{mathGrades.length} atividade(s) avaliada(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-base text-indigo-600">{(Number(mathTotal) || 0).toFixed(1)} pts</p>
                    <p className="text-[11px] text-zinc-500">Média: {mathAvg}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Best Activities */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Minhas Melhores Avaliações</span>
              </h3>

              <div className="space-y-2">
                {bestActivities.length > 0 ? (
                  bestActivities.map(grade => (
                    <div key={grade.entity_id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-zinc-900">{grade.grade_activity_name}</p>
                        <p className="text-[11px] text-zinc-400">{new Date(grade.grade_date).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <span className="font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                        {(Number(grade.grade_value) || 0).toFixed(1)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-400 py-3 text-center">Nenhuma nota registrada ainda.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Mural */}
      {activeTab === 'mural' && (
        <div className="space-y-6 animate-fade-in">
          {/* Student Post Box */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-zinc-200">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-indigo-600" />
              <span>Deixe uma mensagem ou dúvida no Mural</span>
            </h3>

            <form onSubmit={handleCreateStudentPost} className="space-y-3">
              <textarea
                rows={2}
                value={studentPostContent}
                onChange={e => setStudentPostContent(e.target.value)}
                placeholder="Compartilhe dúvidas ou comentários sobre as aulas com professores e colegas..."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-zinc-50/50 resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publicar Mensagem</span>
                </button>
              </div>
            </form>
          </div>

          {/* Mural Feed */}
          <div className="space-y-4">
            {data.posts
              .filter(p => !p.post_parent_id)
              .sort((a, b) => {
                if (a.post_is_pinned && !b.post_is_pinned) return -1;
                if (!a.post_is_pinned && b.post_is_pinned) return 1;
                return new Date(b.post_created_at).getTime() - new Date(a.post_created_at).getTime();
              })
              .map(post => {
                const replies = data.posts.filter(p => p.post_parent_id === post.entity_id);

                return (
                  <div
                    key={post.entity_id}
                    className={`p-5 rounded-2xl border transition ${
                      post.post_is_pinned
                        ? 'bg-amber-50/40 border-amber-200 shadow-xs'
                        : 'bg-white border-zinc-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          post.post_author_type === 'admin'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-zinc-100 text-zinc-800'
                        }`}>
                          {post.post_author_type === 'admin' ? 'ADM' : 'ALU'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-zinc-900">{post.post_author_name}</span>
                            {post.post_is_pinned && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                📌 Fixado
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400">
                            {new Date(post.post_created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed mb-3">
                      {post.post_content}
                    </p>

                    {post.post_image && (
                      <div className="mb-3">
                        <img
                          src={post.post_image}
                          alt="Anexo"
                          className="max-h-60 rounded-xl border border-zinc-200 object-contain bg-zinc-50"
                        />
                      </div>
                    )}

                    {sanitizeUrl(post.post_link) && (
                      <div className="mb-3 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs flex items-center gap-2">
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                        <a
                          href={sanitizeUrl(post.post_link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline font-semibold truncate"
                        >
                          {post.post_link}
                        </a>
                      </div>
                    )}

                    {/* Reply button */}
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setReplyPostId(replyPostId === post.entity_id ? null : post.entity_id);
                          setReplyContent('');
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Responder ({replies.length})</span>
                      </button>
                    </div>

                    {/* Reply input */}
                    {replyPostId === post.entity_id && (
                      <div className="mt-3 pt-3 border-t border-zinc-100 flex gap-2">
                        <input
                          type="text"
                          value={replyContent}
                          onChange={e => setReplyContent(e.target.value)}
                          placeholder="Escreva sua resposta..."
                          className="flex-1 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              handleSendReply(post.entity_id);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleSendReply(post.entity_id)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Enviar</span>
                        </button>
                      </div>
                    )}

                    {/* Nested Replies */}
                    {replies.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-indigo-200 space-y-2">
                        {replies.map(reply => (
                          <div key={reply.entity_id} className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-bold text-zinc-900">{reply.post_author_name}</span>
                              <span className="text-[10px] text-zinc-400">
                                {new Date(reply.post_created_at).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-zinc-700 whitespace-pre-wrap">{reply.post_content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tab 4: Academic Calendar */}
      {activeTab === 'calendar' && (
        <AcademicCalendar
          role="student"
          studentClassId={student.student_class_id}
          studentClassName={student.student_class_name}
        />
      )}

      {/* Activity Details Modal */}
      {selectedActivity && (
        <ActivityDetailsModal
          activity={selectedActivity}
          grade={studentGrades.find(g => g.grade_activity_id === selectedActivity.entity_id)}
          student={student}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  );
};
