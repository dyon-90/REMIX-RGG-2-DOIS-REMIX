import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { getSessionId } from '../../services/presence';
import {
  Users,
  ShieldCheck,
  GraduationCap,
  Search,
  Laptop,
  Smartphone,
  Tablet,
  Clock,
  Wifi,
  Sparkles,
  ExternalLink,
  Activity,
  CheckCircle2
} from 'lucide-react';

interface OnlineUsersTabProps {
  currentAdmin: string;
}

export const OnlineUsersTab: React.FC<OnlineUsersTabProps> = ({ currentAdmin }) => {
  const { onlineUsers, onlineAdmins, onlineStudents, data } = useData();
  const [activeFilter, setActiveFilter] = useState<'all' | 'admin' | 'student'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = onlineUsers.filter(u => {
    if (activeFilter === 'admin' && u.user_role !== 'admin') return false;
    if (activeFilter === 'student' && u.user_role !== 'student') return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.user_name.toLowerCase().includes(term) ||
      (u.role_detail && u.role_detail.toLowerCase().includes(term)) ||
      (u.current_page && u.current_page.toLowerCase().includes(term)) ||
      (u.browser_name && u.browser_name.toLowerCase().includes(term))
    );
  });

  const getDeviceIcon = (deviceType?: string) => {
    if (deviceType === 'mobile') return <Smartphone className="w-4 h-4 text-zinc-500" />;
    if (deviceType === 'tablet') return <Tablet className="w-4 h-4 text-zinc-500" />;
    return <Laptop className="w-4 h-4 text-zinc-500" />;
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Sincronização em Tempo Real Ativa</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight">
            Usuários Conectados na Plataforma
          </h2>
          <p className="text-purple-100 text-xs sm:text-sm mt-2 leading-relaxed">
            Acompanhe em tempo real quais administradores da coordenação e alunos estão interagindo com a plataforma educacional neste exato instante.
          </p>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10 max-w-xl">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/15">
            <div className="flex items-center justify-between text-purple-200">
              <span className="text-xs font-semibold">Total Online</span>
              <Users className="w-4 h-4" />
            </div>
            <p className="text-2xl sm:text-3xl font-black mt-1 text-white">
              {onlineUsers.length}
            </p>
            <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sessões ativas
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/15">
            <div className="flex items-center justify-between text-purple-200">
              <span className="text-xs font-semibold">Administradores</span>
              <ShieldCheck className="w-4 h-4 text-purple-300" />
            </div>
            <p className="text-2xl sm:text-3xl font-black mt-1 text-purple-200">
              {onlineAdmins.length}
            </p>
            <span className="text-[10px] text-purple-300 font-medium">Gestão & Coordenação</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/15">
            <div className="flex items-center justify-between text-purple-200">
              <span className="text-xs font-semibold">Alunos</span>
              <GraduationCap className="w-4 h-4 text-indigo-300" />
            </div>
            <p className="text-2xl sm:text-3xl font-black mt-1 text-indigo-200">
              {onlineStudents.length}
            </p>
            <span className="text-[10px] text-indigo-300 font-medium">Estudantes</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto bg-zinc-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Todos ({onlineUsers.length})
          </button>
          <button
            onClick={() => setActiveFilter('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeFilter === 'admin'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Administradores ({onlineAdmins.length})
          </button>
          <button
            onClick={() => setActiveFilter('student')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeFilter === 'student'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Alunos ({onlineStudents.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, turma..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-zinc-200 text-xs bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
          />
        </div>
      </div>

      {/* Grid of Online Users */}
      {filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(user => {
            const mySessionId = getSessionId();
            const isThisTab = user.session_id === mySessionId;
            const isCurrentUser = user.user_id === currentAdmin;
            const isAdmin = user.user_role === 'admin';
            const isStudent = user.user_role === 'student';
            const isVisitor = user.user_role === 'visitor';

            return (
              <div
                key={user.session_id}
                className={`bg-white rounded-2xl p-5 border transition flex flex-col justify-between shadow-xs ${
                  isThisTab
                    ? 'border-purple-300 ring-2 ring-purple-500/10'
                    : isCurrentUser
                      ? 'border-amber-300 ring-2 ring-amber-500/10'
                      : 'border-zinc-200 hover:border-zinc-300 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="relative">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base text-white shadow-xs ${
                          isAdmin
                            ? 'bg-gradient-to-br from-purple-600 to-indigo-700'
                            : isStudent
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                              : 'bg-gradient-to-br from-zinc-500 to-slate-600'
                        }`}
                      >
                        {isAdmin ? 'A' : isStudent ? (user.user_name || 'A').charAt(0).toUpperCase() : 'V'}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
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

                      {isThisTab ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200">
                          Sua Sessão (Esta Aba)
                        </span>
                      ) : isCurrentUser ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                          Seu Outro Dispositivo
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-zinc-900 leading-snug">
                    {user.user_name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                    {user.role_detail || (isAdmin ? 'Equipe de Gestão' : 'Aluno Matriculado')}
                  </p>
                </div>

                {/* Status footer info */}
                <div className="mt-4 pt-3.5 border-t border-zinc-100 text-xs space-y-2">
                  <div className="flex items-center justify-between text-zinc-600">
                    <span className="text-[11px] text-zinc-400">Dispositivo:</span>
                    <div className="flex items-center gap-1.5 font-medium">
                      {getDeviceIcon(user.device_type)}
                      <span>{user.browser_name || 'Navegador'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-zinc-600">
                    <span className="text-[11px] text-zinc-400">Tela ativa:</span>
                    <span className="font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md text-[11px]">
                      {user.current_page || 'Painel'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Online agora
                    </span>
                    <span className="text-zinc-400">
                      Entrou às {formatJoinedTime(user.joined_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 shadow-xs max-w-md mx-auto">
          <Users className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-800 text-base">Nenhum usuário encontrado</h3>
          <p className="text-xs text-zinc-500 mt-1">
            {searchTerm
              ? 'Tente remover os termos de busca para visualizar os usuários conectados.'
              : 'Nenhum usuário conectado com os filtros selecionados.'}
          </p>
        </div>
      )}
    </div>
  );
};
