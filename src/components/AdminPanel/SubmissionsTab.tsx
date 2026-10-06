import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Grade } from '../../types';
import { sanitizeUrl } from '../../utils/security';
import {
  Send,
  Search,
  Filter,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  X,
  Check
} from 'lucide-react';

export const SubmissionsTab: React.FC = () => {
  const { data, evaluateSubmission } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'graded'>('all');
  
  // Evaluation Modal State
  const [evaluatingGrade, setEvaluatingGrade] = useState<Grade | null>(null);
  const [evalValue, setEvalValue] = useState<string>('');
  const [evalFeedback, setEvalFeedback] = useState<string>('');
  const [isSavingEval, setIsSavingEval] = useState<boolean>(false);

  const openEvaluationModal = (grade: Grade) => {
    setEvaluatingGrade(grade);
    setEvalValue(grade.grade_value !== undefined ? String(grade.grade_value) : '');
    setEvalFeedback(grade.grade_feedback || '');
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingGrade) return;

    const numVal = parseFloat(evalValue);
    if (isNaN(numVal) || numVal < 0 || numVal > 10) {
      alert('Por favor, informe uma nota válida entre 0 e 10.');
      return;
    }

    setIsSavingEval(true);
    try {
      const ok = await evaluateSubmission({
        gradeId: evaluatingGrade.entity_id,
        gradeValue: numVal,
        feedback: evalFeedback
      });
      if (ok) {
        setEvaluatingGrade(null);
      }
    } finally {
      setIsSavingEval(false);
    }
  };

  const filteredGrades = (data.grades || []).filter(g => {
    const studentName = (g.grade_student_name || '').toLowerCase();
    const activityName = (g.grade_activity_name || '').toLowerCase();
    const term = (searchTerm || '').trim().toLowerCase();

    const matchesSearch = !term || studentName.includes(term) || activityName.includes(term);

    const act = (data.activities || []).find(a => a.entity_id === g.grade_activity_id);
    const matchesDiscipline = filterDiscipline === 'all' || (act && act.activity_discipline === filterDiscipline);

    const isPending = g.status === 'submitted' || (!g.grade_value && Boolean(g.student_submission));
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'pending'
        ? isPending
        : !isPending;

    return matchesSearch && matchesDiscipline && matchesStatus;
  });

  const disciplines = Array.from(new Set((data.activities || []).map(a => a.activity_discipline).filter(Boolean)));
  const pendingCount = (data.grades || []).filter(g => g.status === 'submitted' || (!g.grade_value && Boolean(g.student_submission))).length;

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-zinc-200 overflow-hidden animate-fade-in">
      <div className="p-4 sm:p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/70">
        <div>
          <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-600" />
            <span>Entregas de Atividades & Avaliações</span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Sincronizado em tempo real: veja entregas enviadas pelos alunos e atribua notas instantaneamente
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status quick tabs */}
          <div className="flex bg-zinc-200/80 p-0.5 rounded-xl text-xs font-semibold text-zinc-700">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filterStatus === 'all' ? 'bg-white text-zinc-900 shadow-xs' : 'hover:text-zinc-900'
              }`}
            >
              Todas ({(data.grades || []).length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                filterStatus === 'pending' ? 'bg-white text-amber-900 shadow-xs' : 'hover:text-zinc-900'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Aguardando Nota ({pendingCount})</span>
            </button>
            <button
              onClick={() => setFilterStatus('graded')}
              className={`px-3 py-1 rounded-lg transition ${
                filterStatus === 'graded' ? 'bg-white text-emerald-900 shadow-xs' : 'hover:text-zinc-900'
              }`}
            >
              Avaliadas
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar aluno ou atividade..."
              className="pl-9 pr-3 py-1.5 rounded-xl border border-zinc-200 text-xs bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 w-44 sm:w-56"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={filterDiscipline}
              onChange={e => setFilterDiscipline(e.target.value)}
              className="text-xs text-zinc-700 bg-transparent focus:outline-none"
            >
              <option value="all">Todas Disciplinas</option>
              {disciplines.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-900 text-zinc-300 border-b border-zinc-800">
              <th className="p-3.5 font-semibold">Aluno</th>
              <th className="p-3.5 font-semibold">Atividade</th>
              <th className="p-3.5 font-semibold text-center">Status</th>
              <th className="p-3.5 font-semibold text-center">Data / Envio</th>
              <th className="p-3.5 font-semibold text-center">Nota Atribuída</th>
              <th className="p-3.5 font-semibold">Resolução & Feedback</th>
              <th className="p-3.5 font-semibold text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-700">
            {filteredGrades.length > 0 ? (
              filteredGrades.map(grade => {
                const act = data.activities.find(a => a.entity_id === grade.grade_activity_id);
                const student = data.students.find(s => s.entity_id === grade.grade_student_id);
                const isPending = grade.status === 'submitted' || (!grade.grade_value && Boolean(grade.student_submission));

                return (
                  <tr key={grade.entity_id} className="hover:bg-zinc-50 transition">
                    <td className="p-3.5 font-medium text-zinc-900">
                      <div>{grade.grade_student_name}</div>
                      <div className="text-[11px] text-zinc-400">
                        {student ? student.student_class_name : 'Turma'}
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-zinc-800">
                      <div>{grade.grade_activity_name}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700">
                        {act ? act.activity_discipline : 'Geral'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        isPending
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {isPending ? <Clock className="w-3 h-3 text-amber-500" /> : <Check className="w-3 h-3 text-emerald-600" />}
                        {isPending ? 'Aguardando Nota' : 'Avaliada'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center text-zinc-500">
                      {grade.student_submitted_at
                        ? new Date(grade.student_submitted_at).toLocaleDateString('pt-BR')
                        : grade.grade_date
                        ? new Date(grade.grade_date).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="p-3.5 text-center">
                      {isPending ? (
                        <span className="text-zinc-400 font-medium">—</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-sm text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          {(Number(grade.grade_value) || 0).toFixed(1)}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-zinc-600 max-w-xs">
                      {grade.student_submission && (
                        <div className="line-clamp-2 text-[11px] bg-zinc-50 p-1.5 rounded-md border border-zinc-200/80 mb-1">
                          <span className="font-semibold text-zinc-700">Resposta: </span>
                          {grade.student_submission}
                        </div>
                      )}
                      {sanitizeUrl(grade.student_submission_link) && (
                        <a
                          href={sanitizeUrl(grade.student_submission_link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline font-semibold"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Abrir Anexo do Aluno</span>
                        </a>
                      )}
                      {grade.grade_feedback && (
                        <div className="text-[11px] text-emerald-800 italic mt-0.5 line-clamp-1">
                          Prof: "{grade.grade_feedback}"
                        </div>
                      )}
                      {!grade.student_submission && !grade.grade_feedback && !grade.student_submission_link && (
                        <span className="text-zinc-400 italic text-[11px]">Nenhum comentário</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => openEvaluationModal(grade)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                          isPending
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                        }`}
                      >
                        {isPending ? 'Avaliar Entrega' : 'Editar Nota'}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-12 text-zinc-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30 text-zinc-400" />
                  <p className="text-sm">Nenhum registro de entrega encontrado.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Evaluation Modal */}
      {evaluatingGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl w-full max-w-lg border border-zinc-200">
            <div className="flex items-start justify-between pb-3 mb-4 border-b border-zinc-100">
              <div>
                <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>Avaliar Entrega do Aluno</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Aluno: <strong className="text-zinc-800">{evaluatingGrade.grade_student_name}</strong> • Atividade: <strong className="text-zinc-800">{evaluatingGrade.grade_activity_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setEvaluatingGrade(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student's Submission Preview */}
            {(evaluatingGrade.student_submission || evaluatingGrade.student_submission_link) && (
              <div className="p-3.5 mb-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                <p className="font-bold text-zinc-700">Entrega do Aluno:</p>
                {evaluatingGrade.student_submission && (
                  <p className="text-zinc-800 whitespace-pre-wrap bg-white p-2.5 rounded-lg border border-zinc-200">
                    {evaluatingGrade.student_submission}
                  </p>
                )}
                {sanitizeUrl(evaluatingGrade.student_submission_link) && (
                  <a
                    href={sanitizeUrl(evaluatingGrade.student_submission_link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-indigo-600 hover:underline font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Acessar Link Enviado pelo Aluno</span>
                  </a>
                )}
              </div>
            )}

            <form onSubmit={handleSaveEvaluation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nota Atribuída (0 a 10) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  value={evalValue}
                  onChange={e => setEvalValue(e.target.value)}
                  placeholder="Ex: 8.5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Feedback / Comentários para o Aluno</span>
                </label>
                <textarea
                  rows={3}
                  value={evalFeedback}
                  onChange={e => setEvalFeedback(e.target.value)}
                  placeholder="Excelente raciocínio na resolução! Continue assim..."
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEvaluatingGrade(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEval || !evalValue}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingEval ? 'Salvando na Nuvem...' : 'Salvar Avaliação'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
