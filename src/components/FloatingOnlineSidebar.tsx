import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { getSessionId } from '../services/presence';
import {
  Users,
  ShieldCheck,
  GraduationCap,
  Search,
  Laptop,
  Smartphone,
  Tablet,
  Clock,
  ChevronRight,
  ChevronLeft,
  X,
  Radio,
  Sparkles,
  Activity
} from 'lucide-react';

interface FloatingOnlineSidebarProps {
  currentUserId?: string;
}

export const FloatingOnlineSidebar: React.FC<FloatingOnlineSidebarProps> = ({ currentUserId }) => {
  const { onlineUsers, onlineAdmins, onlineStudents } = useData();
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const [activeFilter, setActiveFilter] = useState<'all' | 'admin' | 'student'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = onlineUsers.filter(user => {
    if (activeFilter === 'admin' && user.user_role !== 'admin') return false;
    if (activeFilter === 'student' && user.user_role !== 'student') return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      user.user_name.toLowerCase().includes(term) ||
      (user.role_detail && user.role_detail.toLowerCase().includes(term)) ||
      (user.current_page && user.current_page.toLowerCase().includes(term)) ||
      (user.browser_name && user.browser_name.toLowerCase().includes(term))
    );
  });

  const getDeviceIcon = (deviceType?: string) => {
    if (deviceType === 'mobile') return <Smartphone className="w-3 h-3 text-zinc-400" />;
    if (deviceType === 'tablet') return <Tablet className="w-3 h-3 text-zinc-400" />;
    return <Laptop className="w-3 h-3 text-zinc-400" />;
  };

  const formatJoinedTime = (joinedAtStr?: string) => {
    if (!joinedAtStr) return 'Agora';
    try {
      const d = new Date(joinedAtStr);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Agora';
    }
  };

  return (
    <aside
      aria-label="Lista de usuários online"
      className="fixed right-3 sm:right-4 bottom-4 z-40 select-none pointer-events-auto transition-all duration-300 ease-out"
    >
      {/* Botão flutuante quando a barra estiver recolhida */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/95 hover:bg-white text-zinc-800 shadow-xl hover:shadow-2xl border border-purple-200/80 backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group"
          title="Abrir painel lateral de usuários online"
        >
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
            </span>
          </div>

          <div className="text-left pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-zinc-900 leading-tight">
                {onlineUsers.length}
              </span>
              <span className="text-[11px] font-bold text-zinc-600">Online</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">
              {onlineAdmins.length} Adm • {onlineStudents.length} Alunos
            </p>
          </div>

          <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-purple-600 transition -mr-1" />
        </button>
      )}

      {/* Painel Lateral Flutuante Aberto */}
      {isOpen && (
        <div className="w-[320px] sm:w-[350px] max-h-[82vh] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-purple-100 flex flex-col overflow-hidden animate-fade-in ring-1 ring-black/5">
          {/* Header do Card Lateral */}
          <div className="p-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white backdrop-blur-xs">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-purple-800" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-sm font-black tracking-tight text-white">
                    Usuários Conectados
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-500/25 border border-emerald-400/30 text-emerald-300">
                    Ao vivo
                  </span>
                </div>
                <p className="text-[10px] text-purple-200 font-medium">
                  {onlineUsers.length} presente{onlineUsers.length === 1 ? '' : 's'} agora
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/15 text-purple-200 hover:text-white transition cursor-pointer"
                title="Minimizar painel lateral"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Barra de Resumo e Filtro Rápido */}
          <div className="p-3 bg-zinc-50/90 border-b border-zinc-100 space-y-2">
            {/* Contadores / Botões de Filtro */}
            <div className="grid grid-cols-3 gap-1.5 bg-zinc-200/70 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveFilter('all')}
                className={`py-1 rounded-lg text-[11px] transition flex items-center justify-center gap-1 cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>Todos</span>
                <span className="px-1.5 py-0.2 rounded-full bg-zinc-100 text-[10px] font-black text-zinc-700">
                  {onlineUsers.length}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('admin')}
                className={`py-1 rounded-lg text-[11px] transition flex items-center justify-center gap-1 cursor-pointer ${
                  activeFilter === 'admin'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <ShieldCheck className="w-3 h-3 text-purple-600" />
                <span>Admins</span>
                <span className="px-1.5 py-0.2 rounded-full bg-purple-50 text-[10px] font-black text-purple-700">
                  {onlineAdmins.length}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('student')}
                className={`py-1 rounded-lg text-[11px] transition flex items-center justify-center gap-1 cursor-pointer ${
                  activeFilter === 'student'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <GraduationCap className="w-3 h-3 text-indigo-600" />
                <span>Alunos</span>
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 text-[10px] font-black text-indigo-700">
                  {onlineStudents.length}
                </span>
              </button>
            </div>

            {/* Input de Busca Rápida */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar usuário..."
                className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de Usuários com Scroll */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 divide-y divide-zinc-100/60 max-h-[50vh]">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => {
                const mySessionId = getSessionId();
                const isThisTab = user.session_id === mySessionId;
                const isSameAccount = currentUserId && user.user_id === currentUserId;
                const isAdmin = user.user_role === 'admin';
                const isStudent = user.user_role === 'student';
                const isVisitor = user.user_role === 'visitor';

                return (
                  <div
                    key={user.session_id}
                    className={`pt-2 first:pt-0 group p-2 rounded-2xl transition duration-150 ${
                      isThisTab
                        ? 'bg-purple-50/70 border border-purple-200/70'
                        : isSameAccount
                          ? 'bg-amber-50/50 border border-amber-200/60'
                          : 'hover:bg-zinc-50 border border-transparent hover:border-zinc-200/60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Avatar com status de atividade ao vivo */}
                      <div className="relative flex-shrink-0 mt-0.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xs ${
                            isAdmin
                              ? 'bg-gradient-to-br from-purple-600 to-indigo-700'
                              : isStudent
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                : 'bg-gradient-to-br from-zinc-500 to-slate-600'
                          }`}
                        >
                          {isAdmin ? 'A' : isStudent ? (user.user_name || 'A').charAt(0).toUpperCase() : 'V'}
                        </div>
                        {/* Ponto pulsante verde de status ativo */}
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs">
                          <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                        </span>
                      </div>

                      {/* Informações do Usuário */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h4 className="text-xs font-bold text-zinc-900 truncate leading-snug">
                              {user.user_name}
                            </h4>
                            {isThisTab && (
                              <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-purple-100 text-purple-800 border border-purple-200 flex-shrink-0">
                                Você
                              </span>
                            )}
                            {!isThisTab && isSameAccount && (
                              <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex-shrink-0">
                                Outro dispositivo
                              </span>
                            )}
                          </div>

                          {/* Papel do usuário com ícone */}
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-bold border flex-shrink-0 ${
                              isAdmin
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : isStudent
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                            }`}
                          >
                            {isAdmin ? (
                              <ShieldCheck className="w-2.5 h-2.5" />
                            ) : isStudent ? (
                              <GraduationCap className="w-2.5 h-2.5" />
                            ) : (
                              <Users className="w-2.5 h-2.5" />
                            )}
                            <span>{isAdmin ? 'Admin' : isStudent ? 'Aluno' : 'Visitante'}</span>
                          </span>
                        </div>

                        {/* Detalhe da Função / Turma */}
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5 font-medium">
                          {user.role_detail || (isAdmin ? 'Administração Escolar' : 'Aluno Matriculado')}
                        </p>

                        {/* Status de Atividade & Contexto */}
                        <div className="flex items-center justify-between text-[10px] mt-1.5 pt-1 border-t border-zinc-100 text-zinc-400">
                          {/* Tela atual / Atividade */}
                          <div className="flex items-center gap-1 text-emerald-600 font-semibold truncate max-w-[170px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                            <span className="truncate">{user.current_page || 'Navegando'}</span>
                          </div>

                          {/* Dispositivo e Horário de Conexão */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {getDeviceIcon(user.device_type)}
                            <span className="text-zinc-500">{formatJoinedTime(user.joined_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 px-3 text-zinc-400">
                <Users className="w-7 h-7 mx-auto mb-1.5 opacity-30 text-zinc-400" />
                <p className="text-xs font-semibold text-zinc-600">Nenhum usuário</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {searchTerm
                    ? 'Nenhum resultado para a busca informada.'
                    : 'Nenhum usuário nesta categoria no momento.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer Compacto */}
          <div className="p-2.5 bg-zinc-50/90 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-500">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Activity className="w-3 h-3 text-purple-600" />
              <span>Sincronizado em tempo real</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-purple-700 hover:text-purple-900 font-bold hover:underline cursor-pointer"
            >
              Recolher
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
