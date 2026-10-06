import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Database,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Server,
  ShieldCheck,
  RotateCcw,
  ListFilter,
  Sparkles,
  Clock,
  HardDrive
} from 'lucide-react';
import { RestorePointsList } from './RestorePointsList';
import { SystemAuditLogs } from './SystemAuditLogs';
import { DatabaseStatusModal } from '../Modals/DatabaseStatusModal';

export const BackupTab: React.FC = () => {
  const {
    data,
    exportJSON,
    exportCSV,
    exportPDF,
    importJSON,
    clearAllData,
    showToast,
    lastAutoBackupLoaded,
    restorePoints,
    systemLogs,
    purgeLocalStorageData
  } = useData();
  const [activeSubTab, setActiveSubTab] = useState<'restore_points' | 'audit_logs' | 'manual_export_import'>('restore_points');
  const [dragActive, setDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showDbModal, setShowDbModal] = useState(false);
  const [confirmClearProduction, setConfirmClearProduction] = useState(false);
  const [lastPurgeCount, setLastPurgeCount] = useState<number | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      showToast('Por favor, selecione um arquivo válido no formato .json', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const res = await importJSON(content);
      setImportStatus(res);
      setTimeout(() => setImportStatus(null), 6000);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Real-Time Continuous Autobackup Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-5 text-white shadow-sm border border-indigo-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Autobackup Ativo em Segundo Plano
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Snapshot a cada Inserção / Edição / Exclusão
              </span>
            </div>
            <p className="text-xs text-indigo-100/90 leading-relaxed max-w-2xl mt-1">
              O sistema monitora e gera instantaneamente snapshots e logs cronológicos para ações de <strong>alunos e administradores</strong> (lançamento de notas, respostas de atividades, cadastros e mural).
            </p>
          </div>

          {lastAutoBackupLoaded && (
            <div className="bg-black/20 backdrop-blur-xs border border-white/10 rounded-xl p-3 text-xs flex items-start gap-2.5 self-start md:self-auto flex-shrink-0">
              <Clock className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-200">Último Autobackup Carregado</p>
                <p className="text-white/80 text-[11px] font-mono">
                  {new Date(lastAutoBackupLoaded.timestamp).toLocaleString('pt-BR')}
                </p>
                <p className="text-white/60 text-[10px] truncate max-w-xs mt-0.5">
                  {lastAutoBackupLoaded.trigger_reason}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('restore_points')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeSubTab === 'restore_points'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Pontos de Restauração & Autobackups</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeSubTab === 'restore_points' ? 'bg-indigo-700 text-white' : 'bg-zinc-200 text-zinc-700'
          }`}>
            {restorePoints.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit_logs')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeSubTab === 'audit_logs'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>Logs de Auditoria</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            activeSubTab === 'audit_logs' ? 'bg-indigo-700 text-white' : 'bg-zinc-200 text-zinc-700'
          }`}>
            {systemLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('manual_export_import')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeSubTab === 'manual_export_import'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Exportação & Importação Manual</span>
        </button>
      </div>

      {/* Sub-Tab 1: Pontos de Restauração & Autobackups */}
      {activeSubTab === 'restore_points' && (
        <RestorePointsList />
      )}

      {/* Sub-Tab 2: Logs de Auditoria do Sistema */}
      {activeSubTab === 'audit_logs' && (
        <SystemAuditLogs />
      )}

      {/* Sub-Tab 3: Exportação e Importação Manual */}
      {activeSubTab === 'manual_export_import' && (
        <div className="space-y-6">
          {/* Export & Import Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Export Data */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-zinc-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-4 mb-4 border-b border-zinc-100">
                  <Download className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-base text-zinc-900">Exportar Dados</h3>
                </div>

                <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
                  Faça o download de todos os registros da plataforma (escolas, turmas, alunos, atividades, notas e mural) para backup ou relatórios.
                </p>

                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 mb-6">
                  📊 <strong className="text-zinc-900">Inclui no backup:</strong> Escolas, turmas, alunos cadastrados, banco de atividades e notas atribuídas.
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={exportJSON}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Backup Completo (JSON)</span>
                </button>

                <button
                  onClick={exportCSV}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 flex items-center justify-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Exportar Planilha (CSV)</span>
                </button>

                <button
                  onClick={exportPDF}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 flex items-center justify-center gap-2 transition"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Gerar Relatório Imprimível (PDF)</span>
                </button>
              </div>
            </div>

            {/* Import Data */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-zinc-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-4 mb-4 border-b border-zinc-100">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-base text-zinc-900">Importar Dados</h3>
                </div>

                <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
                  Restaure um arquivo JSON de backup previamente salvo para alimentar a base de dados.
                </p>

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
                    dragActive
                      ? 'border-indigo-600 bg-indigo-50/40'
                      : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/50'
                  }`}
                  onClick={() => document.getElementById('import-file-input')?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-indigo-600 opacity-80" />
                  <p className="text-xs font-bold text-zinc-900">Arraste o arquivo JSON aqui</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">ou clique para procurar no computador</p>

                  <input
                    id="import-file-input"
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                {importStatus && (
                  <div className={`mt-3 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    importStatus.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {importStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    )}
                    <span>{importStatus.message}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100 mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p className="text-xs text-zinc-600 font-medium">
                    <strong>Política de Dados:</strong> Apenas dados inseridos pelos usuários ou importados via .json são mantidos.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {confirmClearProduction ? (
                    <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-300">
                      <span className="text-xs text-rose-800 dark:text-rose-200 font-bold">Zerar mesmo?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmClearProduction(false);
                          clearAllData();
                        }}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Sim, Zerar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearProduction(false)}
                        className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClearProduction(true)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition cursor-pointer"
                      title="Limpar todos os registros para cadastrar do zero em produção"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Zerar para Produção</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Auditoria e Limpeza de Armazenamento Local (localStorage/sessionStorage) */}
          <div className="bg-white dark:bg-[#15122b] rounded-2xl p-6 shadow-xs border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    Auditoria de Armazenamento Local (localStorage / sessionStorage)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Garante que nenhum dado principal (alunos, turmas, notas, atividades) fique armazenado no navegador.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const rep = purgeLocalStorageData();
                  setLastPurgeCount(rep.purgedFromLocalStorage.length + rep.purgedFromSessionStorage.length);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Auditar e Limpar Armazenamento Local</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">100% Sincronizado via API REST PHP 8.x (MySQL Hostinger)</p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                    O aplicativo não depende de cópias locais no navegador para exibir alunos, turmas ou notas. Todas as alterações são sincronizadas via API REST com prepared statements PDO.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                <Server className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Zero Persistência em Armazenamento Local</p>
                  <p className="text-[11px] text-indigo-800 dark:text-indigo-300 mt-0.5">
                    Zero dados de alunos, notas ou cadastros em localStorage, sessionStorage ou IndexedDB. Todas as requisições são transmitidas diretamente via HTTPS e JSON para o MySQL.
                  </p>
                </div>
              </div>
            </div>

            {lastPurgeCount !== null && (
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 text-xs border border-purple-200 dark:border-purple-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>
                  {lastPurgeCount > 0
                    ? `Limpeza realizada: ${lastPurgeCount} chave(s) de dados locais obsoleta(s) removida(s).`
                    : 'Auditoria concluída: Nenhuma chave de dados locais encontrada. Armazenamento local 100% limpo!'}
                </span>
              </div>
            )}
          </div>

          {/* Database Statistics & Production Readiness */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-zinc-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-zinc-900">Estatísticas do Banco de Dados</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDbModal(true)}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 hover:bg-purple-200 transition cursor-pointer"
                >
                  Ver Schema SQL & Endpoints
                </button>
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full text-xs font-semibold text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>MySQL Hostinger (PHP 8.x)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                <p className="text-2xl font-black text-zinc-900">{data.schools.length}</p>
                <p className="text-xs font-medium text-zinc-500 mt-0.5">Escolas</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                <p className="text-2xl font-black text-zinc-900">{data.classes.length}</p>
                <p className="text-xs font-medium text-zinc-500 mt-0.5">Turmas</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                <p className="text-2xl font-black text-zinc-900">{data.students.length}</p>
                <p className="text-xs font-medium text-zinc-500 mt-0.5">Alunos</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                <p className="text-2xl font-black text-zinc-900">{data.activities.length}</p>
                <p className="text-xs font-medium text-zinc-500 mt-0.5">Atividades</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                <p className="text-2xl font-black text-zinc-900">{data.grades.length}</p>
                <p className="text-xs font-medium text-zinc-500 mt-0.5">Notas</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                <p className="text-2xl font-black text-zinc-900">{data.posts.length}</p>
                <p className="text-xs font-medium text-zinc-500 mt-0.5">Mural</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                <p className="text-2xl font-black text-zinc-900">{data.events?.length || 0}</p>
                <p className="text-xs font-medium text-zinc-500 mt-0.5">Eventos</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100/80 flex items-start gap-2.5 text-xs text-indigo-950">
              <Server className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-indigo-900">Persistência Centralizada em Nuvem Ativa (API REST PHP 8.x + MySQL Hostinger)</p>
                <p className="text-zinc-600 text-[11px]">
                  Os dados são armazenados centralizadamente no banco MySQL/MariaDB da Hostinger através da API REST com PDO. Qualquer computador, notebook, celular ou tablet visualiza e manipula exatamente a mesma base compartilhada de forma segura e instantânea.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Banco de Dados */}
      <DatabaseStatusModal
        isOpen={showDbModal}
        onClose={() => setShowDbModal(false)}
        showToast={showToast}
      />
    </div>
  );
};
