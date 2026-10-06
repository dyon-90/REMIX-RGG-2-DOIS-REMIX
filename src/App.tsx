import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { DataProvider, useData } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { getSessionId } from './services/presence';
import { Header } from './components/Header';
import { RoleSelection } from './components/RoleSelection';
import { AdminLogin } from './components/AdminLogin';
import { StudentLogin } from './components/StudentLogin';
import { AdminPanel } from './components/AdminPanel/AdminPanel';
import { StudentDashboard } from './components/StudentPanel/StudentDashboard';
import { ToastContainer } from './components/ToastContainer';
import { Student } from './types';
import { StackedBooksLogo } from './components/BrandIcons';
import { FloatingOnlineSidebar } from './components/FloatingOnlineSidebar';

function AppContent() {
  const {
    data,
    isLoading,
    syncStatus,
    syncError,
    retryConnection,
    forceEnterApp,
    collectionSyncStatus,
    essentialCollections,
    collectionLabels,
    setPresenceUser,
    setCurrentActor
  } = useData();
  const [currentRole, setCurrentRole] = useState<'admin' | 'student' | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<string | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  // Sincroniza presença ativa em tempo real na nuvem para qualquer usuário conectado
  useEffect(() => {
    const sessionId = getSessionId();

    if (currentRole === 'admin' && currentAdmin) {
      const adminObj = (data.admins || []).find(
        a => a.username.toLowerCase() === currentAdmin.toLowerCase()
      );
      const adminName = adminObj ? adminObj.name : currentAdmin;
      const adminRole = adminObj?.role || 'Administrador Geral';
      
      setCurrentActor({
        id: currentAdmin,
        name: adminName,
        role: 'admin'
      });

      setPresenceUser({
        userId: currentAdmin,
        userName: adminName,
        userRole: 'admin',
        roleDetail: adminRole,
        currentPage: 'Painel Administrativo'
      });
    } else if (currentRole === 'student' && currentStudent) {
      setCurrentActor({
        id: currentStudent.entity_id,
        name: currentStudent.student_name,
        role: 'student'
      });

      setPresenceUser({
        userId: currentStudent.entity_id,
        userName: currentStudent.student_name,
        userRole: 'student',
        roleDetail: `${currentStudent.student_class_name || 'Turma'} • Matrícula: ${currentStudent.student_matricula || '—'}`,
        currentPage: 'Portal do Aluno'
      });
    } else if (currentRole === 'admin' && !currentAdmin) {
      setCurrentActor(null);
      setPresenceUser({
        userId: sessionId,
        userName: 'Acessando Admin',
        userRole: 'visitor',
        roleDetail: 'Tela de Autenticação Administrativa',
        currentPage: 'Login Admin'
      });
    } else if (currentRole === 'student' && !currentStudent) {
      setCurrentActor(null);
      setPresenceUser({
        userId: sessionId,
        userName: 'Acessando Aluno',
        userRole: 'visitor',
        roleDetail: 'Tela de Identificação do Aluno',
        currentPage: 'Login Aluno'
      });
    } else {
      setCurrentActor(null);
      setPresenceUser({
        userId: sessionId,
        userName: 'Visitante',
        userRole: 'visitor',
        roleDetail: 'Navegando na Página Inicial',
        currentPage: 'Página Inicial'
      });
    }
  }, [currentRole, currentAdmin, currentStudent, data.admins, setPresenceUser, setCurrentActor]);

  const handleSelectRole = (role: 'admin' | 'student') => {
    setCurrentRole(role);
  };

  const handleAdminSuccess = (username: string) => {
    setCurrentAdmin(username);
  };

  const handleStudentSuccess = (student: Student) => {
    setCurrentStudent(student);
  };

  const handleLogout = () => {
    setCurrentRole(null);
    setCurrentAdmin(null);
    setCurrentStudent(null);
    setCurrentActor(null);
  };

  const currentUser = currentRole === 'admin' 
    ? (currentAdmin ? `Admin (${currentAdmin})` : null)
    : (currentStudent ? currentStudent.student_name : null);

  const currentUserId = currentRole === 'admin'
    ? currentAdmin || undefined
    : currentStudent?.entity_id;

  if (isLoading) {
    const loadedCount = essentialCollections
      ? essentialCollections.filter(key => collectionSyncStatus?.[key]).length
      : 0;
    const totalCount = essentialCollections?.length || 9;
    const syncPercentage = Math.round((loadedCount / totalCount) * 100);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f4f2fb] via-[#ede9fe] to-[#f5f3ff] dark:from-[#0c0a17] dark:via-[#130f26] dark:to-[#1a1336] text-zinc-900 dark:text-zinc-100 p-4 antialiased font-sans">
        <div className="max-w-md w-full bg-white/95 dark:bg-[#15122b]/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-200/70 dark:border-purple-800/40 text-center">
          {/* Logo */}
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-[#6924f5] to-[#9054fa] rounded-2xl p-3 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <StackedBooksLogo size={36} />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white mb-1">
            2+DOIS= Aprender!
          </h1>
          <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">
            Supabase PostgreSQL Relacional
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
            Garantindo a mesma base de dados central para computador, notebook, celular e tablet.
          </p>

          {/* Barra de Progresso */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Validando coleções essenciais
              </span>
              <span className="text-purple-700 dark:text-purple-300 font-extrabold">{loadedCount} de {totalCount} ({syncPercentage}%)</span>
            </div>
            <div className="w-full bg-purple-100 dark:bg-purple-950/60 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-indigo-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${syncPercentage}%` }}
              />
            </div>
          </div>

          {/* Checklist das 9 coleções essenciais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left mb-6 max-h-56 overflow-y-auto p-1">
            {(essentialCollections || []).map(key => {
              const isLoaded = collectionSyncStatus?.[key];
              const label = collectionLabels?.[key] || key;
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    isLoaded
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                      : 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30 text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  <span className="truncate">{label}</span>
                  {isLoaded ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Alerta de erro ou tempo limite */}
          {syncError && (
            <div className="mb-4 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-purple-900 dark:text-purple-200 text-xs flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Aviso de Sincronização</p>
                <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">{syncError}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={forceEnterApp}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-[#7a32f7] to-[#8d47fa] hover:from-purple-700 hover:to-[#7a32f7] active:scale-95 text-white text-xs font-bold transition shadow-md shadow-purple-600/30 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Entrar na Aplicação Agora</span>
            </button>

            <button
              type="button"
              onClick={retryConnection}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition border border-zinc-200 dark:border-zinc-700 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tentar Reconectar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f2fb] dark:bg-[#0c0a17] text-zinc-900 dark:text-zinc-100 antialiased font-sans transition-colors duration-300">
      <Header
        currentRole={currentRole}
        currentUser={currentUser}
        currentUserId={currentUserId}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-center">
        {/* 1. Initial Role Selection */}
        {!currentRole && (
          <RoleSelection onSelectRole={handleSelectRole} />
        )}

        {/* 2. Admin Authentication flow */}
        {currentRole === 'admin' && !currentAdmin && (
          <AdminLogin
            onSuccess={handleAdminSuccess}
            onBack={() => setCurrentRole(null)}
          />
        )}

        {/* 3. Admin Main Panel */}
        {currentRole === 'admin' && currentAdmin && (
          <AdminPanel currentAdmin={currentAdmin} />
        )}

        {/* 4. Student Authentication flow */}
        {currentRole === 'student' && !currentStudent && (
          <StudentLogin
            onSuccess={handleStudentSuccess}
            onBack={() => setCurrentRole(null)}
          />
        )}

        {/* 5. Student Dashboard */}
        {currentRole === 'student' && currentStudent && (
          <StudentDashboard student={currentStudent} />
        )}
      </main>

      <footer className="py-5 text-center text-xs font-medium text-purple-900/60 dark:text-purple-300/60 border-t border-purple-100 dark:border-purple-900/40 bg-white/70 dark:bg-[#120f24]/80 backdrop-blur-xs transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#6f2ef7] rounded-md flex items-center justify-center p-0.5 shadow-xs">
              <StackedBooksLogo size={14} />
            </div>
            <span className="font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">2+DOIS= Aprender!</span>
            <span className="text-purple-300 dark:text-purple-600">•</span>
            <span>Plataforma Educacional</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="font-semibold text-purple-700 dark:text-purple-300">MySQL Hostinger (PHP 8.x):</span>
            <span>Base central única para computador, notebook, celular e tablet</span>
          </div>
          <p className="text-purple-900/50 dark:text-purple-400/50 text-[11px]">
            © {new Date().getFullYear()} Todos os direitos reservados.
          </p>
        </div>
      </footer>

      <FloatingOnlineSidebar currentUserId={currentUserId} />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ThemeProvider>
  );
}

