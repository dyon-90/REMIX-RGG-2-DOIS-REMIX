import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Trash2, Edit, Award, User, CheckSquare, MessageSquare, X } from 'lucide-react';

export const GradesTab: React.FC = () => {
  const { data, addGrade, deleteGrade, showToast } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [activityId, setActivityId] = useState('');
  const [gradeValue, setGradeValue] = useState<string>('10.0');
  const [feedback, setFeedback] = useState('');

  const handleOpenModal = () => {
    if (data.students.length === 0 || data.activities.length === 0) {
      showToast('Cadastre ao menos um aluno e uma atividade antes de lançar notas.', 'error');
      return;
    }
    setStudentId(data.students[0].entity_id);
    setActivityId(data.activities[0].entity_id);
    setGradeValue('10.0');
    setFeedback('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(gradeValue);
    if (isNaN(val) || val < 0 || val > 10 || !studentId || !activityId) {
      showToast('Informe uma nota válida entre 0 e 10.', 'error');
      return;
    }

    const student = data.students.find(s => s.entity_id === studentId);
    const activity = data.activities.find(a => a.entity_id === activityId);
    if (!student || !activity) return;

    addGrade({
      grade_student_id: studentId,
      grade_student_name: student.student_name,
      grade_activity_id: activityId,
      grade_activity_name: activity.activity_name,
      grade_value: val,
      grade_feedback: feedback.trim() || undefined,
      grade_date: new Date().toISOString()
    });

    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-zinc-200 overflow-hidden animate-fade-in">
      <div className="p-4 sm:p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
        <div>
          <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <span>Atribuir e Gerenciar Notas</span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Lance avaliações individuais e envie feedbacks aos alunos
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Lançar Nota</span>
        </button>
      </div>

      <div className="p-4 sm:p-6">
        {(data.grades || []).length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data.grades || []).map(grade => {
              const numericValue = typeof grade.grade_value === 'number' && !isNaN(grade.grade_value)
                ? grade.grade_value
                : (!isNaN(Number(grade.grade_value)) && grade.grade_value !== null && grade.grade_value !== '' ? Number(grade.grade_value) : 0);
              const studentName = grade.grade_student_name || 'Aluno';
              const activityName = grade.grade_activity_name || 'Atividade';
              const formattedDate = grade.grade_date ? new Date(grade.grade_date).toLocaleDateString('pt-BR') : 'Data não informada';

              return (
                <div
                  key={grade.entity_id}
                  className="p-4 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 shadow-xs transition relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-indigo-600" />
                          <span>{studentName}</span>
                        </h4>
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 flex items-center gap-1">
                          <CheckSquare className="w-3 h-3 text-zinc-400" />
                          {activityName}
                        </p>
                      </div>

                      <div className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-base flex items-center justify-center">
                        {numericValue.toFixed(1)}
                      </div>
                    </div>

                    {grade.grade_feedback && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs text-zinc-600 flex items-start gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <span className="italic">"{grade.grade_feedback}"</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 text-[11px]">
                      Lançada em {formattedDate}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja remover a nota de ${studentName}?`)) {
                          deleteGrade(grade.entity_id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                      title="Remover Nota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-400">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-30 text-zinc-400" />
            <p className="text-sm font-medium text-zinc-600">Nenhuma nota lançada ainda.</p>
            <p className="text-xs text-zinc-400 mt-1">Clique em "Lançar Nota" para avaliar um aluno.</p>
          </div>
        )}
      </div>

      {/* Modal Lançar Nota */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md border border-zinc-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100">
              <h2 className="font-display text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <span>Atribuir Nota</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Aluno *
                </label>
                <select
                  required
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white text-zinc-900"
                >
                  {data.students.map(st => (
                    <option key={st.entity_id} value={st.entity_id}>
                      {st.student_name} ({st.student_class_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Atividade *
                </label>
                <select
                  required
                  value={activityId}
                  onChange={e => setActivityId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white text-zinc-900"
                >
                  {data.activities.map(act => (
                    <option key={act.entity_id} value={act.entity_id}>
                      {act.activity_name} ({act.activity_class_name} - {act.activity_discipline})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Nota (0.0 a 10.0) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  value={gradeValue}
                  onChange={e => setGradeValue(e.target.value)}
                  placeholder="Ex: 9.5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white text-zinc-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Feedback / Observação do Professor (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Ex: Excelente argumentação e coerência!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white text-zinc-900 placeholder:text-zinc-400 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
                >
                  Salvar Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
