import React, { useState } from 'react';
import { OnlineUserPresence } from '../../types';
import { useData } from '../../context/DataContext';
import { getSessionId } from '../../services/presence';
import {
  X,
  Users,
  ShieldCheck,
  GraduationCap,
  Search,
  Laptop,
  Smartphone,
  Tablet,
  Clock,
  Sparkles,
  Wifi
} from 'lucide-react';

interface OnlineUsersModalProps {
  currentUserId?: string;
  onClose: () => void;
}

export const OnlineUsersModal: React.FC<OnlineUsersModalProps> = ({ currentUserId, onClose }) => {
  const { onlineUsers, onlineAdmins, onlineStudents } = useData();
  const [activeTab, setActiveTab] = useState<'all' | 'admin' | 'student'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = onlineUsers.filter(user => {
    if (activeTab === 'admin' && user.user_role !== 'admin') return false;
    if (activeTab === 'student' && user.user_role !== 'student') return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      user.user_name.toLowerCase().includes(term) ||
      (user.role_detail && user.role_detail.toLowerCase().includes(term)) ||
      (user.browser_name && user.browser_name.toLowerCase().includes(term))
    );
  });

  const getDeviceIcon = (deviceType?: string) => {
    if (deviceType === 'mobile') return <Smartphone className="w-3.5 h-3.5" />;
    if (deviceType === 'tablet') return <Tablet className="w-3.5 h-3.5" />;
    return <Laptop className="w-3.5 h-3.5" />;
  };

  const formatJoinedTime = (joinedAtStr?: string) => {
    if (!joinedAtStr) return 'Recente';
    try {
      const d = new Date(joinedAtStr);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recente';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl w-full max-w-xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 flex-shrink-0">
              <Wifi className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-zinc-900">
                  Usuários Online no Momento
                </h3>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Monitoramento contínuo em tempo real de Admins e Alunos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
            title="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          <div
            onClick={() => setActiveTab('all')}
            className={`p-3 rounded-2xl border cursor-pointer transition ${
              activeTab === 'all'
                ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20'
                : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500">Total</span>
              <Users className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <p className="text-xl font-black text-zinc-900 mt-1">
              {onlineUsers.length}
            </p>
            <span className="text-[10px] text-zinc-400 font-medium">Conectados</span>
          </div>

          <div
            onClick={() => setActiveTab('admin')}
            className={`p-3 rounded-2xl border cursor-pointer transition ${
              activeTab === 'admin'
                ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20'
                : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500">Admins</span>
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <p className="text-xl font-black text-purple-700 mt-1">
              {onlineAdmins.length}
            </p>
            <span className="text-[10px] text-zinc-400 font-medium">Equipe gestora</span>
          </div>

          <div
            onClick={() => setActiveTab('student')}
            className={`p-3 rounded-2xl border cursor-pointer transition ${
              activeTab === 'student'
                ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
                : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500">Alunos</span>
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <p className="text-xl font-black text-indigo-700 mt-1">
              {onlineStudents.length}
            </p>
            <span className="text-[10px] text-zinc-400 font-medium">Estudando</span>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row gap-2 pb-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, turma ou função..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 text-xs bg-zinc-50/80 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
            />
          </div>

          <div className="flex bg-zinc-100 p-1 rounded-xl text-xs font-semibold text-zinc-600">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                activeTab === 'all' ? 'bg-white text-zinc-900 shadow-xs' : 'hover:text-zinc-900'
              }`}
            >
              Todos ({onlineUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                activeTab === 'admin' ? 'bg-white text-purple-700 shadow-xs' : 'hover:text-zinc-900'
              }`}
            >
              Admins ({onlineAdmins.length})
            </button>
            <button
              onClick={() => setActiveTab('student')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                activeTab === 'student' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-zinc-900'
              }`}
            >
              Alunos ({onlineStudents.length})
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => {
              const mySessionId = getSessionId();
              const isThisTab = user.session_id === mySessionId;
              const isSameAccount = currentUserId && (user.user_id === currentUserId);
              const isAdmin = user.user_role === 'admin';
              const isStudent = user.user_role === 'student';
              const isVisitor = user.user_role === 'visitor';

              return (
                <div
                  key={user.session_id}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isThisTab
                      ? 'bg-purple-50/50 border-purple-200'
                      : isSameAccount
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-white border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar with live status indicator */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-xs ${
                          isAdmin
                            ? 'bg-gradient-to-br from-purple-600 to-indigo-700'
                            : isStudent
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                              : 'bg-gradient-to-br from-zinc-500 to-slate-600'
                        }`}
                      >
                        {isAdmin ? 'A' : isStudent ? (user.user_name || 'A').charAt(0).toUpperCase() : 'V'}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-zinc-900 truncate">
                          {user.user_name}
                        </h4>
                        {isThisTab && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                            Você
                          </span>
                        )}
                        {!isThisTab && isSameAccount && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Outro dispositivo
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.2 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                            isAdmin
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : isStudent
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                          }`}
                        >
                          {isAdmin ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : isStudent ? (
                            <GraduationCap className="w-3 h-3" />
                          ) : (
                            <Users className="w-3 h-3" />
                          )}
                          <span>{isAdmin ? 'Administrador' : isStudent ? 'Aluno' : 'Visitante'}</span>
                        </span>
                      </div>

                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {user.role_detail || (isAdmin ? 'Painel de Gestão' : 'Aluno Matriculado')}
                      </p>
                    </div>
                  </div>

                  {/* Device and active tag */}
                  <div className="text-right flex-shrink-0">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 text-zinc-700 text-[11px] font-semibold">
                      {getDeviceIcon(user.device_type)}
                      <span className="hidden sm:inline">{user.browser_name || 'Navegador'}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-600 font-bold mt-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>Ativo agora</span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-zinc-400 font-normal">Desde {formatJoinedTime(user.joined_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 px-4 text-zinc-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-600">Nenhum usuário encontrado</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {searchTerm
                  ? 'Nenhum usuário online corresponde ao filtro informado.'
                  : 'Nenhum usuário nesta categoria conectado no momento.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Atualização automática a cada batimento cardíaco da conexão</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
