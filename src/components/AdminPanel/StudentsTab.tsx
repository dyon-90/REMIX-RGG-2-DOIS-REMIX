import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Trash2, Users, Key, Mail, BookOpen, X, Award, Sparkles } from 'lucide-react';

interface StudentsTabProps {
  highlightId?: string;
  onClearHighlight?: () => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({ highlightId, onClearHighlight }) => {
  const { data, addStudent, deleteStudent, showToast, isUserOnline } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [classId, setClassId] = useState('');
  const [password, setPassword] = useState('');

  const handleOpenModal = () => {
    if (data.classes.length === 0) {
      showToast('Cadastre ao menos uma turma antes de adicionar alunos.', 'error');
      return;
    }
    setClassId(data.classes[0].entity_id);
    setPassword('123456');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !login.trim() || !classId || !password.trim()) return;

    const cls = data.classes.find(c => c.entity_id === classId);
    if (!cls) return;

    addStudent({
      student_name: name.trim(),
      student_email: login.trim().toLowerCase(),
      student_class_id: classId,
      student_class_name: cls.class_name,
      student_matricula: password.trim()
    });

    setName('');
    setLogin('');
    setPassword('123456');
    setIsModalOpen(false);
  };

  const highlightedStudent = highlightId ? (data.students || []).find(s => s.entity_id === highlightId) : null;
  const studentsList = [...(data.students || [])].sort((a, b) => {
    if (highlightId) {
      if (a.entity_id === highlightId) return -1;
      if (b.entity_id === highlightId) return 1;
    }
    return 0;
  });

  return (
    <div className="bg-white dark:bg-[#141026] rounded-2xl shadow-xs border border-zinc-200 dark:border-purple-900/40 overflow-hidden animate-fade-in transition-colors">
      <div className="p-4 sm:p-6 border-b border-zinc-100 dark:border-purple-900/30 flex items-center justify-between bg-zinc-50/70 dark:bg-[#181330]">
        <div>
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Gerenciar Alunos</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Cadastre os estudantes com suas credenciais de login e turma
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Aluno</span>
        </button>
      </div>

      {highlightedStudent && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse flex-shrink-0" />
            <span className="text-xs font-semibold text-purple-900 dark:text-purple-200">
              Exibindo em destaque: <strong>{highlightedStudent.student_name}</strong> (ID: <span className="font-mono text-[11px]">{highlightedStudent.entity_id}</span>)
            </span>
          </div>
          {onClearHighlight && (
            <button
              onClick={onClearHighlight}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white dark:bg-[#201942] border border-purple-200 dark:border-purple-800/40 text-purple-800 dark:text-purple-300 hover:bg-purple-100 transition shadow-2xs cursor-pointer"
            >
              Limpar destaque
            </button>
          )}
        </div>
      )}

      <div className="p-4 sm:p-6">
        {(data.students || []).length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentsList.map(student => {
              const isTarget = student.entity_id === highlightId;
              const studentGrades = (data.grades || []).filter(g => g.grade_student_id === student.entity_id);
              const totalPoints = studentGrades.reduce((sum, g) => sum + (Number(g.grade_value) || 0), 0);
              const avg = studentGrades.length > 0 && !isNaN(totalPoints) ? (totalPoints / studentGrades.length).toFixed(1) : '—';

              return (
                <div
                  key={student.entity_id}
                  className={`p-4 rounded-xl transition relative flex flex-col justify-between ${
                    isTarget
                      ? 'bg-purple-50/60 dark:bg-[#1e173b] border-2 border-[#6f2ef7] shadow-lg ring-4 ring-purple-500/20'
                      : 'bg-white dark:bg-[#181330] border border-zinc-200 dark:border-purple-900/40 hover:border-zinc-300 dark:hover:border-purple-700/60 shadow-xs'
                  }`}
                >
                  <div>
                    {isTarget && (
                      <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" />
                        Aluno Selecionado
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-tight">
                          {student.student_name}
                        </h4>
                        {isUserOnline(student.entity_id) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-[#201942] border border-zinc-200 dark:border-purple-900/40 text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        {student.student_class_name}
                      </span>
                    </div>
                    
                    <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300 mb-3 bg-zinc-50/80 dark:bg-[#141026] p-2.5 rounded-xl border border-zinc-100 dark:border-purple-900/30">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                        <span>Login: <strong className="text-zinc-900 dark:text-zinc-100">{student.student_email}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                        <span>Senha: <strong className="text-zinc-900 dark:text-zinc-100">{student.student_matricula}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2 px-1">
                      <span>Notas: {studentGrades.length}</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        Média: {avg}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-purple-900/30 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 dark:text-zinc-500 text-[11px] font-mono">
                      ID: #{student.entity_id.slice(-6)}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja remover o aluno "${student.student_name}"?`)) {
                          deleteStudent(student.entity_id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Remover Aluno"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-400 dark:text-zinc-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-zinc-400 dark:text-zinc-500" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Nenhum aluno cadastrado ainda.</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Clique em "Novo Aluno" para adicionar.</p>
          </div>
        )}
      </div>

      {/* Modal Novo Aluno */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md border border-zinc-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100">
              <h2 className="font-display text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Novo Aluno</span>
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
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (!login) {
                      const clean = e.target.value.toLowerCase().trim().replace(/\s+/g, '.');
                      setLogin(clean);
                    }
                  }}
                  placeholder="Ex: Maria Clara Silva"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Turma *
                </label>
                <select
                  required
                  value={classId}
                  onChange={e => setClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white text-zinc-900"
                >
                  {data.classes.map(c => (
                    <option key={c.entity_id} value={c.entity_id}>
                      {c.class_name} — {c.class_school_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Login de Acesso *
                </label>
                <input
                  type="text"
                  required
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  placeholder="Ex: maria.silva"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Senha / Matrícula *
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Ex: 123456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white text-zinc-900 placeholder:text-zinc-400"
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
                  Salvar Aluno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
