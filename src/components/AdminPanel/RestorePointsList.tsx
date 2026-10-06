import React, { useState } from 'react';
import { RestorePoint } from '../../types';
import { useData } from '../../context/DataContext';
import { RestoreConfirmationModal } from './RestoreConfirmationModal';
import { CreateRestorePointModal } from './CreateRestorePointModal';
import {
  RotateCcw,
  BookmarkPlus,
  Download,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  User,
  GraduationCap,
  Shield,
  Sparkles,
  Layers
} from 'lucide-react';

export const RestorePointsList: React.FC = () => {
  const { restorePoints, restoreFromPoint, deleteRestorePointItem, lastAutoBackupLoaded } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'auto' | 'manual'>('all');
  const [selectedPointToRestore, setSelectedPointToRestore] = useState<RestorePoint | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Download specific snapshot as JSON
  const handleDownloadSnapshot = (point: RestorePoint) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(point.snapshot, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    const dateFormatted = new Date(point.timestamp).toISOString().replace(/[:.]/g, '-');
    downloadAnchor.setAttribute('download', `snapshot_${point.entity_id}_${dateFormatted}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleConfirmRestore = async () => {
    if (!selectedPointToRestore) return;
    const success = await restoreFromPoint(selectedPointToRestore);
    if (success) {
      setSelectedPointToRestore(null);
    }
  };

  const filteredPoints = restorePoints.filter(point => {
    if (filterType === 'auto' && !point.is_auto) return false;
    if (filterType === 'manual' && point.is_auto) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      point.trigger_reason.toLowerCase().includes(term) ||
      point.author_name.toLowerCase().includes(term) ||
      (point.label && point.label.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-indigo-600" />
            <span>Pontos de Restauração & Autobackups</span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Histórico contínuo de snapshots gravados automaticamente a cada alteração feita por alunos ou administradores.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2 transition shadow-xs flex-shrink-0"
        >
          <BookmarkPlus className="w-4 h-4" />
          <span>Criar Ponto Manual</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por motivo da alteração, autor ou rótulo..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 self-start sm:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'all'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'hover:text-zinc-900'
            }`}
          >
            Todos ({restorePoints.length})
          </button>
          <button
            onClick={() => setFilterType('auto')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'auto'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'hover:text-zinc-900'
            }`}
          >
            Automáticos ({restorePoints.filter(p => p.is_auto).length})
          </button>
          <button
            onClick={() => setFilterType('manual')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'manual'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'hover:text-zinc-900'
            }`}
          >
            Manuais ({restorePoints.filter(p => !p.is_auto).length})
          </button>
        </div>
      </div>

      {/* List of Points */}
      {filteredPoints.length === 0 ? (
        <div className="p-10 rounded-2xl bg-zinc-50 border border-dashed border-zinc-300 text-center space-y-2">
          <Clock className="w-8 h-8 mx-auto text-zinc-400" />
          <p className="text-xs font-bold text-zinc-700">Nenhum ponto de restauração encontrado</p>
          <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
            Assim que qualquer aluno ou administrador adicionar, editar ou excluir qualquer dado na plataforma, um snapshot automático será salvo aqui em segundo plano.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPoints.map(point => {
            const isLastLoaded = lastAutoBackupLoaded?.entity_id === point.entity_id;
            const dateObj = new Date(point.timestamp);
            const dateFormatted = dateObj.toLocaleDateString('pt-BR');
            const timeFormatted = dateObj.toLocaleTimeString('pt-BR');

            return (
              <div
                key={point.entity_id}
                className={`p-4 rounded-2xl border transition bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                  isLastLoaded ? 'border-emerald-300 ring-2 ring-emerald-500/10' : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {/* Information */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Badge Auto / Manual */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        point.is_auto
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {point.is_auto ? (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>Autobackup Background</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-3 h-3" />
                          <span>Ponto Manual</span>
                        </>
                      )}
                    </span>

                    {/* Badge Last Loaded */}
                    {isLastLoaded && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Carregado no Início</span>
                      </span>
                    )}

                    {/* Timestamp */}
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{dateFormatted} às {timeFormatted}</span>
                    </span>
                  </div>

                  {/* Trigger Reason */}
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 truncate">
                      {point.trigger_reason}
                    </h4>
                    <p className="text-[11px] text-zinc-600 flex items-center gap-1 mt-0.5">
                      {point.author_role === 'student' ? (
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                      ) : (
                        <Shield className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      )}
                      <span>
                        Alterado por <strong>{point.author_name}</strong> ({point.author_role === 'student' ? 'Aluno' : point.author_role === 'admin' ? 'Administrador' : 'Sistema'})
                      </span>
                    </p>
                  </div>

                  {/* Metrics Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-zinc-600 font-medium">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200">
                      {point.metrics?.schoolsCount || 0} Escolas
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200">
                      {point.metrics?.classesCount || 0} Turmas
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200">
                      {point.metrics?.studentsCount || 0} Alunos
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200">
                      {point.metrics?.activitiesCount || 0} Atividades
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200">
                      {point.metrics?.gradesCount || 0} Notas
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200">
                      {point.metrics?.postsCount || 0} Mural
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                  <button
                    onClick={() => handleDownloadSnapshot(point)}
                    className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition text-xs font-semibold flex items-center gap-1"
                    title="Baixar snapshot JSON deste ponto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">JSON</span>
                  </button>

                  <button
                    onClick={() => setSelectedPointToRestore(point)}
                    className="py-2 px-3 rounded-xl text-white bg-amber-600 hover:bg-amber-700 transition text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    title="Restaurar sistema para o estado deste snapshot"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Deseja remover o ponto de restauração "${point.trigger_reason}"?`)) {
                        deleteRestorePointItem(point.entity_id);
                      }
                    }}
                    className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Excluir ponto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedPointToRestore && (
        <RestoreConfirmationModal
          point={selectedPointToRestore}
          onClose={() => setSelectedPointToRestore(null)}
          onConfirm={handleConfirmRestore}
        />
      )}

      {/* Create Manual Restore Point Modal */}
      <CreateRestorePointModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
