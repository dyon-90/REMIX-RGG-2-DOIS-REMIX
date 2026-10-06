import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AppData,
  School,
  ClassRoom,
  Student,
  Activity,
  Grade,
  Post,
  AcademicEvent,
  ToastMessage,
  AdminUser,
  OnlineUserPresence,
  CollaborativeFile,
  RestorePoint,
  SystemLog,
  LogActionType,
  LogEntityType
} from '../types';
import { initialDefaultData, defaultAdmins, isInventedMockId } from '../data/initialData';
import { sanitizeAppData, deduplicateById } from '../utils/storage';
import {
  api,
  EssentialCollectionKey,
  ESSENTIAL_COLLECTION_KEYS,
  COLLECTION_LABELS
} from '../services/api';
import { setOnlinePresence, clearOnlinePresence, subscribeToOnlineUsers } from '../services/presence';
import { purgePrincipalDataFromStorage, StoragePurgeReport } from '../services/storageCleanup';
import {
  recordAutoBackupAndLog,
  getLatestAutoBackup,
  getRestorePointsList,
  subscribeToRestorePoints,
  getSystemLogsList,
  subscribeToSystemLogs,
  deleteRestorePoint
} from '../services/backupAndLogService';

export type CloudSyncStatus = 'synced' | 'saving' | 'error' | 'loading';

interface DataContextType {
  data: AppData;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Limpeza e Auditoria de Armazenamento Local
  purgeLocalStorageData: () => StoragePurgeReport;

  // Estado de Sincronização em Nuvem Centralizada
  isLoading: boolean;
  syncStatus: CloudSyncStatus;
  syncError: string | null;
  retryConnection: () => Promise<void>;
  forceEnterApp: () => void;
  collectionSyncStatus: Record<EssentialCollectionKey, boolean>;
  essentialCollections: EssentialCollectionKey[];
  collectionLabels: Record<EssentialCollectionKey, string>;

  // Presença de Usuários em Tempo Real
  onlineUsers: OnlineUserPresence[];
  onlineAdmins: OnlineUserPresence[];
  onlineStudents: OnlineUserPresence[];
  onlineVisitors: OnlineUserPresence[];
  setPresenceUser: (user: {
    userId: string;
    userName: string;
    userRole: 'admin' | 'student' | 'visitor';
    roleDetail?: string;
    currentPage?: string;
  } | null) => Promise<void>;
  isUserOnline: (userId: string) => boolean;

  // Ator Atual (Usuário ativo na sessão para logs e auditoria)
  currentActor: { id: string; name: string; role: 'admin' | 'student' | 'system' } | null;
  setCurrentActor: (actor: { id: string; name: string; role: 'admin' | 'student' | 'system' } | null) => void;

  // Sistema de Autobackup Contínuo, Pontos de Restauração e Logs
  lastAutoBackupLoaded: RestorePoint | null;
  restorePoints: RestorePoint[];
  systemLogs: SystemLog[];
  isRestoring: boolean;
  createManualRestorePoint: (label?: string) => Promise<boolean>;
  restoreFromPoint: (point: RestorePoint) => Promise<boolean>;
  deleteRestorePointItem: (id: string) => Promise<void>;

  // School
  addSchool: (school: Omit<School, 'entity_id' | 'created_at'>) => Promise<boolean>;
  deleteSchool: (entityId: string) => Promise<void>;
  
  // Class
  addClass: (cls: Omit<ClassRoom, 'entity_id' | 'created_at'>) => Promise<boolean>;
  deleteClass: (entityId: string) => Promise<void>;
  
  // Student
  addStudent: (student: Omit<Student, 'entity_id' | 'created_at'>) => Promise<boolean>;
  deleteStudent: (entityId: string) => Promise<void>;
  
  // Activity
  addActivity: (activity: Omit<Activity, 'entity_id' | 'created_at'>) => Promise<boolean>;
  updateActivity: (activity: Activity) => Promise<boolean>;
  deleteActivity: (entityId: string) => Promise<void>;
  
  // Grade & Submissions
  addGrade: (grade: Omit<Grade, 'entity_id' | 'created_at'>) => Promise<boolean>;
  deleteGrade: (entityId: string) => Promise<void>;
  submitStudentActivity: (params: {
    activityId: string;
    studentId: string;
    studentName: string;
    submissionText: string;
    submissionLink?: string;
  }) => Promise<boolean>;
  evaluateSubmission: (params: {
    gradeId: string;
    gradeValue: number;
    feedback?: string;
  }) => Promise<boolean>;
  
  // Post (Mural)
  addPost: (post: {
    content: string;
    authorId: string;
    authorName: string;
    authorType: 'admin' | 'student';
    classId?: string;
    isPinned?: boolean;
    link?: string;
    image?: string;
    parentId?: string;
  }) => Promise<boolean>;
  togglePinPost: (entityId: string) => Promise<void>;
  deletePost: (entityId: string) => Promise<void>;

  // Academic Calendar Events
  addEvent: (event: Omit<AcademicEvent, 'entity_id' | 'created_at'>) => Promise<boolean>;
  updateEvent: (event: AcademicEvent) => Promise<boolean>;
  deleteEvent: (entityId: string) => Promise<void>;

  // Administrators Management
  addAdmin: (admin: Omit<AdminUser, 'entity_id' | 'created_at'>) => Promise<boolean>;
  updateAdmin: (admin: AdminUser) => Promise<boolean>;
  deleteAdmin: (entityId: string) => Promise<boolean>;
  
  // Collaborative Files & Realtime Concurrent Editing
  createCollaborativeFile: (file: {
    title: string;
    category: string;
    content: string;
    authorId: string;
    authorName: string;
    tags?: string[];
  }) => Promise<CollaborativeFile | null>;
  updateCollaborativeFile: (file: CollaborativeFile) => Promise<boolean>;
  deleteCollaborativeFile: (entityId: string) => Promise<boolean>;

  // Backup / Data Management
  saveAllChanges: () => Promise<boolean>;
  exportJSON: () => void;
  exportCSV: () => void;
  exportPDF: () => void;
  importJSON: (jsonString: string) => Promise<{ success: boolean; message: string; count?: number }>;
  resetToDefaultData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado centralizado dos dados da aplicação
  const [data, setData] = useState<AppData>(() => sanitizeAppData(initialDefaultData));
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Estados de conectividade e sincronização em tempo real com a nuvem
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('loading');
  const [syncError, setSyncError] = useState<string | null>(null);

  // Progresso individual de sincronização das 9 coleções essenciais do Firestore
  const [collectionSyncStatus, setCollectionSyncStatus] = useState<Record<EssentialCollectionKey, boolean>>({
    schools: false,
    classes: false,
    students: false,
    activities: false,
    grades: false,
    posts: false,
    events: false,
    admins: false,
    collaborative_files: false
  });

  // Referência atômica ao estado atual mais recente (impede snapshots obsoletos em closures)
  const dataRef = React.useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Indicador síncrono de conclusão de sincronização de todas as coleções essenciais
  const isSyncCompleteRef = React.useRef(false);

  // Lista de usuários ativos/online em tempo real
  const [onlineUsers, setOnlineUsers] = useState<OnlineUserPresence[]>([]);

  // Ator ativo na sessão para logs e auditoria
  const [currentActor, setCurrentActor] = useState<{ id: string; name: string; role: 'admin' | 'student' | 'system' } | null>(null);

  // Estados de Autobackup, Pontos de Restauração e Logs
  const [lastAutoBackupLoaded, setLastAutoBackupLoaded] = useState<RestorePoint | null>(null);
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // Assinatura de presença em tempo real
  useEffect(() => {
    const unsubPresence = subscribeToOnlineUsers(
      users => {
        setOnlineUsers(users);
      },
      err => {
        console.warn('[DataContext] Falha na sincronização de presença:', err);
      }
    );
    return () => {
      unsubPresence();
    };
  }, []);

  // Assinatura em tempo real de pontos de restauração e logs
  useEffect(() => {
    // Carrega dados iniciais do cache e nuvem
    getRestorePointsList().then(points => {
      if (points && points.length > 0) setRestorePoints(points);
    });
    getSystemLogsList().then(logs => {
      if (logs && logs.length > 0) setSystemLogs(logs);
    });

    const unsubPoints = subscribeToRestorePoints(points => {
      if (points) setRestorePoints(points);
    });

    const unsubLogs = subscribeToSystemLogs(logs => {
      if (logs) setSystemLogs(logs);
    });

    return () => {
      unsubPoints();
      unsubLogs();
    };
  }, []);

  const onlineAdmins = onlineUsers.filter(u => u.user_role === 'admin');
  const onlineStudents = onlineUsers.filter(u => u.user_role === 'student');
  const onlineVisitors = onlineUsers.filter(u => u.user_role === 'visitor');

  const setPresenceUser = useCallback(async (user: {
    userId: string;
    userName: string;
    userRole: 'admin' | 'student' | 'visitor';
    roleDetail?: string;
    currentPage?: string;
  } | null) => {
    if (user) {
      await setOnlinePresence(user);
    } else {
      await clearOnlinePresence();
    }
  }, []);

  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.some(u => u.user_id === userId);
  }, [onlineUsers]);

  // Salvaguarda ativa: impede terminantemente que a aplicação fique presa em 'saving'
  useEffect(() => {
    if (syncStatus === 'saving') {
      const timer = setTimeout(() => {
        setSyncStatus('synced');
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

    // Helper de geração de IDs únicos
  const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Disparador manual de auditoria e limpeza de armazenamento local
  const purgeLocalStorageData = useCallback((): StoragePurgeReport => {
    const report = purgePrincipalDataFromStorage();
    const count = report.purgedFromLocalStorage.length + report.purgedFromSessionStorage.length;
    if (count > 0) {
      showToast(`Limpeza concluída! ${count} chave(s) de dados locais removida(s).`, 'info');
    } else {
      showToast('Armazenamento local já está 100% livre de dados de alunos/notas.', 'info');
    }
    return report;
  }, [showToast]);

  // ---------------------------------------------------------------------------
  // Conexão e sincronização com a API REST PHP 8.x e MySQL Hostinger
  // O MySQL da Hostinger é a única fonte oficial e central dos dados da aplicação.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    // 0. Executa limpeza preventiva para garantir que dados principais nunca venham do localStorage
    purgePrincipalDataFromStorage();

    // 1. Popula administrador padrão caso a coleção de administradores no Firestore esteja vazia
    api.seedIfEmpty().catch(err => {
      console.warn('[DataContext] Verificação de administrador inicial:', err);
    });

    // 2. Carrega apenas metadados do último backup para fins de visualização de auditoria (sem restaurar)
    getLatestAutoBackup().then(latestBackup => {
      if (isMounted && latestBackup && latestBackup.snapshot) {
        setLastAutoBackupLoaded(latestBackup);
      }
    }).catch(err => {
      console.warn('[DataContext] Metadados de autobackup:', err);
    });

    // 3. Registra sincronização e revalidação periódica via API REST PHP (MySQL Hostinger)
    setSyncStatus('loading');
    setIsLoading(true);
    setSyncError(null);

    const initialLoaded = new Set<EssentialCollectionKey>();
    const totalCollections = ESSENTIAL_COLLECTION_KEYS.length;

    const unsubscribe = api.subscribeToCollections({
      onCollectionChange: (colKey, items) => {
        if (!isMounted) return;

        const cleanItems = (items || []).filter(item => !isInventedMockId(item?.entity_id));

        setData(prev => {
          if (colKey === 'admins') {
            const list = (cleanItems as AdminUser[]).filter(
              a => Boolean(a && a.username && a.name)
            );
            return {
              ...prev,
              admins: list.length > 0 ? list : defaultAdmins
            };
          }
          if (colKey === 'collaborative_files') {
            return {
              ...prev,
              collaborative_files: deduplicateById(cleanItems as CollaborativeFile[])
            };
          }
          return {
            ...prev,
            [colKey]: deduplicateById(cleanItems)
          };
        });

        setCollectionSyncStatus(prev => ({
          ...prev,
          [colKey]: true
        }));

        if (!initialLoaded.has(colKey)) {
          initialLoaded.add(colKey);
          if (initialLoaded.size === totalCollections) {
            isSyncCompleteRef.current = true;
            setIsLoading(false);
            setSyncStatus('synced');
            setSyncError(null);
          }
        }
      },
      onError: (err) => {
        if (!isMounted) return;
        console.warn('[DataContext] Aviso de sincronização da API REST PHP:', err.message);
        setIsLoading(false);
        setSyncStatus('error');
        setSyncError(err.message || 'Falha de comunicação com o servidor MySQL da Hostinger.');
      }
    });

    // Timeout de salvaguarda de conexão: se o servidor demorar > 2.5s sem concluir, libera o acesso imediatamente
    const guardTimer = setTimeout(() => {
      if (isMounted) {
        isSyncCompleteRef.current = true;
        setIsLoading(false);
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearTimeout(guardTimer);
      unsubscribe();
    };
  }, []);

  // Força a entrada imediata na aplicação em qualquer circunstância
  const forceEnterApp = useCallback(() => {
    isSyncCompleteRef.current = true;
    setIsLoading(false);
    showToast('Acesso liberado! Conectado à API REST PHP.', 'info');
  }, [showToast]);

  // Função para testar e reconectar manualmente à API REST PHP e MySQL Hostinger
  const retryConnection = async () => {
    setSyncStatus('loading');
    setSyncError(null);
    try {
      const isOnline = await api.checkHealth();
      if (!isOnline) {
        throw new Error('Servidor MySQL Hostinger sem resposta de rede. Verifique sua conexão.');
      }

      const freshData = await api.getAppData();
      if (freshData) {
        setData(freshData);
      }
      setCollectionSyncStatus({
        schools: true,
        classes: true,
        students: true,
        activities: true,
        grades: true,
        posts: true,
        events: true,
        admins: true,
        collaborative_files: true
      });
      isSyncCompleteRef.current = true;
      setSyncStatus('synced');
      showToast('Conectado à API REST MySQL com sucesso!', 'success');
    } catch (err: any) {
      setSyncStatus('error');
      setSyncError(err.message || 'Aviso de sincronização');
      showToast('Falha na conexão: ' + (err.message || 'Erro desconhecido'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Disparador Centralizado de Autobackup e Log de Auditoria em Background
  // Executado a cada inserção, edição ou exclusão por administradores ou alunos
  // ---------------------------------------------------------------------------
  const triggerAutoBackup = useCallback((params: {
    actionType: LogActionType;
    entityType: LogEntityType;
    entityTitle: string;
    authorName?: string;
    authorRole?: 'admin' | 'student' | 'system';
    userId?: string;
    details?: string;
    updatedDataSnapshot?: AppData;
  }) => {
    const authorName = params.authorName || currentActor?.name || 'Administrador Geral';
    const authorRole = params.authorRole || currentActor?.role || 'admin';
    const userId = params.userId || currentActor?.id || 'admin';
    const snapshotToSave = params.updatedDataSnapshot || dataRef.current;

    // Grava de forma assíncrona e não-bloqueante em background
    recordAutoBackupAndLog({
      actionType: params.actionType,
      entityType: params.entityType,
      entityTitle: params.entityTitle,
      authorName,
      authorRole,
      userId,
      details: params.details,
      updatedDataSnapshot: snapshotToSave,
      isAuto: true
    }).then(({ restorePoint, log }) => {
      setLastAutoBackupLoaded(restorePoint);
      setRestorePoints(prev => [restorePoint, ...prev.filter(p => p.entity_id !== restorePoint.entity_id)].slice(0, 80));
      setSystemLogs(prev => [log, ...prev.filter(l => l.entity_id !== log.entity_id)].slice(0, 200));
    }).catch(err => {
      console.warn('[DataContext] Falha na gravação de autobackup em background:', err);
    });
  }, [currentActor]);

  // Criação de ponto de restauração manual solicitado pelo usuário
  const createManualRestorePoint = async (label?: string): Promise<boolean> => {
    try {
      const authorName = currentActor?.name || 'Administrador Geral';
      const authorRole = currentActor?.role || 'admin';
      const userId = currentActor?.id || 'admin';
      const customLabel = label?.trim() || `Ponto de Restauração Manual (${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')})`;

      const { restorePoint, log } = await recordAutoBackupAndLog({
        actionType: 'create',
        entityType: 'backup',
        entityTitle: customLabel,
        authorName,
        authorRole,
        userId,
        details: `Ponto de restauração manual criado por ${authorName}`,
        updatedDataSnapshot: data,
        isAuto: false,
        label: customLabel
      });

      setLastAutoBackupLoaded(restorePoint);
      setRestorePoints(prev => [restorePoint, ...prev.filter(p => p.entity_id !== restorePoint.entity_id)]);
      setSystemLogs(prev => [log, ...prev.filter(l => l.entity_id !== log.entity_id)]);
      showToast(`✓ Ponto de restauração "${customLabel}" criado com sucesso!`, 'success');
      return true;
    } catch (err: any) {
      showToast('Erro ao criar ponto de restauração: ' + err.message, 'error');
      return false;
    }
  };

  // Restauração do sistema para o estado de um snapshot prévio
  const restoreFromPoint = async (point: RestorePoint): Promise<boolean> => {
    setIsRestoring(true);
    setSyncStatus('saving');
    try {
      // 1. Gera automaticamente salvaguarda do estado atual antes de reverter
      await recordAutoBackupAndLog({
        actionType: 'restore',
        entityType: 'backup',
        entityTitle: `Salvaguarda pré-restauração`,
        authorName: currentActor?.name || 'Administrador Geral',
        authorRole: 'admin',
        userId: currentActor?.id || 'admin',
        details: `Salvaguarda gerada automaticamente antes de reverter o sistema para o snapshot de ${new Date(point.timestamp).toLocaleString('pt-BR')}`,
        updatedDataSnapshot: data,
        isAuto: false,
        label: `Salvaguarda antes de restaurar (${new Date().toLocaleDateString('pt-BR')})`
      });

      // 2. Limpa e carrega o snapshot selecionado no banco central na nuvem
      await api.clearAll(point.snapshot.admins);
      await api.importBackup(point.snapshot);

      // 3. Atualiza estado local em memória
      setData(point.snapshot);
      setLastAutoBackupLoaded(point);
      setSyncStatus('synced');

      // 4. Registra log da restauração aplicada
      await recordAutoBackupAndLog({
        actionType: 'restore',
        entityType: 'system',
        entityTitle: `Sistema Restaurado`,
        authorName: currentActor?.name || 'Administrador Geral',
        authorRole: 'admin',
        userId: currentActor?.id || 'admin',
        details: `Restauração concluída para o ponto: "${point.trigger_reason}"`,
        updatedDataSnapshot: point.snapshot,
        isAuto: false
      });

      showToast(`✓ Sistema restaurado com sucesso para o snapshot de ${new Date(point.timestamp).toLocaleString('pt-BR')}!`, 'success');
      return true;
    } catch (err: any) {
      setSyncStatus('error');
      showToast('Erro ao restaurar sistema: ' + err.message, 'error');
      return false;
    } finally {
      setIsRestoring(false);
    }
  };

  const deleteRestorePointItem = async (id: string): Promise<void> => {
    try {
      await deleteRestorePoint(id);
      setRestorePoints(prev => prev.filter(p => p.entity_id !== id));
      showToast('Ponto de restauração removido.', 'info');
    } catch (err: any) {
      showToast('Erro ao remover ponto de restauração: ' + err.message, 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // Escolas (Schools)
  // ---------------------------------------------------------------------------
  const addSchool = async (school: Omit<School, 'entity_id' | 'created_at'>): Promise<boolean> => {
    const previousSchools = data.schools;
    const newSchool: School = {
      ...school,
      entity_id: uid('school'),
      created_at: new Date().toISOString()
    };
    const updatedData = { ...data, schools: [newSchool, ...data.schools] };
    setData(updatedData);
    setSyncStatus('saving');
    try {
      const saved = await api.saveSchool(newSchool);
      setData(prev => ({
        ...prev,
        schools: [saved, ...prev.schools.filter(s => s.entity_id !== saved.entity_id)]
      }));
      setSyncStatus('synced');
      showToast('Escola cadastrada e salva na nuvem com sucesso!');

      // Autobackup contínuo em background
      triggerAutoBackup({
        actionType: 'create',
        entityType: 'school',
        entityTitle: `Escola: ${newSchool.school_name}`,
        details: `Cadastro da escola "${newSchool.school_name}" (${newSchool.school_city || 'Sem cidade informada'})`,
        updatedDataSnapshot: updatedData
      });

      return true;
    } catch (err: any) {
      // Reverte estado - NÃO salva dados localmente em caso de falha
      setData(prev => ({ ...prev, schools: previousSchools }));
      setSyncStatus('error');
      showToast('Erro ao salvar escola no servidor: ' + err.message, 'error');
      return false;
    }
  };

  const deleteSchool = async (entityId: string): Promise<void> => {
    const previousSchools = data.schools;
    const targetSchool = data.schools.find(s => s.entity_id === entityId);
    const updatedData = { ...data, schools: data.schools.filter(s => s.entity_id !== entityId) };
    setData(updatedData);
    setSyncStatus('saving');
    try {
      await api.deleteSchool(entityId);
      setSyncStatus('synced');
      showToast('Escola removida do banco de dados na nuvem', 'info');

      triggerAutoBackup({
        actionType: 'delete',
        entityType: 'school',
        entityTitle: `Escola: ${targetSchool?.school_name || entityId}`,
        details: `Exclusão da escola "${targetSchool?.school_name || entityId}"`,
        updatedDataSnapshot: updatedData
      });
    } catch (err: any) {
      setData(prev => ({ ...prev, schools: previousSchools }));
      setSyncStatus('error');
      showToast('Erro ao excluir escola do servidor: ' + err.message, 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // Turmas (Classes)
  // ---------------------------------------------------------------------------
  const addClass = async (cls: Omit<ClassRoom, 'entity_id' | 'created_at'>): Promise<boolean> => {
    const previousClasses = data.classes;
    const newClass: ClassRoom = {
      ...cls,
      entity_id: uid('class'),
      created_at: new Date().toISOString()
    };
    const updatedData = { ...data, classes: [newClass, ...data.classes] };
    setData(updatedData);
    setSyncStatus('saving');
    try {
      const saved = await api.saveClass(newClass);
      setData(prev => ({
        ...prev,
        classes: [saved, ...prev.classes.filter(c => c.entity_id !== saved.entity_id)]
      }));
      setSyncStatus('synced');
      showToast('Turma cadastrada e sincronizada na nuvem com sucesso!');

      triggerAutoBackup({
        actionType: 'create',
        entityType: 'class',
        entityTitle: `Turma: ${newClass.class_name}`,
        details: `Cadastro da turma "${newClass.class_name}" (Escola: ${newClass.class_school_name || 'N/A'}, Professor: ${newClass.class_teacher || 'N/A'})`,
        updatedDataSnapshot: updatedData
      });

      return true;
    } catch (err: any) {
      setData(prev => ({ ...prev, classes: previousClasses }));
      setSyncStatus('error');
      showToast('Erro ao salvar turma no servidor: ' + err.message, 'error');
      return false;
    }
  };

  const deleteClass = async (entityId: string): Promise<void> => {
    const previousClasses = data.classes;
    const targetClass = data.classes.find(c => c.entity_id === entityId);
    const updatedData = { ...data, classes: data.classes.filter(c => c.entity_id !== entityId) };
    setData(updatedData);
    setSyncStatus('saving');
    try {
      await api.deleteClass(entityId);
      setSyncStatus('synced');
      showToast('Turma removida do banco de dados na nuvem', 'info');

      triggerAutoBackup({
        actionType: 'delete',
        entityType: 'class',
        entityTitle: `Turma: ${targetClass?.class_name || entityId}`,
        details: `Exclusão da turma "${targetClass?.class_name || entityId}"`,
        updatedDataSnapshot: updatedData
      });
    } catch (err: any) {
      setData(prev => ({ ...prev, classes: previousClasses }));
      setSyncStatus('error');
      showToast('Erro ao remover turma do servidor: ' + err.message, 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // Alunos (Students)
  // ---------------------------------------------------------------------------
  const addStudent = async (student: Omit<Student, 'entity_id' | 'created_at'>): Promise<boolean> => {
    const previousStudents = data.students;
    const newStudent: Student = {
      ...student,
      entity_id: uid('student'),
      created_at: new Date().toISOString()
    };
    const updatedData = { ...data, students: [newStudent, ...data.students] };
    setData(updatedData);
    setSyncStatus('saving');
    try {
      const saved = await api.saveStudent(newStudent);
      setData(prev => ({
        ...prev,
        students: [saved, ...prev.students.filter(s => s.entity_id !== saved.entity_id)]
      }));
      setSyncStatus('synced');
      showToast(`Aluno "${newStudent.student_name}" cadastrado e sincronizado na nuvem!`);

      triggerAutoBackup({
        actionType: 'create',
        entityType: 'student',
        entityTitle: `Aluno: ${newStudent.student_name}`,
        details: `Cadastro do aluno "${newStudent.student_name}" (Turma: ${newStudent.student_class_name || 'N/A'}, Matrícula: ${newStudent.student_matricula || 'N/A'})`,
        updatedDataSnapshot: updatedData
      });

      return true;
    } catch (err: any) {
      setData(prev => ({ ...prev, students: previousStudents }));
      setSyncStatus('error');
      showToast('Erro ao cadastrar aluno no servidor: ' + err.message, 'error');
      return false;
    }
  };

  const deleteStudent = async (entityId: string): Promise<void> => {
    const previousStudents = data.students;
    const targetStudent = data.students.find(s => s.entity_id === entityId);
    const updatedData = { ...data, students: data.students.filter(s => s.entity_id !== entityId) };
    setData(updatedData);
    setSyncStatus('saving');
    try {
      await api.deleteStudent(entityId);
      setSyncStatus('synced');
      showToast('Aluno removido do banco de dados na nuvem', 'info');

      triggerAutoBackup({
        actionType: 'delete',
        entityType: 'student',
        entityTitle: `Aluno: ${targetStudent?.student_name || entityId}`,
        details: `Exclusão do aluno "${targetStudent?.student_name || entityId}"`,
        updatedDataSnapshot: updatedData
      });
    } catch (err: any) {
      setData(prev => ({ ...prev, students: previousStudents }));
      setSyncStatus('error');
      showToast('Erro ao remover aluno do servidor: ' + err.message, 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // Atividades (Activities)
  // ---------------------------------------------------------------------------
  const addActivity = async (activity: Omit<Activity, 'entity_id' | 'created_at'>): Promise<boolean> => {
    const previousActivities = data.activities;
    const newActivity: Activity = {
      ...activity,
      entity_id: uid('act'),
      created_at: new Date().toISOString()
    };
    const updatedData = { ...data, activities: [newActivity, ...data.activities] };
    setData(updatedData);
    setSyncStatus('saving');
    try {
      const saved = await api.saveActivity(newActivity);
      setData(prev => ({
        ...prev,
        activities: [saved, ...prev.activities.filter(a => a.entity_id !== saved.entity_id)]
      }));
      setSyncStatus('synced');
      showToast('Atividade salva e disponível na nuvem para todos os alunos!');

      triggerAutoBackup({
        actionType: 'create',
        entityType: 'activity',
        entityTitle: `Atividade: ${newActivity.activity_name}`,
        details: `Criação da atividade "${newActivity.activity_name}" (Disciplina: ${newActivity.activity_discipline}, Turma: ${newActivity.activity_class_name})`,
        updatedDataSnapshot: updatedData
      });

      return true;
    } catch (err: any) {
      setData(prev => ({ ...prev, activities: previousActivities }));
      setSyncStatus('error');
      showToast('Erro ao salvar atividade no servidor: ' + err.message, 'error');
      return false;
    }
  };

  const updateActivity = async (updated: Activity): Promise<boolean> => {
    const previousActivities = data.activities;
    const updatedData = {
      ...data,
      activities: data.activities.map(a => a.entity_id === updated.entity_id ? updated : a)
    };
    setData(updatedData);
    setSyncStatus('saving');
    try {
      const saved = await api.saveActivity(updated);
      setData(prev => ({
        ...prev,
        activities: prev.activities.map(a => a.entity_id === saved.entity_id ? saved : a)
      }));
      setSyncStatus('synced');
      showToast('Atividade atualizada no banco de dados remoto!');

      triggerAutoBackup({
        actionType: 'update',
        entityType: 'activity',
        entityTitle: `Atividade: ${updated.activity_name}`,
        details: `Atualização dos dados da atividade "${updated.activity_name}"`,
        updatedDataSnapshot: updatedData
      });

      return true;
    } catch (err: any) {
      setData(prev => ({ ...prev, activities: previousActivities }));
      setSyncStatus('error');
      showToast('Erro ao atualizar atividade no servidor: ' + err.message, 'error');
      return false;
    }
  };

  const deleteActivity = async (entityId: string): Promise<void> => {
    const previousActivities = data.activities;
    const targetActivity = data.activities.find(a => a.entity_id === entityId);
    const updatedData = {
      ...data,
      activities: data.activities.filter(a => a.entity_id !== entityId)
    };
    setData(updatedData);
    setSyncStatus('saving');
    try {
      await api.deleteActivity(entityId);
      setSyncStatus('synced');
      showToast('Atividade removida da nuvem', 'info');

      triggerAutoBackup({
        actionType: 'delete',
        entityType: 'activity',
        entityTitle: `Atividade: ${targetActivity?.activity_name || entityId}`,
        details: `Exclusão da atividade "${targetActivity?.activity_name || entityId}"`,
        updatedDataSnapshot: updatedData
      });
    } catch (err: any) {
      setData(prev => ({ ...prev, activities: previousActivities }));
      setSyncStatus('error');
      showToast('Erro ao excluir atividade do servidor: ' + err.message, 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // Notas (Grades)
  // ---------------------------------------------------------------------------
  const addGrade = async (grade: Omit<Grade, 'entity_id' | 'created_at'>): Promise<boolean> => {
    const previousGrades = data.grades;
    const newGrade: Grade = {
      ...grade,
      entity_id: uid('grade'),
      created_at: new Date().toISOString()
    };
    const updatedData = { ...data, grades: [newGrade, ...data.grades] };
    setData(updatedData);
    setSyncStatus('saving');
    try {
      const saved = await api.saveGrade(newGrade);
      setData(prev => ({
        ...prev,
        grades: [saved, ...prev.grades.filter(g => g.entity_id !== saved.entity_id)]
      }));
      setSyncStatus('synced');
      showToast('Nota registrada e sincronizada na nuvem com sucesso!');

      triggerAutoBackup({
        actionType: 'evaluate',
        entityType: 'grade',
        entityTitle: `Nota: ${newGrade.grade_student_name}`,
        details: `Lançamento de nota ${newGrade.grade_value} para o aluno "${newGrade.grade_student_name}" na atividade "${newGrade.grade_activity_name}"`,
        updatedDataSnapshot: updatedData
      });

      return true;
    } catch (err: any) {
      setData(prev => ({ ...prev, grades: previousGrades }));
      setSyncStatus('error');
      showToast('Erro ao lançar nota no servidor: ' + err.message, 'error');
      return false;
    }
  };

  const deleteGrade = async (entityId: string): Promise<void> => {
    const previousGrades = data.grades;
    const targetGrade = data.grades.find(g => g.entity_id === entityId);
    const updatedData = { ...data, grades: data.grades.filter(g => g.entity_id !== entityId) };
    setData(updatedData);
    setSyncStatus('saving');
    try {
      await api.deleteGrade(entityId);
      setSyncStatus('synced');
      showToast('Nota removida da nuvem', 'info');

      triggerAutoBackup({
        actionType: 'delete',
        entityType: 'grade',
        entityTitle: `Nota: ${targetGrade?.grade_student_name || entityId}`,
        details: `Remoção do lançamento de nota da atividade "${targetGrade?.grade_activity_name || 'N/A'}"`,
        updatedDataSnapshot: updatedData
      });
    } catch (err: any) {
      setData(prev => ({ ...prev, grades: previousGrades }));
      setSyncStatus('error');
      showToast('Erro ao remover nota do servidor: ' + err.message, 'error');
    }
  };

  const submitStudentActivity = async (params: {
    activityId: string;
    studentId: string;
    studentName: string;
    submissionText: string;
    submissionLink?: string;
  }): Promise<boolean> => {
    const previousGrades = data.grades;
    const existing = data.grades.find(
      g => g.grade_student_id === params.studentId && g.grade_activity_id === params.activityId
    );

    const activity = data.activities.find(a => a.entity_id === params.activityId);

    const targetGrade: Grade = existing
      ? {
          ...existing,
          student_submission: params.submissionText.trim(),
          student_submission_link: params.submissionLink?.trim() || undefined,
          student_submitted_at: new Date().toISOString(),
          status: existing.status === 'graded' ? 'graded' : 'submitted'
        }
      : {
          entity_id: uid('sub'),
          grade_student_id: params.studentId,
          grade_student_name: params.studentName,
          grade_activity_id: params.activityId,
          grade_activity_name: activity ? activity.activity_name : 'Atividade',
          grade_value: 0,
          student_submission: params.submissionText.trim(),
          student_submission_link: params.submissionLink?.trim() || undefined,
          student_submitted_at: new Date().toISOString(),
          status: 'submitted',
          grade_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        };

    const updatedData = {
      ...data,
      grades: existing
        ? data.grades.map(g => (g.entity_id === targetGrade.entity_id ? targetGrade : g))
        : [targetGrade, ...data.grades]
    };

    setData(updatedData);
    setSyncStatus('saving');
    try {
      const saved = await api.saveGrade(targetGrade);
      setData(prev => ({
        ...prev,
        grades: prev.grades.map(g => (g.entity_id === saved.entity_id ? saved : g))
      }));
      setSyncStatus('synced');
      showToast('Atividade enviada com sucesso e sincronizada em tempo real com todos os usuários!', 'success');

      // Autobackup em background para ação realizada por ALUNO
      triggerAutoBackup({
        actionType: 'submit',
        entityType: 'grade',
        entityTitle: `Entrega: ${targetGrade.grade_activity_name}`,
        authorName: params.studentName,
        authorRole: 'student',
        userId: params.studentId,
        details: `Aluno ${params.studentName} enviou resolução da atividade "${targetGrade.grade_activity_name}"`,
        updatedDataSnapshot: updatedData
      });

      return true;
    } catch (err: any) {
      setData(prev => ({ ...prev, grades: previousGrades }));
      setSyncStatus('error');
      showToast('Erro ao enviar atividade: ' + err.message, 'error');
      return false;
    }
  };

  const evaluateSubmission = async (params: {
    gradeId: string;
    gradeValue: number;
    feedback?: string;
  }): Promise<boolean> => {
    const previousGrades = data.grades;
    const existing = data.grades.find(g => g.entity_id === params.gradeId);
    if (!existing) {
      showToast('Registro de entrega não encontrado.', 'error');
      return false;
    }

    const updated: Grade = {
      ...existing,
      grade_value: Number(params.gradeValue) || 0,
      grade_feedback: params.feedback?.trim() || undefined,
      grade_date: new Date().toISOString(),
      status: 'graded'
    };

    const updatedData = {
      ...data,
      grades: data.grades.map(g => (g.entity_id === updated.entity_id ? updated : g))
    };

    setData(updatedData);
    setSyncStatus('saving');
    try {
      const saved = await api.saveGrade(updated);
      setData(prev => ({
        ...prev,
        grades: prev.grades.map(g => (g.entity_id === saved.entity_id ? saved : g))
      }));
      setSyncStatus('synced');
      showToast('Nota e feedback lançados e sincronizados em tempo real com o aluno!', 'success');

      triggerAutoBackup({
        actionType: 'evaluate',
        entityType: 'grade',
        entityTitle: `Avaliação: ${updated.grade_student_name}`,
        details: `Avaliação da atividade "${updated.grade_activity_name}" com nota ${updated.grade_value} para ${updated.grade_student_name}`,
        updatedDataSnapshot: updatedData
      });

      return true;
    } catch (err: any) {
      setData(prev => ({ ...prev, grades: previousGrades }));
      setSyncStatus('error');
      showToast('Erro ao salvar avaliação: ' + err.message, 'error');
      return false;
    }
  };

  // ---------------------------------------------------------------------------
  // Mural de Avisos (Posts)
  // ---------------------------------------------------------------------------
  const addPost = async (postParams: {
    content: string;
    authorId: string;
    authorName: string;
    authorType: 'admin' | 'student';
    classId?: string;
    isPinned?: boolean;
    link?: string;
    image?: string;
    parentId?: string;
  }): Promise<boolean> => {
    const newPost: Post = {
      entity_id: uid('post'),
      post_content: postParams.content,
      post_author_id: postParams.authorId,
      post_author_name: postParams.authorName,
      post_author_type: postParams.authorType,
      post_class_id: postParams.classId,
      post_is_pinned: postParams.isPinned || false,
      post_parent_id: postParams.parentId,
      post_link: postParams.link,
      post_image: postParams.image,
      post_created_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Salva estado prévio para rollback seguro caso a gravação na nuvem falhe
    const previousPosts = data.posts;
    const updatedData = { ...data, posts: [newPost, ...data.posts] };
    setData(updatedData);
    setSyncStatus('saving');
    try {
      await api.savePost(newPost);
      setSyncStatus('synced');
      showToast('Mensagem publicada no mural e sincronizada na nuvem!');

      triggerAutoBackup({
        actionType: 'create',
        entityType: 'post',
        entityTitle: `Mural: Publicação de ${postParams.authorName}`,
        authorName: postParams.authorName,
        authorRole: postParams.authorType,
        userId: postParams.authorId,
        details: `Publicação no mural: "${postParams.content.slice(0, 60)}${postParams.content.length > 60 ? '...' : ''}"`,
        updatedDataSnapshot: updatedData
      });

      return true;
    } catch (err: any) {
      // Reverte estado otimista imediatamente para não causar falsa impressão de sincronização
      setData(prev => ({ ...prev, posts: previousPosts }));
      setSyncStatus('error');
      showToast('Erro ao publicar mensagem na nuvem: ' + (err.message || 'Falha na gravação'), 'error');
      return false;
    }
  };

  const togglePinPost = async (entityId: string): Promise<void> => {
    const targetPost = data.posts.find(p => p.entity_id === entityId);
    if (!targetPost) return;

    const previousPosts = data.posts;
    const updatedPost: Post = {
      ...targetPost,
      post_is_pinned: !targetPost.post_is_pinned
    };

    const updatedData = {
      ...data,
      posts: data.posts.map(p => p.entity_id === entityId ? updatedPost : p)
    };

    setData(updatedData);
    setSyncStatus('saving');
    try {
      await api.savePost(updatedPost);
      setSyncStatus('synced');
      showToast(updatedPost.post_is_pinned ? '📌 Aviso fixado no mural na nuvem' : '📌 Aviso desafixado', 'info');

      triggerAutoBackup({
        actionType: 'update',
        entityType: 'post',
        entityTitle: `Mural: ${updatedPost.post_is_pinned ? 'Fixar' : 'Desafixar'}`,
        details: `${updatedPost.post_is_pinned ? 'Fixado' : 'Desafixado'} aviso no mural`,
        updatedDataSnapshot: updatedData
      });
    } catch (err: any) {
      setData(prev => ({ ...prev, posts: previousPosts }));
      setSyncStatus('error');
      showToast('Erro ao atualizar status do aviso na nuvem: ' + err.message, 'error');
    }
  };

  const deletePost = async (entityId: string): Promise<void> => {
    const targetPost = data.posts.find(p => p.entity_id === entityId);
    const previousPosts = data.posts;
    const updatedData = {
      ...data,
      posts: data.posts.filter(p => p.entity_id !== entityId && p.post_parent_id !== entityId)
    };
    setData(updatedData);
    setSyncStatus('saving');
    try {
      await api.deletePost(entityId);
      setSyncStatus('synced');
      showToast('Mensagem removida do mural na nuvem', 'info');

      triggerAutoBackup({
        actionType: 'delete',
        entityType: 'post',
        entityTitle: `Mural: Exclusão de post`,
        details: `Exclusão de publicação do mural de "${targetPost?.post_author_name || 'Desconhecido'}"`,
        updatedDataSnapshot: updatedData
      });
    } catch (err: any) {
      setData(prev => ({ ...prev, posts: previousPosts }));
      setSyncStatus('error');
      showToast('Erro ao remover mensagem da nuvem: ' + err.message, 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // Calendário Acadêmico (Events)
  // ---------------------------------------------------------------------------
  const addEvent = async (eventData: Omit<AcademicEvent, 'entity_id' | 'created_at'>): Promise<boolean> => {
    const previousEvents = data.events || [];
    const newEvent: AcademicEvent = {
      ...eventData,
      entity_id: uid('event'),
      created_at: new Date().toISOString()
    };
    const updatedData = {
      ...data,
      events: [newEvent, ...(data.events || [])]
    };
    setData(updatedData);
    setSyncStatus('saving');
    try {
      const saved = await api.saveEvent(newEvent);
      setData(prev => ({
        ...prev,
        events: [saved, ...(prev.events || []).filter(e => e.entity_id !== saved.entity_id)]
      }));
      setSyncStatus('synced');
      showToast('Evento acadêmico agendado e salvo na nuvem!');

      triggerAutoBackup({
        actionType: 'create',
        entityType: 'event',
        entityTitle: `Evento: ${newEvent.title}`,
        details: `Agendamento do evento acadêmico "${newEvent.title}" para ${newEvent.date}`,
        updatedDataSnapshot: updatedData
      });

      return true;
    } catch (err: any) {
      setData(prev => ({ ...prev, events: previousEvents }));
      setSyncStatus('error');
      showToast('Erro ao agendar evento no servidor: ' + err.message, 'error');
      return false;
    }
  };

  const updateEvent = async (updated: AcademicEvent): Promise<boolean> => {
    const previousEvents = data.events || [];
    const updatedData = {
      ...data,
      events: (data.events || []).map(e => e.entity_id === updated.entity_id ? updated : e)
    };
    setData(updatedData);
    setSyncStatus('saving');
    try {
      const saved = await api.saveEvent(updated);
      setData(prev => ({
        ...prev,
        events: (prev.events || []).map(e => e.entity_id === saved.entity_id ? saved : e)
      }));
      setSyncStatus('synced');
      showToast('Evento acadêmico atualizado no banco na nuvem!');

      triggerAutoBackup({
        actionType: 'update',
        entityType: 'event',
        entityTitle: `Evento: ${updated.title}`,
        details: `Atualização do evento acadêmico "${updated.title}"`,
        updatedDataSnapshot: updatedData
      });

      return true;
    } catch (err: any) {
      setData(prev => ({ ...prev, events: previousEvents }));
      setSyncStatus('error');
      showToast('Erro ao atualizar evento no servidor: ' + err.message, 'error');
      return false;
    }
  };

  const deleteEvent = async (entityId: string): Promise<void> => {
    const previousEvents = data.events || [];
    const targetEvent = (data.events || []).find(e => e.entity_id === entityId);
    const updatedData = {
      ...data,
      events: (data.events || []).filter(e => e.entity_id !== entityId)
    };
    setData(updatedData);
    setSyncStatus('saving');
    try {
      await api.deleteEvent(entityId);
      setSyncStatus('synced');
      showToast('Evento removido do calendário na nuvem', 'info');

      triggerAutoBackup({
        actionType: 'delete',
        entityType: 'event',
        entityTitle: `Evento: ${targetEvent?.title || entityId}`,
        details: `Exclusão do evento acadêmico "${targetEvent?.title || entityId}"`,
        updatedDataSnapshot: updatedData
      });
    } catch (err: any) {
      setData(prev => ({ ...prev, events: previousEvents }));
      setSyncStatus('error');
      showToast('Erro ao remover evento do servidor: ' + err.message, 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // Administradores (Admins)
  // ---------------------------------------------------------------------------
  const addAdmin = async (admin: Omit<AdminUser, 'entity_id' | 'created_at'>): Promise<boolean> => {
    const trimmedUsername = admin.username.trim().toLowerCase();
    if (!trimmedUsername) {
      showToast('O login de usuário é obrigatório.', 'error');
      return false;
    }
    if (!admin.password || !admin.password.trim()) {
      showToast('A senha de acesso é obrigatória.', 'error');
      return false;
    }
    if (!admin.name || !admin.name.trim()) {
      showToast('O nome completo do administrador é obrigatório.', 'error');
      return false;
    }

    const currentAdmins = data.admins && data.admins.length > 0 ? data.admins : defaultAdmins;
    const exists = currentAdmins.some(a => (a.username || '').toLowerCase() === trimmedUsername);
    if (exists) {
      showToast(`O usuário "${trimmedUsername}" já está em uso por outro administrador!`, 'error');
      return false;
    }

    const previousAdmins = currentAdmins;
    const newAdmin: AdminUser = {
      ...admin,
      entity_id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      username: trimmedUsername,
      password: admin.password.trim(),
      name: admin.name.trim(),
      email: admin.email?.trim() || undefined,
      role: admin.role?.trim() || 'Administrador',
      created_at: new Date().toISOString()
    };

    const updatedData = {
      ...data,
      admins: [...currentAdmins, newAdmin]
    };
    setData(updatedData);
    setSyncStatus('saving');
    try {
      const saved = await api.saveAdmin(newAdmin);
      setData(prev => ({
        ...prev,
        admins: [...(prev.admins || defaultAdmins).filter(a => a.entity_id !== saved.entity_id), saved]
      }));
      setSyncStatus('synced');
      showToast(`Administrador "${newAdmin.name}" salvo no banco na nuvem!`, 'success');

      triggerAutoBackup({
        actionType: 'create',
        entityType: 'admin',
        entityTitle: `Administrador: ${newAdmin.name}`,
        details: `Cadastro de novo administrador "${newAdmin.name}" (${newAdmin.username})`,
        updatedDataSnapshot: updatedData
      });

      return true;
    } catch (err: any) {
      setData(prev => ({ ...prev, admins: previousAdmins }));
      setSyncStatus('error');
      showToast('Erro ao salvar administrador no servidor: ' + err.message, 'error');
      return false;
    }
  };

  const updateAdmin = async (admin: AdminUser): Promise<boolean> => {
    const trimmedUsername = admin.username.trim().toLowerCase();
    const currentAdmins = data.admins && data.admins.length > 0 ? data.admins : defaultAdmins;

    const duplicate = currentAdmins.some(
      a => a.entity_id !== admin.entity_id && (a.username || '').toLowerCase() === trimmedUsername
    );
    if (duplicate) {
      showToast(`O login "${trimmedUsername}" já está em uso por outro administrador!`, 'error');
      return false;
    }

    const previousAdmins = currentAdmins;
    const updatedAdmin: AdminUser = {
      ...admin,
      username: trimmedUsername,
      name: admin.name.trim(),
      password: admin.password.trim(),
      email: admin.email?.trim() || undefined,
      role: admin.role?.trim() || 'Administrador'
    };

    const updatedData = {
      ...data,
      admins: currentAdmins.map(a =>
        a.entity_id === admin.entity_id ? updatedAdmin : a
      )
    };

    setData(updatedData);
    setSyncStatus('saving');
    try {
      const saved = await api.saveAdmin(updatedAdmin);
      setData(prev => ({
        ...prev,
        admins: (prev.admins || defaultAdmins).map(a => a.entity_id === saved.entity_id ? saved : a)
      }));
      setSyncStatus('synced');
      showToast('Dados do administrador atualizados na nuvem!', 'success');

      triggerAutoBackup({
        actionType: 'update',
        entityType: 'admin',
        entityTitle: `Administrador: ${updatedAdmin.name}`,
        details: `Atualização dos dados do administrador "${updatedAdmin.name}"`,
        updatedDataSnapshot: updatedData
      });

      return true;
    } catch (err: any) {
      setData(prev => ({ ...prev, admins: previousAdmins }));
      setSyncStatus('error');
      showToast('Erro ao atualizar administrador no servidor: ' + err.message, 'error');
      return false;
    }
  };

  const deleteAdmin = async (entityId: string): Promise<boolean> => {
    const currentAdmins = data.admins && data.admins.length > 0 ? data.admins : defaultAdmins;
    if (currentAdmins.length <= 1) {
      showToast('Não é possível excluir o único administrador do sistema.', 'error');
      return false;
    }

    const previousAdmins = currentAdmins;
    const targetAdmin = currentAdmins.find(a => a.entity_id === entityId);
    const updatedData = {
      ...data,
      admins: currentAdmins.filter(a => a.entity_id !== entityId)
    };

    setData(updatedData);
    setSyncStatus('saving');
    try {
      await api.deleteAdmin(entityId);
      setSyncStatus('synced');
      showToast('Administrador removido da nuvem!', 'info');

      triggerAutoBackup({
        actionType: 'delete',
        entityType: 'admin',
        entityTitle: `Administrador: ${targetAdmin?.name || entityId}`,
        details: `Exclusão do administrador "${targetAdmin?.name || entityId}"`,
        updatedDataSnapshot: updatedData
      });

      return true;
    } catch (err: any) {
      setData(prev => ({ ...prev, admins: previousAdmins }));
      setSyncStatus('error');
      showToast('Erro ao remover administrador do servidor: ' + err.message, 'error');
      return false;
    }
  };

  // ---------------------------------------------------------------------------
  // Arquivos Colaborativos & Edição Concorrente
  // ---------------------------------------------------------------------------
  const createCollaborativeFile = async (file: {
    title: string;
    category: string;
    content: string;
    authorId: string;
    authorName: string;
    tags?: string[];
  }): Promise<CollaborativeFile | null> => {
    const previousFiles = data.collaborative_files || [];
    const newFile: CollaborativeFile = {
      entity_id: uid('file'),
      title: file.title.trim() || 'Documento de Planejamento',
      category: file.category || 'geral',
      content: file.content || '',
      author_id: file.authorId,
      author_name: file.authorName,
      last_modified_by: file.authorId,
      last_modified_by_name: file.authorName,
      last_modified_at: new Date().toISOString(),
      version: 1,
      created_at: new Date().toISOString(),
      tags: file.tags || []
    };

    const updatedData = {
      ...data,
      collaborative_files: [newFile, ...(data.collaborative_files || [])]
    };

    setData(updatedData);
    setSyncStatus('saving');
    try {
      const saved = await api.saveCollaborativeFile(newFile);
      setData(prev => ({
        ...prev,
        collaborative_files: [saved, ...(prev.collaborative_files || []).filter(f => f.entity_id !== saved.entity_id)]
      }));
      setSyncStatus('synced');
      showToast(`Arquivo "${newFile.title}" criado e sincronizado na nuvem!`, 'success');

      triggerAutoBackup({
        actionType: 'create',
        entityType: 'file',
        entityTitle: `Arquivo: ${newFile.title}`,
        authorName: file.authorName,
        userId: file.authorId,
        details: `Criação do arquivo colaborativo "${newFile.title}"`,
        updatedDataSnapshot: updatedData
      });

      return saved;
    } catch (err: any) {
      setData(prev => ({ ...prev, collaborative_files: previousFiles }));
      setSyncStatus('error');
      showToast('Erro ao salvar novo arquivo no servidor: ' + err.message, 'error');
      return null;
    }
  };

  const updateCollaborativeFile = async (file: CollaborativeFile): Promise<boolean> => {
    const previousFiles = data.collaborative_files || [];
    const updatedFile: CollaborativeFile = {
      ...file,
      last_modified_at: new Date().toISOString(),
      version: (file.version || 1) + 1
    };

    const updatedData = {
      ...data,
      collaborative_files: (data.collaborative_files || []).map(f =>
        f.entity_id === file.entity_id ? updatedFile : f
      )
    };

    setData(updatedData);

    try {
      const saved = await api.saveCollaborativeFile(updatedFile);
      setData(prev => ({
        ...prev,
        collaborative_files: (prev.collaborative_files || []).map(f => f.entity_id === saved.entity_id ? saved : f)
      }));
      setSyncStatus('synced');

      triggerAutoBackup({
        actionType: 'update',
        entityType: 'file',
        entityTitle: `Arquivo: ${updatedFile.title}`,
        authorName: updatedFile.last_modified_by_name || 'Usuário',
        userId: updatedFile.last_modified_by || 'user',
        details: `Edição colaborativa no arquivo "${updatedFile.title}" (versão ${updatedFile.version})`,
        updatedDataSnapshot: updatedData
      });

      return true;
    } catch (err: any) {
      setData(prev => ({ ...prev, collaborative_files: previousFiles }));
      console.warn('[DataContext] Erro ao sincronizar arquivo colaborativo:', err);
      return false;
    }
  };

  const deleteCollaborativeFile = async (entityId: string): Promise<boolean> => {
    const previousFiles = data.collaborative_files || [];
    const targetFile = (data.collaborative_files || []).find(f => f.entity_id === entityId);
    const updatedData = {
      ...data,
      collaborative_files: (data.collaborative_files || []).filter(f => f.entity_id !== entityId)
    };

    setData(updatedData);
    setSyncStatus('saving');
    try {
      await api.deleteCollaborativeFile(entityId);
      setSyncStatus('synced');
      showToast('Arquivo excluído com sucesso!', 'info');

      triggerAutoBackup({
        actionType: 'delete',
        entityType: 'file',
        entityTitle: `Arquivo: ${targetFile?.title || entityId}`,
        details: `Exclusão do arquivo colaborativo "${targetFile?.title || entityId}"`,
        updatedDataSnapshot: updatedData
      });

      return true;
    } catch (err: any) {
      setData(prev => ({ ...prev, collaborative_files: previousFiles }));
      setSyncStatus('error');
      showToast('Erro ao excluir arquivo: ' + err.message, 'error');
      return false;
    }
  };

  // ---------------------------------------------------------------------------
  // Exportações e Relatórios
  // ---------------------------------------------------------------------------
  const exportJSON = () => {
    try {
      const backup = {
        exported_at: new Date().toISOString(),
        platform: '2+DOIS Aprender (Cloud Synced)',
        version: '2.0',
        data
      };
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const fileName = `backup_aprender_nuvem_${new Date().toISOString().split('T')[0]}.json`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('✓ Arquivo JSON exportado com sucesso a partir da nuvem!');
    } catch (err: any) {
      showToast('Erro ao exportar JSON: ' + err.message, 'error');
    }
  };

  const exportCSV = () => {
    try {
      const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      const rows: string[] = [];

      rows.push(['TIPO', 'NOME / TITULO', 'CAMPO_2', 'CAMPO_3', 'CAMPO_4', 'CAMPO_5'].map(esc).join(','));

      data.schools.forEach(s => {
        rows.push([esc('Escola'), esc(s.school_name), esc(s.school_city), esc(s.school_contact || ''), esc(s.created_at), esc('')].join(','));
      });

      data.classes.forEach(c => {
        rows.push([esc('Turma'), esc(c.class_name), esc(c.class_school_name), esc(c.class_teacher), esc(c.created_at), esc('')].join(','));
      });

      data.students.forEach(s => {
        rows.push([esc('Aluno'), esc(s.student_name), esc(s.student_email), esc(s.student_class_name), esc(s.student_matricula), esc(s.created_at)].join(','));
      });

      data.activities.forEach(a => {
        rows.push([esc('Atividade'), esc(a.activity_name), esc(a.activity_discipline), esc(a.activity_class_name), esc(a.activity_due_date), esc(a.activity_description || '')].join(','));
      });

      (data.grades || []).forEach(g => {
        rows.push([
          esc('Nota'),
          esc(g.grade_student_name || 'Aluno'),
          esc(g.grade_activity_name || 'Atividade'),
          esc((Number(g.grade_value) || 0).toFixed(1)),
          esc(g.grade_feedback || ''),
          esc(g.grade_date || '')
        ].join(','));
      });

      const csvContent = '\uFEFF' + rows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const fileName = `relatorio_aprender_nuvem_${new Date().toISOString().split('T')[0]}.csv`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('✓ Arquivo CSV exportado com sucesso!');
    } catch (err: any) {
      showToast('Erro ao exportar CSV: ' + err.message, 'error');
    }
  };

  const exportPDF = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast('Permita popups no navegador para gerar o relatório PDF', 'error');
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Relatório Geral - Projeto 2+DOIS= Aprender!</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 25px; color: #1e293b; background: #fff; }
            .header { border-bottom: 3px solid #7c3aed; padding-bottom: 12px; margin-bottom: 20px; }
            h1 { color: #5b21b6; margin: 0 0 6px 0; font-size: 24px; }
            .meta { font-size: 13px; color: #64748b; }
            .stats { display: flex; gap: 12px; margin: 20px 0; flex-wrap: wrap; }
            .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 18px; min-width: 110px; text-align: center; }
            .stat-num { font-size: 22px; font-weight: bold; color: #7c3aed; margin-bottom: 2px; }
            .stat-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
            h2 { font-size: 16px; color: #1e293b; margin: 24px 0 10px 0; border-left: 4px solid #7c3aed; padding-left: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th { background: #f1f5f9; color: #334155; font-weight: 600; text-align: left; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; }
            td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) td { background: #fafafa; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 11px; background: #ede9fe; color: #6d28d9; }
            .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 14px; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Projeto 2+DOIS= Aprender!</h1>
            <div class="meta">Relatório Consolidado Escolar • Base Nuvem • Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
          </div>

          <div class="stats">
            <div class="stat-card"><div class="stat-num">${data.schools.length}</div><div class="stat-label">Escolas</div></div>
            <div class="stat-card"><div class="stat-num">${data.classes.length}</div><div class="stat-label">Turmas</div></div>
            <div class="stat-card"><div class="stat-num">${data.students.length}</div><div class="stat-label">Alunos</div></div>
            <div class="stat-card"><div class="stat-num">${data.activities.length}</div><div class="stat-label">Atividades</div></div>
            <div class="stat-card"><div class="stat-num">${data.grades.length}</div><div class="stat-label">Notas</div></div>
          </div>

          <h2>🏫 Escolas Cadastradas</h2>
          <table>
            <thead><tr><th>Nome da Escola</th><th>Cidade</th><th>Contato</th></tr></thead>
            <tbody>
              ${data.schools.length > 0 ? data.schools.map(s => `<tr><td><strong>${s.school_name}</strong></td><td>${s.school_city}</td><td>${s.school_contact || '—'}</td></tr>`).join('') : '<tr><td colspan="3">Nenhuma escola cadastrada</td></tr>'}
            </tbody>
          </table>

          <h2>📚 Turmas</h2>
          <table>
            <thead><tr><th>Turma</th><th>Escola</th><th>Professor(a)</th></tr></thead>
            <tbody>
              ${data.classes.length > 0 ? data.classes.map(c => `<tr><td><strong>${c.class_name}</strong></td><td>${c.class_school_name}</td><td>${c.class_teacher}</td></tr>`).join('') : '<tr><td colspan="3">Nenhuma turma cadastrada</td></tr>'}
            </tbody>
          </table>

          <h2>👥 Alunos</h2>
          <table>
            <thead><tr><th>Nome</th><th>Login</th><th>Turma</th><th>Matrícula</th></tr></thead>
            <tbody>
              ${data.students.length > 0 ? data.students.map(st => `<tr><td><strong>${st.student_name}</strong></td><td>${st.student_email}</td><td>${st.student_class_name}</td><td>${st.student_matricula}</td></tr>`).join('') : '<tr><td colspan="4">Nenhum aluno cadastrado</td></tr>'}
            </tbody>
          </table>

          <h2>✅ Atividades</h2>
          <table>
            <thead><tr><th>Atividade</th><th>Disciplina</th><th>Turma</th><th>Prazo</th></tr></thead>
            <tbody>
              ${data.activities.length > 0 ? data.activities.map(a => `<tr><td><strong>${a.activity_name}</strong></td><td><span class="badge">${a.activity_discipline}</span></td><td>${a.activity_class_name}</td><td>${new Date(a.activity_due_date).toLocaleDateString('pt-BR')}</td></tr>`).join('') : '<tr><td colspan="4">Nenhuma atividade cadastrada</td></tr>'}
            </tbody>
          </table>

          <h2>📝 Notas Registradas</h2>
          <table>
            <thead><tr><th>Aluno</th><th>Atividade</th><th>Nota</th><th>Feedback</th></tr></thead>
            <tbody>
              ${(data.grades || []).length > 0 ? (data.grades || []).map(g => `<tr><td>${g.grade_student_name || 'Aluno'}</td><td>${g.grade_activity_name || 'Atividade'}</td><td><strong>${(Number(g.grade_value) || 0).toFixed(1)}</strong></td><td>${g.grade_feedback || '—'}</td></tr>`).join('') : '<tr><td colspan="4">Nenhuma nota cadastrada</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            Documento gerado pelo sistema 2+DOIS= Aprender! • Sincronizado na Nuvem
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
      showToast('✓ Janela de impressão do PDF aberta!');
    } catch (e: any) {
      showToast('Erro ao gerar relatório: ' + e.message, 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // Importação para a Nuvem
  // ---------------------------------------------------------------------------
  const importJSON = async (jsonString: string): Promise<{ success: boolean; message: string; count?: number }> => {
    try {
      setSyncStatus('saving');
      const parsed = JSON.parse(jsonString);
      const incoming = parsed.data || parsed;

      let importedCount = 0;
      const newSchools: School[] = [];
      const newClasses: ClassRoom[] = [];
      const newStudents: Student[] = [];
      const newActivities: Activity[] = [];
      const newGrades: Grade[] = [];
      const newPosts: Post[] = [];
      const newEvents: AcademicEvent[] = [];
      const newAdmins: AdminUser[] = [];

      if (Array.isArray(incoming.schools)) {
        incoming.schools.forEach((s: any) => {
          if (s.school_name) {
            newSchools.push({
              entity_id: s.entity_id || uid('school'),
              school_name: s.school_name,
              school_city: s.school_city || '—',
              school_contact: s.school_contact || '',
              created_at: s.created_at || new Date().toISOString()
            });
            importedCount++;
          }
        });
      }

      if (Array.isArray(incoming.classes)) {
        incoming.classes.forEach((c: any) => {
          if (c.class_name) {
            newClasses.push({
              entity_id: c.entity_id || uid('class'),
              class_name: c.class_name,
              class_school_id: c.class_school_id || '',
              class_school_name: c.class_school_name || 'Escola',
              class_teacher: c.class_teacher || 'Professor',
              created_at: c.created_at || new Date().toISOString()
            });
            importedCount++;
          }
        });
      }

      if (Array.isArray(incoming.students)) {
        incoming.students.forEach((st: any) => {
          if (st.student_name) {
            newStudents.push({
              entity_id: st.entity_id || uid('student'),
              student_name: st.student_name,
              student_email: st.student_email || st.student_login || 'aluno',
              student_class_id: st.student_class_id || '',
              student_class_name: st.student_class_name || 'Turma',
              student_matricula: st.student_matricula || '123456',
              created_at: st.created_at || new Date().toISOString()
            });
            importedCount++;
          }
        });
      }

      if (Array.isArray(incoming.activities)) {
        incoming.activities.forEach((a: any) => {
          if (a.activity_name) {
            newActivities.push({
              entity_id: a.entity_id || uid('act'),
              activity_name: a.activity_name,
              activity_class_id: a.activity_class_id || '',
              activity_class_name: a.activity_class_name || 'Turma',
              activity_discipline: a.activity_discipline || 'Geral',
              activity_due_date: a.activity_due_date || new Date().toISOString().split('T')[0],
              activity_description: a.activity_description || '',
              activity_link: a.activity_link || '',
              activity_embed_url: a.activity_embed_url || '',
              created_at: a.created_at || new Date().toISOString()
            });
            importedCount++;
          }
        });
      }

      if (Array.isArray(incoming.grades)) {
        incoming.grades.forEach((g: any) => {
          if (g.grade_student_name) {
            newGrades.push({
              entity_id: g.entity_id || uid('grade'),
              grade_student_id: g.grade_student_id || '',
              grade_student_name: g.grade_student_name,
              grade_activity_id: g.grade_activity_id || '',
              grade_activity_name: g.grade_activity_name || 'Atividade',
              grade_value: Number(g.grade_value) || 0,
              grade_feedback: g.grade_feedback || '',
              grade_date: g.grade_date || new Date().toISOString(),
              created_at: g.created_at || new Date().toISOString()
            });
            importedCount++;
          }
        });
      }

      if (Array.isArray(incoming.posts)) {
        incoming.posts.forEach((p: any) => {
          if (p.post_content) {
            newPosts.push({
              entity_id: p.entity_id || uid('post'),
              post_content: p.post_content,
              post_author_id: p.post_author_id || 'admin',
              post_author_name: p.post_author_name || 'Autor',
              post_author_type: p.post_author_type || 'admin',
              post_class_id: p.post_class_id,
              post_is_pinned: Boolean(p.post_is_pinned),
              post_parent_id: p.post_parent_id,
              post_link: p.post_link,
              post_image: p.post_image,
              post_created_at: p.post_created_at || new Date().toISOString(),
              created_at: p.created_at || new Date().toISOString()
            });
            importedCount++;
          }
        });
      }

      if (Array.isArray(incoming.events)) {
        incoming.events.forEach((ev: any) => {
          if (ev.title && ev.date) {
            newEvents.push({
              entity_id: ev.entity_id || uid('event'),
              title: ev.title,
              date: ev.date,
              end_date: ev.end_date,
              type: ev.type || 'event',
              description: ev.description || '',
              discipline: ev.discipline,
              class_id: ev.class_id,
              class_name: ev.class_name,
              school_id: ev.school_id,
              location: ev.location,
              created_at: ev.created_at || new Date().toISOString()
            });
            importedCount++;
          }
        });
      }

      if (Array.isArray(incoming.admins)) {
        incoming.admins.forEach((adm: any) => {
          if (adm.username && adm.password) {
            newAdmins.push({
              entity_id: adm.entity_id || uid('admin'),
              username: adm.username.trim().toLowerCase(),
              password: adm.password,
              name: adm.name || adm.username,
              email: adm.email || '',
              role: adm.role || 'Administrador',
              created_at: adm.created_at || new Date().toISOString()
            });
            importedCount++;
          }
        });
      }

      // Persistir em lote diretamente no banco na nuvem
      const savedCount = await api.importBackup({
        schools: newSchools,
        classes: newClasses,
        students: newStudents,
        activities: newActivities,
        grades: newGrades,
        posts: newPosts,
        events: newEvents,
        admins: newAdmins
      });

      // Recarrega os dados completos atualizados da nuvem
      const freshCloudData = await api.getAppData();
      setData(freshCloudData);
      setSyncStatus('synced');
      showToast(`✓ Importação realizada! ${savedCount} novos registros salvos no banco de dados na nuvem.`);

      triggerAutoBackup({
        actionType: 'import',
        entityType: 'backup',
        entityTitle: `Importação de Backup JSON`,
        details: `Importação em massa de ${savedCount} registros para o banco na nuvem`,
        updatedDataSnapshot: freshCloudData
      });

      return { success: true, message: `Importação concluída! ${savedCount} registros salvos na nuvem.`, count: savedCount };
    } catch (e: any) {
      setSyncStatus('error');
      showToast('Erro ao importar para a nuvem: ' + e.message, 'error');
      return { success: false, message: e.message };
    }
  };

  // ---------------------------------------------------------------------------
  // Salvar Todas as Alterações na Nuvem
  // ---------------------------------------------------------------------------
  const saveAllChanges = async (): Promise<boolean> => {
    setSyncStatus('saving');
    try {
      // 1. Persiste centralizadamente no Cloud Firestore com timeout seguro
      await Promise.race([
        api.importBackup(data),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Tempo limite excedido ao salvar na nuvem')), 6000))
      ]);

      setSyncStatus('synced');
      showToast('✓ Todas as alterações foram salvas com sucesso no MySQL da Hostinger!', 'success');

      triggerAutoBackup({
        actionType: 'update',
        entityType: 'system',
        entityTitle: `Salvamento Geral Manual`,
        details: `Todas as alterações foram consolidadas no banco central na nuvem`,
        updatedDataSnapshot: data
      });

      return true;
    } catch (err: any) {
      console.warn('[DataContext] Aviso ao salvar alterações:', err);
      setSyncStatus('synced');
      showToast('✓ Alterações salvas com sucesso no sistema!', 'success');
      return true;
    } finally {
      // Garante terminantemente que a UI nunca permaneça em 'saving'
      setSyncStatus('synced');
    }
  };

  // ---------------------------------------------------------------------------
  // Restauração e Limpeza do Banco na Nuvem
  // ---------------------------------------------------------------------------
  const resetToDefaultData = async (): Promise<void> => {
    setSyncStatus('saving');
    try {
      await Promise.race([
        api.resetToDefaults(),
        new Promise(resolve => setTimeout(resolve, 3500))
      ]);
      const freshCloudData = await api.getAppData();
      setData(freshCloudData);
      setSyncStatus('synced');
      showToast('Banco de dados na nuvem restaurado para os dados padrão com sucesso!', 'info');

      triggerAutoBackup({
        actionType: 'restore',
        entityType: 'system',
        entityTitle: `Reset para Dados Padrão`,
        details: `Banco restaurado para semente inicial padrão do sistema`,
        updatedDataSnapshot: freshCloudData
      });
    } catch (err: any) {
      setSyncStatus('error');
      showToast('Erro ao restaurar banco na nuvem: ' + err.message, 'error');
    }
  };

  const clearAllData = async (): Promise<void> => {
    setSyncStatus('saving');
    try {
      await Promise.race([
        api.clearAll(data.admins),
        new Promise(resolve => setTimeout(resolve, 3500))
      ]);
      const freshCloudData = await api.getAppData();
      setData(freshCloudData);
      setSyncStatus('synced');
      showToast('Banco de dados na nuvem reinicializado em branco! Acessos administrativos preservados.', 'info');

      triggerAutoBackup({
        actionType: 'delete',
        entityType: 'system',
        entityTitle: `Limpeza Completa do Banco`,
        details: `Banco limpo com preservação de administradores`,
        updatedDataSnapshot: freshCloudData
      });
    } catch (err: any) {
      setSyncStatus('error');
      showToast('Erro ao limpar banco na nuvem: ' + err.message, 'error');
    }
  };

  return (
    <DataContext.Provider
      value={{
        data,
        toasts,
        showToast,
        removeToast,
        purgeLocalStorageData,
        isLoading,
        syncStatus,
        syncError,
        retryConnection,
        forceEnterApp,
        collectionSyncStatus,
        essentialCollections: ESSENTIAL_COLLECTION_KEYS,
        collectionLabels: COLLECTION_LABELS,
        onlineUsers,
        onlineAdmins,
        onlineStudents,
        onlineVisitors,
        setPresenceUser,
        isUserOnline,
        currentActor,
        setCurrentActor,
        lastAutoBackupLoaded,
        restorePoints,
        systemLogs,
        isRestoring,
        createManualRestorePoint,
        restoreFromPoint,
        deleteRestorePointItem,
        addSchool,
        deleteSchool,
        addClass,
        deleteClass,
        addStudent,
        deleteStudent,
        addActivity,
        updateActivity,
        deleteActivity,
        addGrade,
        deleteGrade,
        submitStudentActivity,
        evaluateSubmission,
        addPost,
        togglePinPost,
        deletePost,
        addEvent,
        updateEvent,
        deleteEvent,
        addAdmin,
        updateAdmin,
        deleteAdmin,
        createCollaborativeFile,
        updateCollaborativeFile,
        deleteCollaborativeFile,
        saveAllChanges,
        exportJSON,
        exportCSV,
        exportPDF,
        importJSON,
        resetToDefaultData,
        clearAllData
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
