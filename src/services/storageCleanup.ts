/**
 * Módulo de Auditoria e Limpeza Rigorosa de Armazenamento Local (localStorage e sessionStorage)
 * 
 * Garante que NENHUM dado principal (alunos, notas, atividades, turmas, escolas, snapshots de backup)
 * fique retido ou seja utilizado como fonte de dados no navegador.
 * 
 * O Cloud Firestore é a ÚNICA fonte de verdade, sincronizada em tempo real via listeners `onSnapshot`.
 */

export interface StoragePurgeReport {
  purgedFromLocalStorage: string[];
  purgedFromSessionStorage: string[];
  preservedKeys: string[];
  timestamp: string;
}

// Chaves de preferência estritamente visuais que podem ser preservadas
const SAFE_PREFERENCE_KEYS = new Set<string>([
  'app_theme',              // Preferência de tema 'dark' ou 'light'
  'online_sidebar_open',    // Estado da barra lateral (aberta/fechada)
  'app_session_id',         // Token de sessão temporário para presença online (sessionStorage)
  'app_supabase_runtime_config' // Configuração opcional de conexão se o admin ativou
]);

// Lista de chaves legadas e conhecidas que armazenavam dados principais ou backups
const KNOWN_DATA_KEYS = [
  'projeto2maisdois_last_autobackup',
  'projeto2maisdois_restore_points',
  'projeto2maisdois_system_logs',
  'p2d_attendance_overrides_v1',
  'p2d_certificate_criteria_v1',
  'p2d_app_data_v1',
  'p2d_last_autobackup_v1',
  'p2d_restore_points_v1',
  'p2d_system_logs_v1',
  'app_data',
  'app_data_backup',
  'backup_data',
  'cached_students',
  'cached_grades',
  'cached_activities',
  'cached_schools',
  'cached_classes'
];

/**
 * Avalia se o conteúdo de uma chave contém dados principais ou snapshots da aplicação
 */
function containsPrincipalData(key: string, value: string): boolean {
  const lowerKey = key.toLowerCase();

  // Verifica por nomes de chaves suspeitas
  if (
    lowerKey.includes('autobackup') ||
    lowerKey.includes('restore_point') ||
    lowerKey.includes('app_data') ||
    lowerKey.includes('student') ||
    lowerKey.includes('grade') ||
    lowerKey.includes('activity') ||
    lowerKey.includes('school') ||
    lowerKey.includes('class') ||
    lowerKey.includes('attendance') ||
    lowerKey.includes('certificate_criteria')
  ) {
    return true;
  }

  // Verifica pelo conteúdo JSON interno caso armazene coleções
  if (value.startsWith('{') || value.startsWith('[')) {
    if (
      value.includes('"students"') ||
      value.includes('"grades"') ||
      value.includes('"activities"') ||
      value.includes('"schools"') ||
      value.includes('"classes"') ||
      value.includes('"snapshot"') ||
      value.includes('"matricula"') ||
      value.includes('"submissionText"')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Executa a busca exaustiva e limpeza definitiva de qualquer dado principal
 * em localStorage e sessionStorage.
 */
export function purgePrincipalDataFromStorage(): StoragePurgeReport {
  const report: StoragePurgeReport = {
    purgedFromLocalStorage: [],
    purgedFromSessionStorage: [],
    preservedKeys: [],
    timestamp: new Date().toISOString()
  };

  // 1. Limpeza em localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToCheck: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keysToCheck.push(key);
      }

      // Adiciona também chaves conhecidas mesmo que não listadas
      for (const k of KNOWN_DATA_KEYS) {
        if (!keysToCheck.includes(k) && localStorage.getItem(k) !== null) {
          keysToCheck.push(k);
        }
      }

      for (const key of keysToCheck) {
        if (SAFE_PREFERENCE_KEYS.has(key)) {
          report.preservedKeys.push(key);
          continue;
        }

        const value = localStorage.getItem(key) || '';
        if (KNOWN_DATA_KEYS.includes(key) || containsPrincipalData(key, value)) {
          localStorage.removeItem(key);
          report.purgedFromLocalStorage.push(key);
        } else {
          report.preservedKeys.push(key);
        }
      }
    } catch (err) {
      console.warn('[StorageCleanup] Erro durante auditoria de localStorage:', err);
    }
  }

  // 2. Limpeza em sessionStorage
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const sessionKeys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) sessionKeys.push(key);
      }

      for (const key of sessionKeys) {
        if (SAFE_PREFERENCE_KEYS.has(key)) {
          continue;
        }

        const value = sessionStorage.getItem(key) || '';
        if (KNOWN_DATA_KEYS.includes(key) || containsPrincipalData(key, value)) {
          sessionStorage.removeItem(key);
          report.purgedFromSessionStorage.push(key);
        }
      }
    } catch (err) {
      console.warn('[StorageCleanup] Erro durante auditoria de sessionStorage:', err);
    }
  }

  if (report.purgedFromLocalStorage.length > 0 || report.purgedFromSessionStorage.length > 0) {
    console.info(
      `[StorageCleanup] ✓ Limpeza de dados locais concluída com sucesso! ` +
      `Removidas do localStorage: [${report.purgedFromLocalStorage.join(', ')}]. ` +
      `Removidas do sessionStorage: [${report.purgedFromSessionStorage.join(', ')}]. ` +
      `A aplicação depende 100% do Cloud Firestore via onSnapshot em tempo real.`
    );
  } else {
    console.info('[StorageCleanup] ✓ Armazenamento local auditado: 100% limpo de dados principais.');
  }

  return report;
}

/**
 * Retorna status da auditoria para exibição no painel administrativo
 */
export function getStorageAuditStatus(): { isClean: boolean; localDataKeysFound: string[] } {
  const localDataKeysFound: string[] = [];

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !SAFE_PREFERENCE_KEYS.has(key)) {
          const val = localStorage.getItem(key) || '';
          if (KNOWN_DATA_KEYS.includes(key) || containsPrincipalData(key, val)) {
            localDataKeysFound.push(key);
          }
        }
      }
    } catch {
      // Ignora erro de acesso
    }
  }

  return {
    isClean: localDataKeysFound.length === 0,
    localDataKeysFound
  };
}
