import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Trash2, Edit3, CheckSquare, Calendar, ExternalLink, Globe, BookOpen, X, Sparkles } from 'lucide-react';
import { Activity } from '../../types';

interface ActivitiesTabProps {
  highlightId?: string;
  onClearHighlight?: () => void;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({ highlightId, onClearHighlight }) => {
  const { data, addActivity, updateActivity, deleteActivity, showToast } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');
  const [discipline, setDiscipline] = useState('Português');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');

  const handleOpenAddModal = () => {
    if (data.classes.length === 0) {
      showToast('Cadastre ao menos uma turma antes de criar atividades.', 'error');
      return;
    }
    setEditingActivity(null);
    setName('');
    setClassId(data.classes[0].entity_id);
    setDiscipline('Português');
    setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setDescription('');
    setLink('');
    setEmbedUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (activity: Activity) => {
    setEditingActivity(activity);
    setName(activity.activity_name);
    setClassId(activity.activity_class_id);
    setDiscipline(activity.activity_discipline);
    setDueDate(activity.activity_due_date);
    setDescription(activity.activity_description || '');
    setLink(activity.activity_link || '');
    setEmbedUrl(activity.activity_embed_url || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !classId || !discipline.trim() || !dueDate) return;

    const cls = data.classes.find(c => c.entity_id === classId);
    if (!cls) return;

    if (editingActivity) {
      updateActivity({
        ...editingActivity,
        activity_name: name.trim(),
        activity_class_id: classId,
        activity_class_name: cls.class_name,
        activity_discipline: discipline.trim(),
        activity_due_date: dueDate,
        activity_description: description.trim() || undefined,
        activity_link: link.trim() || undefined,
        activity_embed_url: embedUrl.trim() || undefined
      });
    } else {
      addActivity({
        activity_name: name.trim(),
        activity_class_id: classId,
        activity_class_name: cls.class_name,
        activity_discipline: discipline.trim(),
        activity_due_date: dueDate,
        activity_description: description.trim() || undefined,
        activity_link: link.trim() || undefined,
        activity_embed_url: embedUrl.trim() || undefined
      });
    }

    setIsModalOpen(false);
  };

  const highlightedActivity = highlightId ? (data.activities || []).find(a => a.entity_id === highlightId) : null;
  const activitiesList = [...(data.activities || [])].sort((a, b) => {
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
            <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Gerenciar Atividades</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Crie tarefas, trabalhos escolares e disponibilize links de estudo
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Atividade</span>
        </button>
      </div>

      {highlightedActivity && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
              Exibindo em destaque: <strong>{highlightedActivity.activity_name}</strong> (ID: <span className="font-mono text-[11px]">{highlightedActivity.entity_id}</span>)
            </span>
          </div>
          {onClearHighlight && (
            <button
              onClick={onClearHighlight}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white dark:bg-[#201942] border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
            >
              Limpar destaque
            </button>
          )}
        </div>
      )}

      <div className="p-4 sm:p-6">
        {activitiesList.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activitiesList.map(activity => {
              const isTarget = activity.entity_id === highlightId;
              const gradesCount = (data.grades || []).filter(g => g.grade_activity_id === activity.entity_id).length;
              return (
                <div
                  key={activity.entity_id}
                  className={`p-4 rounded-xl transition relative flex flex-col justify-between ${
                    isTarget
                      ? 'bg-emerald-50/60 dark:bg-[#132822] border-2 border-emerald-500 shadow-lg ring-4 ring-emerald-500/20'
                      : 'bg-white dark:bg-[#181330] border border-zinc-200 dark:border-purple-900/40 hover:border-zinc-300 dark:hover:border-purple-700/60 shadow-xs'
                  }`}
                >
                  <div>
                    {isTarget && (
                      <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" />
                        Atividade Selecionada
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-tight">
                        {activity.activity_name}
                      </h4>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300">
                        {activity.activity_discipline}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-[#201942] border border-zinc-200 dark:border-purple-900/40 text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        {activity.activity_class_name}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300 mb-3 bg-zinc-50/80 dark:bg-[#141026] p-2.5 rounded-xl border border-zinc-100 dark:border-purple-900/30">
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        <span>Prazo: <strong className="text-zinc-900 dark:text-zinc-100">{new Date(activity.activity_due_date).toLocaleDateString('pt-BR')}</strong></span>
                      </div>

                      {activity.activity_description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                          {activity.activity_description}
                        </p>
                      )}

                      {activity.activity_link && (
                        <a
                          href={activity.activity_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Material de apoio</span>
                        </a>
                      )}

                      {activity.activity_embed_url && (
                        <div className="flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                          <Globe className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span>Página web incorporada</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-purple-900/30 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">
                      {gradesCount} nota(s) lançada(s)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(activity)}
                        className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-zinc-100 dark:hover:bg-purple-900/40 transition cursor-pointer"
                        title="Editar Atividade"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja remover a atividade "${activity.activity_name}"?`)) {
                            deleteActivity(activity.entity_id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Remover Atividade"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-400 dark:text-zinc-500">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-zinc-400 dark:text-zinc-500" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Nenhuma atividade cadastrada ainda.</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Clique em "Nova Atividade" para adicionar.</p>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Activity */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-lg border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100">
              <h2 className="font-display text-lg font-bold text-zinc-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                <span>{editingActivity ? 'Editar Atividade' : 'Nova Atividade'}</span>
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
                  Título da Atividade *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Interpretação Textual: Crônicas Urbanas"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
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
                        {c.class_name} ({c.class_school_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Disciplina *
                  </label>
                  <select
                    required
                    value={discipline}
                    onChange={e => setDiscipline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white text-zinc-900"
                  >
                    <option value="Português">Português</option>
                    <option value="Matemática">Matemática</option>
                    <option value="História">História</option>
                    <option value="Geografia">Geografia</option>
                    <option value="Ciências">Ciências</option>
                    <option value="Inglês">Inglês</option>
                    <option value="Artes">Artes</option>
                    <option value="Educação Física">Educação Física</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Prazo de Entrega *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Descrição e Orientações (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Instruções para os alunos realizarem a atividade..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white text-zinc-900 placeholder:text-zinc-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Link de Material de Apoio (Opcional)
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white text-zinc-900 placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  URL de Página Web para Incorporar (Opcional)
                </label>
                <input
                  type="url"
                  value={embedUrl}
                  onChange={e => setEmbedUrl(e.target.value)}
                  placeholder="https://..."
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
                  {editingActivity ? 'Atualizar Atividade' : 'Salvar Atividade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
