import React, { useState } from 'react';
import { Activity, Grade, Student } from '../../types';
import { useData } from '../../context/DataContext';
import { sanitizeUrl } from '../../utils/security';
import {
  X,
  Calendar,
  BookOpen,
  ExternalLink,
  Globe,
  Award,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Send,
  Link as LinkIcon,
  Clock,
  Edit3
} from 'lucide-react';

interface ActivityDetailsModalProps {
  activity: Activity;
  grade?: Grade;
  student?: Student;
  onClose: () => void;
}

export const ActivityDetailsModal: React.FC<ActivityDetailsModalProps> = ({
  activity,
  grade,
  student,
  onClose
}) => {
  const { submitStudentActivity } = useData();
  const dueDate = new Date(activity.activity_due_date);

  const isGraded = Boolean(grade && (grade.status === 'graded' || (grade.grade_value !== undefined && grade.grade_value > 0)));
  const isSubmitted = Boolean(grade && (grade.status === 'submitted' || grade.student_submission));
  const isOverdue = !isGraded && !isSubmitted && dueDate < new Date();

  const [isEditing, setIsEditing] = useState(!isSubmitted);
  const [submissionText, setSubmissionText] = useState(grade?.student_submission || '');
  const [submissionLink, setSubmissionLink] = useState(grade?.student_submission_link || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    if (!submissionText.trim() && !submissionLink.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await submitStudentActivity({
        activityId: activity.entity_id,
        studentId: student.entity_id,
        studentName: student.student_name,
        submissionText: submissionText.trim(),
        submissionLink: submissionLink.trim() || undefined
      });
      if (success) {
        setIsEditing(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl w-full max-w-xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {activity.activity_discipline}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                isGraded
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : isSubmitted
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : isOverdue
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}>
                {isGraded ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                ) : isSubmitted ? (
                  <Clock className="w-3 h-3 text-blue-600" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                {isGraded
                  ? 'Corrigida'
                  : isSubmitted
                  ? 'Entregue — Aguardando Nota'
                  : isOverdue
                  ? 'Prazo Expirado'
                  : 'Pendente'}
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-zinc-900 leading-snug">
              {activity.activity_name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
              <p className="text-zinc-500 font-semibold text-[10px] uppercase mb-1">Turma</p>
              <p className="font-bold text-zinc-900 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                {activity.activity_class_name}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
              <p className="text-zinc-500 font-semibold text-[10px] uppercase mb-1">Prazo de Entrega</p>
              <p className="font-bold text-zinc-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                {dueDate.toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Orientações & Descrição
            </h4>
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
              {activity.activity_description || 'Nenhuma descrição detalhada fornecida para esta atividade.'}
            </div>
          </div>

          {/* External Material */}
          {sanitizeUrl(activity.activity_link) && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Material de Estudo
              </h4>
              <a
                href={sanitizeUrl(activity.activity_link)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-indigo-950 text-xs font-semibold hover:bg-indigo-50 transition group"
              >
                <div className="flex items-center gap-2 truncate">
                  <ExternalLink className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span className="truncate">Acessar Material Complementar</span>
                </div>
                <span className="text-[11px] text-indigo-600 group-hover:underline">Abrir link →</span>
              </a>
            </div>
          )}

          {/* Embedded URL Page */}
          {sanitizeUrl(activity.activity_embed_url) && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Página da Atividade
              </h4>
              <a
                href={sanitizeUrl(activity.activity_embed_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-semibold hover:bg-zinc-100 transition group"
              >
                <div className="flex items-center gap-2 truncate">
                  <Globe className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span className="truncate">Abrir Página Incorporada</span>
                </div>
                <span className="text-[11px] text-indigo-600 group-hover:underline">Acessar →</span>
              </a>
            </div>
          )}

          {/* Grade & Feedback Section if available */}
          {isGraded && grade && (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Sua Avaliação
                </span>
                <span className="text-2xl font-black text-emerald-900 bg-white px-3 py-1 rounded-xl shadow-xs border border-emerald-200">
                  {grade.grade_value.toFixed(1)} / 10
                </span>
              </div>

              {grade.grade_feedback && (
                <div className="mt-2 pt-2 border-t border-emerald-200/60 text-xs text-emerald-950 flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Feedback do Professor:</span>
                    <p className="mt-0.5 italic text-zinc-800">"{grade.grade_feedback}"</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Student Submission View & Form */}
          {student && (
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Entrega da Atividade</span>
                </h4>
                {isSubmitted && !isGraded && !isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Editar entrega</span>
                  </button>
                )}
              </div>

              {isSubmitted && !isEditing ? (
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-zinc-200 text-zinc-800">
                    <p className="font-bold text-[11px] text-zinc-500 mb-1">
                      Sua Resposta / Resolução:
                    </p>
                    <p className="whitespace-pre-wrap">{grade?.student_submission || 'Nenhum texto anexado.'}</p>
                  </div>

                  {sanitizeUrl(grade?.student_submission_link) && (
                    <div className="p-3 bg-white rounded-xl border border-zinc-200 flex items-center justify-between">
                      <span className="truncate text-zinc-600 flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                        <span className="truncate">{grade.student_submission_link}</span>
                      </span>
                      <a
                        href={sanitizeUrl(grade.student_submission_link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline font-bold flex-shrink-0 ml-2"
                      >
                        Abrir link →
                      </a>
                    </div>
                  )}

                  {grade?.student_submitted_at && (
                    <p className="text-[11px] text-zinc-400">
                      Entregue em: {new Date(grade.student_submitted_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              ) : !isGraded ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Sua Resposta / Resumo da Resolução
                    </label>
                    <textarea
                      rows={3}
                      value={submissionText}
                      onChange={e => setSubmissionText(e.target.value)}
                      placeholder="Escreva aqui a resposta da atividade ou anote os pontos principais..."
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Link da Entrega (Google Drive, Docs, GitHub, etc. — opcional)
                    </label>
                    <div className="relative">
                      <LinkIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type="url"
                        value={submissionLink}
                        onChange={e => setSubmissionLink(e.target.value)}
                        placeholder="https://..."
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {isSubmitted && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-200 transition"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting || (!submissionText.trim() && !submissionLink.trim())}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Enviando...' : isSubmitted ? 'Atualizar Entrega' : 'Enviar Atividade'}</span>
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
