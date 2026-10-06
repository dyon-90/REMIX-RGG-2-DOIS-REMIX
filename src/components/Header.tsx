import React, { useState } from 'react';
import { User, Cloud, RefreshCw, AlertCircle, Users, Database } from 'lucide-react';
import { StackedBooksLogo } from './BrandIcons';
import { useData } from '../context/DataContext';
import { OnlineUsersModal } from './Modals/OnlineUsersModal';
import { DatabaseStatusModal } from './Modals/DatabaseStatusModal';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  currentRole: 'admin' | 'student' | null;
  currentUser: string | null;
  currentUserId?: string;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRole, currentUser, currentUserId, onLogout }) => {
  const { syncStatus, syncError, retryConnection, onlineUsers, onlineAdmins, onlineStudents, showToast } = useData();
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);

  const subtitle = currentRole === 'admin' 
    ? 'Painel Administrativo' 
    : currentRole === 'student' 
    ? 'Portal do Aluno' 
    : 'Painel Administrativo';

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#6924f5] via-[#7a32f7] to-[#8d47fa] text-white shadow-[0_4px_25px_rgba(105,36,245,0.35)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-2xl p-2 flex items-center justify-center border border-white/30 shadow-inner flex-shrink-0">
            <StackedBooksLogo size={26} />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-black tracking-tight text-white leading-tight drop-shadow-xs">
              2+DOIS= Aprender!
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-purple-100/90 text-xs font-medium leading-none">
                {subtitle}
              </p>
              <span className="text-purple-300 text-xs">•</span>
              {/* Cloud Sync Status Indicator */}
              {syncStatus === 'synced' && (
                <div
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-200 bg-emerald-500/25 px-2.5 py-0.5 rounded-full border border-emerald-300/35 cursor-help"
                  title="Sincronização em tempo real ativa com o Supabase PostgreSQL: Garantindo a mesma base central para computador, notebook, celular e tablet."
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Tempo Real Ativo</span>
                  <span className="sm:hidden">Online</span>
                </div>
              )}
              {syncStatus === 'saving' && (
                <div
                  className="flex items-center gap-1 text-[11px] font-semibold text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-300/30"
                  title="Salvando alterações na base central do Supabase..."
                >
                  <RefreshCw className="w-3 h-3 text-amber-300 animate-spin" />
                  <span>Salvando...</span>
                </div>
              )}
              {syncStatus === 'loading' && (
                <div
                  className="flex items-center gap-1 text-[11px] font-medium text-purple-200 bg-white/10 px-2 py-0.5 rounded-full border border-white/20"
                  title="Conectando à base central do Supabase PostgreSQL..."
                >
                  <Cloud className="w-3 h-3 text-purple-200 animate-pulse" />
                  <span className="hidden sm:inline">Sincronizando...</span>
                </div>
              )}
              {syncStatus === 'error' && (
                <button
                  onClick={retryConnection}
                  className="flex items-center gap-1 text-[11px] font-semibold text-rose-100 bg-rose-500/30 hover:bg-rose-500/40 px-2 py-0.5 rounded-full border border-rose-300/40 cursor-pointer transition active:scale-95"
                  title={syncError || 'Clique para tentar reconectar ao servidor'}
                >
                  <AlertCircle className="w-3 h-3 text-rose-200" />
                  <span>Reconectar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* User Status & Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Botão de Conexão e Status do Banco de Dados */}
          <button
            type="button"
            onClick={() => setShowDbModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full active:scale-95 transition backdrop-blur-md text-xs font-bold border shadow-xs cursor-pointer bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-100 border-emerald-300/40"
            title="Banco Ativo: Supabase PostgreSQL (cvxxyqjefqkpculdjfqp.supabase.co)"
          >
            <Database className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">Supabase PostgreSQL</span>
            <span className="sm:hidden">Supabase</span>
          </button>

          {/* Alternância de Tema (Dark Mode / Light Mode) */}
          <ThemeToggle />

          {/* Botão de Usuários Online em Tempo Real */}
          <button
            type="button"
            onClick={() => setShowOnlineModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition backdrop-blur-md text-white text-xs font-bold border border-white/25 shadow-xs cursor-pointer"
            title={`${onlineUsers.length} usuários online (${onlineAdmins.length} Admins, ${onlineStudents.length} Alunos). Clique para ver a lista.`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <Users className="w-3.5 h-3.5 text-white" />
            <span className="font-extrabold">{onlineUsers.length}</span>
            <span className="hidden md:inline text-[11px] font-medium text-purple-100">Online</span>
          </button>

          {currentUser && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs sm:text-sm font-semibold border border-white/25 shadow-xs">
              <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-white">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="max-w-[130px] sm:max-w-[200px] truncate text-white">
                {currentUser}
              </span>
            </div>
          )}

          {currentRole && (
            <button
              onClick={onLogout}
              className="px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-white text-[#ff5c5c] hover:bg-white/95 shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer"
            >
              Sair
            </button>
          )}
        </div>
      </div>

      {/* Sub-barra de Sincronização em Tempo Real com API REST PHP e MySQL Hostinger */}
      <div className="bg-[#5619ca]/95 border-t border-purple-400/20 px-4 sm:px-6 py-1.5 text-xs text-purple-100 backdrop-blur-xs shadow-xs">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="font-bold text-white tracking-wide">
              API REST PHP 8.x • MySQL Hostinger
            </span>
            <span className="text-purple-300/80 hidden sm:inline">•</span>
            <span className="text-purple-200 text-[11.5px] font-medium hidden sm:inline">
              Garantindo a mesma base central para computador, notebook, celular e tablet.
            </span>
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            <span className="text-purple-200/95 text-[10.5px] font-medium sm:hidden">
              Garantindo a mesma base central para computador, notebook, celular e tablet.
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] uppercase font-bold tracking-wider text-emerald-300 flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Sincronização Ativa
            </span>
          </div>
        </div>
      </div>

      {/* Modal de Usuários Online */}
      {showOnlineModal && (
        <OnlineUsersModal
          currentUserId={currentUserId}
          onClose={() => setShowOnlineModal(false)}
        />
      )}

      {/* Modal Central de Status e Auditoria do MySQL Hostinger */}
      <DatabaseStatusModal
        isOpen={showDbModal}
        onClose={() => setShowDbModal(false)}
        showToast={showToast}
      />
    </header>
  );
};


