import React, { useState } from 'react';
import { LayoutDashboard, School, BookOpen, Users, CheckSquare, Award, Send, Megaphone, CalendarDays, ShieldCheck, Database, Wifi, FileEdit, Zap, GraduationCap } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { DashboardTab } from './DashboardTab';
import { SchoolsTab } from './SchoolsTab';
import { ClassesTab } from './ClassesTab';
import { StudentsTab } from './StudentsTab';
import { ActivitiesTab } from './ActivitiesTab';
import { GradesTab } from './GradesTab';
import { SubmissionsTab } from './SubmissionsTab';
import { CertificatesTab } from './CertificatesTab';
import { MuralTab } from './MuralTab';
import { AcademicCalendar } from '../Calendar/AcademicCalendar';
import { AdminsTab } from './AdminsTab';
import { OnlineUsersTab } from './OnlineUsersTab';
import { BackupTab } from './BackupTab';
import { CollaborativeWorkspace } from '../CollaborativeWorkspace/CollaborativeWorkspace';
import { AdminQuickSearch } from './AdminQuickSearch';

interface AdminPanelProps {
  currentAdmin: string;
}

type AdminTab = 'dashboard' | 'files' | 'schools' | 'classes' | 'students' | 'activities' | 'grades' | 'submissions' | 'certificates' | 'mural' | 'calendar' | 'admins' | 'online' | 'backup';

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentAdmin }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [highlightEntity, setHighlightEntity] = useState<{ tab: 'students' | 'classes' | 'activities'; id: string } | null>(null);
  const { data, syncStatus, onlineUsers } = useData();

  const handleNavigateToEntity = (tab: 'students' | 'classes' | 'activities', entityId: string) => {
    setActiveTab(tab);
    setHighlightEntity({ tab, id: entityId });
  };

  const handleClearHighlight = () => {
    setHighlightEntity(null);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'files', label: 'Arquivos Colaborativos', icon: FileEdit, badge: (data.collaborative_files || []).length || 'Novo' },
    { id: 'schools', label: 'Escolas', icon: School },
    { id: 'classes', label: 'Turmas', icon: BookOpen },
    { id: 'students', label: 'Alunos', icon: Users },
    { id: 'activities', label: 'Atividades', icon: CheckSquare },
    { id: 'grades', label: 'Notas', icon: Award },
    { id: 'submissions', label: 'Entregas', icon: Send },
    { id: 'certificates', label: 'Certificados', icon: GraduationCap },
    { id: 'mural', label: 'Mural', icon: Megaphone },
    { id: 'calendar', label: 'Calendário', icon: CalendarDays },
    { id: 'admins', label: 'Administradores', icon: ShieldCheck },
    { id: 'online', label: 'Usuários Online', icon: Wifi, badge: onlineUsers.length },
    { id: 'backup', label: 'Backup & Dados', icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Quick Search Bar & Tab Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">
              Painel Administrativo
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 transition-colors">
              Gestão pedagógica, acompanhamento de turmas e controle de registros
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {/* Indicador de Salvamento Automático & Sincronização em Tempo Real (Sem botão Salvar) */}
            <div 
              id="admin-autosave-indicator"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-2xs transition-colors"
              title="Todas as alterações são gravadas instantaneamente na nuvem sem necessidade de botão salvar"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Auto-salvamento ativo na nuvem</span>
            </div>

            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800/50 shadow-xs flex items-center gap-1.5 transition-colors">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Sessão: <strong className="text-purple-950 dark:text-white">{currentAdmin}</strong>
            </span>
          </div>
        </div>

        {/* Quick Search Bar Component */}
        <div className="w-full">
          <AdminQuickSearch onNavigateToEntity={handleNavigateToEntity} />
        </div>

        {/* Tab Navigation buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as AdminTab);
                  if (highlightEntity && highlightEntity.tab !== tab.id) {
                    setHighlightEntity(null);
                  }
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#6f2ef7] to-[#5914e6] text-white shadow-md shadow-purple-600/25'
                    : 'bg-white dark:bg-[#151128] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-purple-50/50 dark:hover:bg-purple-900/30 border border-zinc-200 dark:border-purple-900/40 shadow-xs'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-white text-purple-700'
                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Selected Tab */}
      <div>
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'files' && <CollaborativeWorkspace currentUserName={currentAdmin} />}
        {activeTab === 'schools' && <SchoolsTab />}
        {activeTab === 'classes' && (
          <ClassesTab 
            highlightId={highlightEntity?.tab === 'classes' ? highlightEntity.id : undefined}
            onClearHighlight={handleClearHighlight}
          />
        )}
        {activeTab === 'students' && (
          <StudentsTab 
            highlightId={highlightEntity?.tab === 'students' ? highlightEntity.id : undefined}
            onClearHighlight={handleClearHighlight}
          />
        )}
        {activeTab === 'activities' && (
          <ActivitiesTab 
            highlightId={highlightEntity?.tab === 'activities' ? highlightEntity.id : undefined}
            onClearHighlight={handleClearHighlight}
          />
        )}
        {activeTab === 'grades' && <GradesTab />}
        {activeTab === 'submissions' && <SubmissionsTab />}
        {activeTab === 'certificates' && <CertificatesTab />}
        {activeTab === 'mural' && <MuralTab currentAdminName={currentAdmin} />}
        {activeTab === 'calendar' && <AcademicCalendar role="admin" />}
        {activeTab === 'admins' && <AdminsTab currentAdmin={currentAdmin} />}
        {activeTab === 'online' && <OnlineUsersTab currentAdmin={currentAdmin} />}
        {activeTab === 'backup' && <BackupTab />}
      </div>
    </div>
  );
};

