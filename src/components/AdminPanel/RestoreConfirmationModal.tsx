import React from 'react';
import { RestorePoint } from '../../types';
import { useData } from '../../context/DataContext';
import { AlertTriangle, RotateCcw, ShieldCheck, X, Check, ArrowRight } from 'lucide-react';

interface RestoreConfirmationModalProps {
  point: RestorePoint | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const RestoreConfirmationModal: React.FC<RestoreConfirmationModalProps> = ({
  point,
  onClose,
  onConfirm
}) => {
  const { data, isRestoring } = useData();

  if (!point) return null;

  const currentSchools = data.schools?.length || 0;
  const currentClasses = data.classes?.length || 0;
  const currentStudents = data.students?.length || 0;
  const currentActivities = data.activities?.length || 0;
  const currentGrades = data.grades?.length || 0;

  const pointSchools = point.snapshot.schools?.length || 0;
  const pointClasses = point.snapshot.classes?.length || 0;
  const pointStudents = point.snapshot.students?.length || 0;
  const pointActivities = point.snapshot.activities?.length || 0;
  const pointGrades = point.snapshot.grades?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900">Restaurar Ponto do Sistema</h3>
              <p className="text-xs text-zinc-500">Retornar o estado da plataforma para este snapshot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRestoring}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Point Details */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900">
              {point.is_auto ? 'Autobackup em Background' : 'Ponto de Restauração Manual'}
            </span>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full">
              {new Date(point.timestamp).toLocaleString('pt-BR')}
            </span>
          </div>
          <p className="text-amber-950 font-medium">{point.trigger_reason}</p>
          <p className="text-amber-800 text-[11px]">
            Autor da alteração: <strong>{point.author_name}</strong> ({point.author_role === 'student' ? 'Aluno' : point.author_role === 'admin' ? 'Administrador' : 'Sistema'})
          </p>
        </div>

        {/* Comparison Overview */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Comparativo de Dados:</p>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
              <p className="text-[10px] text-zinc-500 font-medium">Escolas</p>
              <div className="flex items-center justify-center gap-1 mt-1 font-bold">
                <span className="text-zinc-600">{currentSchools}</span>
                <ArrowRight className="w-3 h-3 text-zinc-400" />
                <span className="text-indigo-600">{pointSchools}</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
              <p className="text-[10px] text-zinc-500 font-medium">Turmas</p>
              <div className="flex items-center justify-center gap-1 mt-1 font-bold">
                <span className="text-zinc-600">{currentClasses}</span>
                <ArrowRight className="w-3 h-3 text-zinc-400" />
                <span className="text-indigo-600">{pointClasses}</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
              <p className="text-[10px] text-zinc-500 font-medium">Alunos</p>
              <div className="flex items-center justify-center gap-1 mt-1 font-bold">
                <span className="text-zinc-600">{currentStudents}</span>
                <ArrowRight className="w-3 h-3 text-zinc-400" />
                <span className="text-indigo-600">{pointStudents}</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
              <p className="text-[10px] text-zinc-500 font-medium">Atividades</p>
              <div className="flex items-center justify-center gap-1 mt-1 font-bold">
                <span className="text-zinc-600">{currentActivities}</span>
                <ArrowRight className="w-3 h-3 text-zinc-400" />
                <span className="text-indigo-600">{pointActivities}</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
              <p className="text-[10px] text-zinc-500 font-medium">Notas</p>
              <div className="flex items-center justify-center gap-1 mt-1 font-bold">
                <span className="text-zinc-600">{currentGrades}</span>
                <ArrowRight className="w-3 h-3 text-zinc-400" />
                <span className="text-indigo-600">{pointGrades}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Guarantee */}
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Salvaguarda Automática:</strong> Antes de reverter o banco, o sistema gerará automaticamente um novo ponto de salvaguarda do estado atual, permitindo desfaçer a qualquer momento.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isRestoring}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isRestoring}
            className="py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 flex items-center gap-2 transition shadow-xs disabled:opacity-50"
          >
            {isRestoring ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Restaurando Dados...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirmar Restauração</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
