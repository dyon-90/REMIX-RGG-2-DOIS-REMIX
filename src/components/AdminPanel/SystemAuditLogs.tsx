import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { SystemLog, LogActionType } from '../../types';
import {
  ListFilter,
  Search,
  Download,
  GraduationCap,
  Shield,
  Clock,
  PlusCircle,
  Pencil,
  Trash2,
  CheckCircle2,
  RotateCcw,
  UploadCloud,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export const SystemAuditLogs: React.FC = () => {
  const { systemLogs } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredLogs = systemLogs.filter(log => {
    if (actionFilter !== 'all' && log.action_type !== actionFilter) return false;
    if (roleFilter !== 'all' && log.user_role !== roleFilter) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.entity_title.toLowerCase().includes(term) ||
      log.user_name.toLowerCase().includes(term) ||
      (log.details && log.details.toLowerCase().includes(term))
    );
  });

  const exportLogsCSV = () => {
    if (systemLogs.length === 0) return;
    const headers = ['Data e Hora', 'Usuário', 'Papel', 'Ação', 'Entidade', 'Título', 'Detalhes', 'ID Ponto Restauração'];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString('pt-BR'),
      log.user_name,
      log.user_role,
      log.action_type,
      log.entity_type,
      log.entity_title.replace(/"/g, '""'),
      (log.details || '').replace(/"/g, '""'),
      log.restore_point_id || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `logs_auditoria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getActionBadge = (action: LogActionType) => {
    switch (action) {
      case 'create':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <PlusCircle className="w-3 h-3" />
            <span>Inserção</span>
          </span>
        );
      case 'update':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Pencil className="w-3 h-3" />
            <span>Edição</span>
          </span>
        );
      case 'delete':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Trash2 className="w-3 h-3" />
            <span>Exclusão</span>
          </span>
        );
      case 'submit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <GraduationCap className="w-3 h-3" />
            <span>Entrega de Aluno</span>
          </span>
        );
      case 'evaluate':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Avaliação</span>
          </span>
        );
      case 'restore':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3 h-3" />
            <span>Restauração</span>
          </span>
        );
      case 'import':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <UploadCloud className="w-3 h-3" />
            <span>Importação</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
            <span>{action}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-indigo-600" />
            <span>Logs de Auditoria do Sistema</span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Registro cronológico de todas as inserções, edições e exclusões executadas por quaisquer usuários.
          </p>
        </div>

        <button
          onClick={exportLogsCSV}
          disabled={filteredLogs.length === 0}
          className="py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 flex items-center justify-center gap-2 transition disabled:opacity-40 flex-shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Exportar Planilha de Logs (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuário, título ou ação..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          >
            <option value="all">Todas as Ações ({systemLogs.length})</option>
            <option value="create">Inserções (Criação)</option>
            <option value="update">Edições (Atualização)</option>
            <option value="delete">Exclusões (Remoção)</option>
            <option value="submit">Entregas de Atividades (Alunos)</option>
            <option value="evaluate">Lançamentos de Notas</option>
            <option value="restore">Restaurações de Sistema</option>
            <option value="import">Importações</option>
          </select>
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          >
            <option value="all">Todos os Papéis</option>
            <option value="student">Alunos</option>
            <option value="admin">Administradores</option>
            <option value="system">Sistema Automático</option>
          </select>
        </div>
      </div>

      {/* Logs Table / List */}
      {filteredLogs.length === 0 ? (
        <div className="p-10 rounded-2xl bg-zinc-50 border border-dashed border-zinc-300 text-center space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-zinc-400" />
          <p className="text-xs font-bold text-zinc-700">Nenhum registro de log encontrado</p>
          <p className="text-[11px] text-zinc-500">
            As ações efetuadas por alunos e administradores aparecerão registradas aqui em tempo real.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Data e Hora</th>
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4">Entidade / Objeto</th>
                  <th className="py-3 px-4">Detalhes da Alteração</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredLogs.map(log => {
                  const dateObj = new Date(log.timestamp);
                  const formattedDate = dateObj.toLocaleDateString('pt-BR');
                  const formattedTime = dateObj.toLocaleTimeString('pt-BR');

                  return (
                    <tr key={log.entity_id} className="hover:bg-zinc-50/60 transition">
                      <td className="py-3 px-4 whitespace-nowrap text-zinc-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                          <span>{formattedDate}</span>
                          <span className="text-zinc-400 text-[11px]">{formattedTime}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {log.user_role === 'student' ? (
                            <span className="p-1 rounded-md bg-indigo-50 text-indigo-600">
                              <GraduationCap className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-md bg-emerald-50 text-emerald-600">
                              <Shield className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <span className="font-semibold text-zinc-900">{log.user_name}</span>
                          <span className="text-[10px] text-zinc-400 font-medium">
                            ({log.user_role === 'student' ? 'Aluno' : log.user_role === 'admin' ? 'Admin' : 'Sistema'})
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActionBadge(log.action_type)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-medium text-zinc-800">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[11px]">
                          {log.entity_title}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-zinc-600 max-w-md truncate">
                        {log.details || log.entity_title}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
