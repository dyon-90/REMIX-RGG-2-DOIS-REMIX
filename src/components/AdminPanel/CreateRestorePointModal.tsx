import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { BookmarkPlus, ShieldCheck, X, Check } from 'lucide-react';

interface CreateRestorePointModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRestorePointModal: React.FC<CreateRestorePointModalProps> = ({
  isOpen,
  onClose
}) => {
  const { createManualRestorePoint } = useData();
  const [label, setLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const success = await createManualRestorePoint(label.trim());
      if (success) {
        setLabel('');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-5">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900">Novo Ponto de Restauração</h3>
              <p className="text-xs text-zinc-500">Gere um snapshot manual do estado atual do sistema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Identificação do Ponto de Restauração (Opcional)
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ex: Antes do fechamento do 1º Bimestre"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Se deixar em branco, o sistema utilizará a data e hora atual como título.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>O snapshot incluirá escolas, turmas, alunos, notas, mural, calendário e arquivos.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 transition shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Salvando Snapshot...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Criar Ponto de Restauração</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
