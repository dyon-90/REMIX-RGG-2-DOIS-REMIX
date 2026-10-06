/**
 * Serviço de Backup Automático em Background, Pontos de Restauração e Logs do Sistema
 * 
 * PERSISTÊNCIA 100% API REST PHP & MYSQL HOSTINGER:
 * Todos os pontos de restauração e logs de auditoria são transmitidos exclusivamente
 * via HTTPS e JSON para o servidor MySQL da Hostinger (/api/configuracoes/).
 * NENHUM dado de backup é mantido em localStorage, sessionStorage ou IndexedDB.
 */

import { AppData, RestorePoint, RestorePointMetrics, SystemLog, LogActionType, LogEntityType } from '../types';
import { sanitizeAppData } from '../utils/storage';
import { api } from './api';

/**
 * Calcula o consolidado de métricas para um snapshot de AppData.
 */
export function calculateMetrics(data: Partial<AppData>): RestorePointMetrics {
  const schoolsCount = data.schools?.length || 0;
  const classesCount = data.classes?.length || 0;
  const studentsCount = data.students?.length || 0;
  const activitiesCount = data.activities?.length || 0;
  const gradesCount = data.grades?.length || 0;
  const postsCount = data.posts?.length || 0;
  const eventsCount = data.events?.length || 0;
  const adminsCount = data.admins?.length || 0;
  const filesCount = data.collaborative_files?.length || 0;

  const totalEntities =
    schoolsCount +
    classesCount +
    studentsCount +
    activitiesCount +
    gradesCount +
    postsCount +
    eventsCount +
    adminsCount +
    filesCount;

  return {
    schoolsCount,
    classesCount,
    studentsCount,
    activitiesCount,
    gradesCount,
    postsCount,
    eventsCount,
    adminsCount,
    filesCount,
    totalEntities
  };
}

/**
 * Gera uma descrição humanizada amigável para o gatilho da alteração.
 */
export function buildTriggerReason(params: {
  actionType: LogActionType;
  entityType: LogEntityType;
  entityTitle: string;
  authorName: string;
  authorRole: 'admin' | 'student' | 'system';
}): string {
  const roleLabel = params.authorRole === 'student' ? 'Aluno' : params.authorRole === 'admin' ? 'Admin' : 'Sistema';
  const actionVerbs: Record<LogActionType, string> = {
    create: 'Cadastro de',
    update: 'Atualização de',
    delete: 'Exclusão de',
    submit: 'Entrega de',
    evaluate: 'Avaliação de',
    restore: 'Restauração de',
    import: 'Importação de',
    clear: 'Reinicialização de'
  };

  const entityLabels: Record<LogEntityType, string> = {
    school: 'escola',
    class: 'turma',
    student: 'aluno',
    activity: 'atividade',
    grade: 'nota/entrega',
    post: 'publicação no mural',
    event: 'evento escolar',
    admin: 'administrador',
    file: 'documento colaborativo',
    backup: 'backup',
    system: 'sistema'
  };

  const verb = actionVerbs[params.actionType] || 'Alteração em';
  const entity = entityLabels[params.entityType] || params.entityType;

  return `${verb} ${entity} "${params.entityTitle}" por ${params.authorName} (${roleLabel})`;
}

// Cache em memória compartilhado
let memoryRestorePoints: RestorePoint[] = [];
let memorySystemLogs: SystemLog[] = [];
let latestAutoBackupCache: RestorePoint | null = null;

const restorePointSubscribers = new Set<(points: RestorePoint[]) => void>();
const logSubscribers = new Set<(logs: SystemLog[]) => void>();

/**
 * Grava um ponto de restauração e registra o log de auditoria no MySQL da Hostinger
 */
export async function recordAutoBackupAndLog(params: {
  actionType: LogActionType;
  entityType: LogEntityType;
  entityTitle: string;
  authorName: string;
  authorRole: 'admin' | 'student' | 'system';
  userId?: string;
  details?: string;
  updatedDataSnapshot: AppData;
  isAuto?: boolean;
  label?: string;
}): Promise<{ restorePoint: RestorePoint; log: SystemLog }> {
  const timestamp = new Date().toISOString();
  const rpId = 'rp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  const triggerReason = buildTriggerReason({
    actionType: params.actionType,
    entityType: params.entityType,
    entityTitle: params.entityTitle,
    authorName: params.authorName,
    authorRole: params.authorRole
  });

  const sanitizedSnapshot = sanitizeAppData(params.updatedDataSnapshot);
  const metrics = calculateMetrics(sanitizedSnapshot);

  const restorePoint: RestorePoint = {
    entity_id: rpId,
    timestamp,
    trigger_reason: triggerReason,
    author_name: params.authorName,
    author_role: params.authorRole,
    action_type: params.actionType,
    is_auto: params.isAuto ?? true,
    label: params.label,
    metrics,
    snapshot: sanitizedSnapshot
  };

  const log: SystemLog = {
    entity_id: logId,
    timestamp,
    action_type: params.actionType,
    entity_type: params.entityType,
    entity_title: params.entityTitle,
    user_id: params.userId || (params.authorRole === 'student' ? 'student_user' : 'admin_user'),
    user_name: params.authorName,
    user_role: params.authorRole,
    details: params.details || triggerReason,
    restore_point_id: rpId
  };

  // Atualiza cache em memória
  latestAutoBackupCache = restorePoint;
  memoryRestorePoints = [restorePoint, ...memoryRestorePoints.slice(0, 49)];
  memorySystemLogs = [log, ...memorySystemLogs.slice(0, 99)];

  restorePointSubscribers.forEach(cb => cb(memoryRestorePoints));
  logSubscribers.forEach(cb => cb(memorySystemLogs));

  // Persiste assincronamente via API REST PHP (/api/configuracoes/)
  api.saveSetting('latest_autobackup', restorePoint).catch(() => {});
  api.saveSetting('restore_points_recent', memoryRestorePoints.slice(0, 10)).catch(() => {});
  api.saveSetting('system_logs_recent', memorySystemLogs.slice(0, 20)).catch(() => {});

  return { restorePoint, log };
}

/**
 * Obtém o último autobackup gerado
 */
export async function getLatestAutoBackup(): Promise<RestorePoint | null> {
  if (latestAutoBackupCache) {
    return latestAutoBackupCache;
  }
  try {
    const saved = await api.getSetting<RestorePoint>('latest_autobackup');
    if (saved && saved.snapshot) {
      latestAutoBackupCache = saved;
      return saved;
    }
  } catch {
    // Retorna nulo se não houver
  }
  return null;
}

/**
 * Busca a lista de pontos de restauração armazenados
 */
export async function getRestorePointsList(): Promise<RestorePoint[]> {
  if (memoryRestorePoints.length > 0) {
    return memoryRestorePoints;
  }
  try {
    const list = await api.getSetting<RestorePoint[]>('restore_points_recent');
    if (Array.isArray(list)) {
      memoryRestorePoints = list;
      return list;
    }
  } catch {
    // Falha silenciosa
  }
  return memoryRestorePoints;
}

/**
 * Assina atualizações da lista de pontos de restauração
 */
export function subscribeToRestorePoints(
  onPointsChange: (points: RestorePoint[]) => void,
  limitCount: number = 40
): () => void {
  restorePointSubscribers.add(onPointsChange);
  getRestorePointsList().then(list => {
    onPointsChange(list.slice(0, limitCount));
  });
  return () => {
    restorePointSubscribers.delete(onPointsChange);
  };
}

/**
 * Busca a lista de logs do sistema
 */
export async function getSystemLogsList(): Promise<SystemLog[]> {
  if (memorySystemLogs.length > 0) {
    return memorySystemLogs;
  }
  try {
    const list = await api.getSetting<SystemLog[]>('system_logs_recent');
    if (Array.isArray(list)) {
      memorySystemLogs = list;
      return list;
    }
  } catch {
    // Falha silenciosa
  }
  return memorySystemLogs;
}

/**
 * Assina atualizações em tempo real dos logs de auditoria
 */
export function subscribeToSystemLogs(
  onLogsChange: (logs: SystemLog[]) => void,
  limitCount: number = 60
): () => void {
  logSubscribers.add(onLogsChange);
  getSystemLogsList().then(list => {
    onLogsChange(list.slice(0, limitCount));
  });
  return () => {
    logSubscribers.delete(onLogsChange);
  };
}

/**
 * Exclui um ponto de restauração
 */
export async function deleteRestorePoint(id: string): Promise<void> {
  memoryRestorePoints = memoryRestorePoints.filter(p => p.entity_id !== id);
  restorePointSubscribers.forEach(cb => cb(memoryRestorePoints));
  api.saveSetting('restore_points_recent', memoryRestorePoints.slice(0, 10)).catch(() => {});
}
