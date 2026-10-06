/**
 * Camada de Persistência em Banco de Dados na Nuvem (Google Cloud Firestore)
 * 
 * Centraliza e sincroniza os dados em tempo real entre todos os dispositivos,
 * garantindo o Cloud Firestore como a ÚNICA FONTE OFICIAL DA VERDADE.
 * Todos os computadores, notebooks, celulares e tablets visualizam exatamente a mesma base.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { AppData, School, ClassRoom, Student, Activity, Grade, Post, AcademicEvent, AdminUser, CollaborativeFile } from '../types';
import { defaultAdmins, isInventedMockId, initialDefaultData } from '../data/initialData';
import { deduplicateById, sanitizeAppData } from '../utils/storage';

export const COLLECTIONS = {
  SCHOOLS: 'schools',
  CLASSES: 'classes',
  STUDENTS: 'students',
  ACTIVITIES: 'activities',
  GRADES: 'grades',
  POSTS: 'posts',
  EVENTS: 'events',
  ADMINS: 'admins',
  FILES: 'collaborative_files'
} as const;

export type EssentialCollectionKey =
  | 'schools'
  | 'classes'
  | 'students'
  | 'activities'
  | 'grades'
  | 'posts'
  | 'events'
  | 'admins'
  | 'collaborative_files';

export const ESSENTIAL_COLLECTION_KEYS: EssentialCollectionKey[] = [
  'schools',
  'classes',
  'students',
  'activities',
  'grades',
  'posts',
  'events',
  'admins',
  'collaborative_files'
];

export const COLLECTION_LABELS: Record<EssentialCollectionKey, string> = {
  schools: 'Escolas',
  classes: 'Turmas',
  students: 'Alunos',
  activities: 'Atividades',
  grades: 'Notas e Entregas',
  posts: 'Mural de Avisos',
  events: 'Calendário Acadêmico',
  admins: 'Administradores',
  collaborative_files: 'Documentos Colaborativos'
};

export interface CloudSyncCallbacks {
  onCollectionChange: <K extends EssentialCollectionKey>(
    colKey: K,
    docs: any[],
    collectionName: string
  ) => void;
  onCollectionLoaded: (
    colKey: EssentialCollectionKey,
    allLoaded: boolean,
    loadedSet: Set<EssentialCollectionKey>
  ) => void;
  onError: (error: Error, colKey?: EssentialCollectionKey) => void;
}

/**
 * Remove chaves com valor `undefined` (inclusive aninhadas) para evitar erros de validação do Firestore.
 */
export function cleanForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = cleanForFirestore(value);
      } else if (Array.isArray(value)) {
        cleaned[key] = value
          .map(v => (v && typeof v === 'object' && !Array.isArray(v) ? cleanForFirestore(v) : v))
          .filter(v => v !== undefined);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

/**
 * Testa a conexão direta com o servidor do Firestore.
 */
export async function testCloudConnection(): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.SCHOOLS));
    return snap !== undefined;
  } catch (error: any) {
    console.warn('[CloudDB] Firestore temporariamente em modo offline ou reconectando:', error?.message);
    return false;
  }
}

/**
 * Busca todos os dados da aplicação diretamente do Firestore na nuvem.
 * O Firestore é a autoridade máxima e central de dados.
 */
export async function fetchCloudAppData(): Promise<AppData> {
  try {
    const [
      schoolsSnap,
      classesSnap,
      studentsSnap,
      activitiesSnap,
      gradesSnap,
      postsSnap,
      eventsSnap,
      adminsSnap,
      filesSnap
    ] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.SCHOOLS)),
      getDocs(collection(db, COLLECTIONS.CLASSES)),
      getDocs(collection(db, COLLECTIONS.STUDENTS)),
      getDocs(collection(db, COLLECTIONS.ACTIVITIES)),
      getDocs(collection(db, COLLECTIONS.GRADES)),
      getDocs(collection(db, COLLECTIONS.POSTS)),
      getDocs(collection(db, COLLECTIONS.EVENTS)),
      getDocs(collection(db, COLLECTIONS.ADMINS)),
      getDocs(collection(db, COLLECTIONS.FILES))
    ]);

    const extractDocs = <T extends { entity_id: string }>(snap: typeof schoolsSnap): T[] => {
      return snap.docs
        .map(d => {
          const raw = d.data();
          return {
            ...raw,
            entity_id: raw.entity_id || d.id
          } as T;
        })
        .filter(item => !isInventedMockId(item.entity_id));
    };

    const schools = extractDocs<School>(schoolsSnap);
    const classes = extractDocs<ClassRoom>(classesSnap);
    const students = extractDocs<Student>(studentsSnap);
    const activities = extractDocs<Activity>(activitiesSnap);
    const grades = extractDocs<Grade>(gradesSnap);
    const posts = extractDocs<Post>(postsSnap);
    const events = extractDocs<AcademicEvent>(eventsSnap);
    const admins = extractDocs<AdminUser>(adminsSnap);
    const collaborative_files = extractDocs<CollaborativeFile>(filesSnap);

    const validAdmins = deduplicateById(admins).filter(
      a => Boolean(a && a.username && a.password && a.name)
    );

    return sanitizeAppData({
      schools: deduplicateById(schools),
      classes: deduplicateById(classes),
      students: deduplicateById(students),
      activities: deduplicateById(activities),
      grades: deduplicateById(grades),
      posts: deduplicateById(posts),
      events: deduplicateById(events),
      admins: validAdmins.length > 0 ? validAdmins : defaultAdmins,
      collaborative_files: deduplicateById(collaborative_files)
    });
  } catch (error: any) {
    console.warn('[CloudDB] Aviso ao buscar dados do Cloud Firestore:', error?.message);
    // Retorna dados seguros com administradores válidos para que a aplicação nunca fique inacessível
    return sanitizeAppData({
      ...initialDefaultData,
      admins: defaultAdmins
    });
  }
}

/**
 * Salva ou atualiza um item em uma coleção no Firestore com persistência garantida.
 */
export async function saveCloudItem<T extends { entity_id: string }>(
  collectionName: string,
  item: T
): Promise<void> {
  try {
    const entityId = String(item.entity_id);
    const docRef = doc(db, collectionName, entityId);
    const payload = cleanForFirestore({
      ...item,
      entity_id: entityId
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Tempo limite excedido ao salvar na coleção ${collectionName}`)), 8000)
    );

    await Promise.race([
      setDoc(docRef, payload, { merge: true }),
      timeoutPromise
    ]);
  } catch (error: any) {
    console.warn(`[CloudDB] Erro ao salvar documento na coleção ${collectionName}:`, error?.message);
    throw new Error(`Erro ao salvar no banco de dados na nuvem: ${error?.message || 'Falha na gravação'}`);
  }
}

/**
 * Remove um item de uma coleção no Firestore com persistência garantida.
 */
export async function deleteCloudItem(
  collectionName: string,
  entityId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, String(entityId));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Tempo limite excedido ao excluir da coleção ${collectionName}`)), 8000)
    );

    await Promise.race([
      deleteDoc(docRef),
      timeoutPromise
    ]);
  } catch (error: any) {
    console.warn(`[CloudDB] Erro ao excluir documento da coleção ${collectionName}:`, error?.message);
    throw new Error(`Erro ao excluir do banco de dados remoto: ${error?.message || 'Falha na exclusão'}`);
  }
}

/**
 * Remove definitivamente do Firestore registros fictícios com IDs mock conhecidos.
 */
export async function purgeInventedMockDataFromCloud(): Promise<number> {
  let purgedCount = 0;
  try {
    const collectionsToCheck = [
      COLLECTIONS.SCHOOLS,
      COLLECTIONS.CLASSES,
      COLLECTIONS.STUDENTS,
      COLLECTIONS.ACTIVITIES,
      COLLECTIONS.GRADES,
      COLLECTIONS.POSTS,
      COLLECTIONS.EVENTS,
      COLLECTIONS.ADMINS
    ];

    for (const colName of collectionsToCheck) {
      const snap = await getDocs(collection(db, colName));
      const mockDocs = snap.docs.filter(d => isInventedMockId(d.id) || isInventedMockId(d.data()?.entity_id));
      if (mockDocs.length > 0) {
        const batch = writeBatch(db);
        mockDocs.forEach(d => {
          batch.delete(d.ref);
          purgedCount++;
        });
        await batch.commit();
      }
    }
    if (purgedCount > 0) {
      console.info(`[CloudDB] Purge concluído: ${purgedCount} itens fictícios foram removidos do Firestore.`);
    }
  } catch (err) {
    console.warn('[CloudDB] Purge de dados fictícios ignorado:', err);
  }
  return purgedCount;
}

/**
 * Garante que a conta de administrador autêntica exista no Firestore se a coleção estiver vazia.
 * NUNCA gera escolas, turmas, alunos ou dados fictícios.
 */
export async function seedCloudDatabaseIfEmpty(): Promise<boolean> {
  try {
    const adminsSnap = await getDocs(collection(db, COLLECTIONS.ADMINS));
    const nonMockAdmins = adminsSnap.docs.filter(d => !isInventedMockId(d.id) && !isInventedMockId(d.data()?.entity_id));

    if (nonMockAdmins.length === 0) {
      console.info('[CloudDB] Coleção de administradores vazia no Firestore. Gravando administrador principal...');
      const adminBatch = writeBatch(db);
      for (const adm of defaultAdmins) {
        const ref = doc(db, COLLECTIONS.ADMINS, String(adm.entity_id));
        adminBatch.set(ref, cleanForFirestore(adm));
      }
      await adminBatch.commit();
      return true;
    }

    return false;
  } catch (error) {
    console.warn('[CloudDB] Não foi possível verificar/popular administradores na nuvem:', error);
    return false;
  }
}

/**
 * Restaura o banco de dados na nuvem para o estado limpo em branco,
 * preservando estritamente os administradores autênticos.
 */
export async function resetCloudDatabaseToDefaults(): Promise<void> {
  await clearCloudDatabase(defaultAdmins);
}

/**
 * Limpa todos os dados operacionais do banco na nuvem (escolas, turmas, alunos, etc.),
 * mantendo apenas os administradores para que o acesso continue funcionando.
 */
export async function clearCloudDatabase(currentAdmins?: AdminUser[]): Promise<void> {
  const collectionsToClear = [
    COLLECTIONS.SCHOOLS,
    COLLECTIONS.CLASSES,
    COLLECTIONS.STUDENTS,
    COLLECTIONS.ACTIVITIES,
    COLLECTIONS.GRADES,
    COLLECTIONS.POSTS,
    COLLECTIONS.EVENTS,
    COLLECTIONS.FILES
  ];

  for (const colName of collectionsToClear) {
    const snap = await getDocs(collection(db, colName));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await Promise.race([
      batch.commit(),
      new Promise(resolve => setTimeout(resolve, 3500))
    ]);
  }

  const adminsToKeep = (currentAdmins && currentAdmins.length > 0) ? currentAdmins : defaultAdmins;
  const adminBatch = writeBatch(db);
  for (const adm of adminsToKeep) {
    const ref = doc(db, COLLECTIONS.ADMINS, String(adm.entity_id));
    adminBatch.set(ref, cleanForFirestore(adm));
  }
  await Promise.race([
    adminBatch.commit(),
    new Promise(resolve => setTimeout(resolve, 3500))
  ]);
}

/**
 * Importa múltiplos registros em lote para o Firestore de forma fracionada e segura,
 * protegendo contra limites de lote (500) e travamentos de conexão.
 */
export async function batchImportToCloud(incoming: Partial<AppData>): Promise<number> {
  let count = 0;
  const batches: Array<ReturnType<typeof writeBatch>> = [];
  let currentBatch = writeBatch(db);
  let batchOps = 0;

  const addItems = <T extends { entity_id: string }>(col: string, list?: T[]) => {
    if (list && Array.isArray(list)) {
      for (const item of list) {
        if (item && item.entity_id) {
          if (batchOps >= 200) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            batchOps = 0;
          }
          const ref = doc(db, col, String(item.entity_id));
          currentBatch.set(ref, cleanForFirestore(item), { merge: true });
          batchOps++;
          count++;
        }
      }
    }
  };

  addItems(COLLECTIONS.SCHOOLS, incoming.schools);
  addItems(COLLECTIONS.CLASSES, incoming.classes);
  addItems(COLLECTIONS.STUDENTS, incoming.students);
  addItems(COLLECTIONS.ACTIVITIES, incoming.activities);
  addItems(COLLECTIONS.GRADES, incoming.grades);
  addItems(COLLECTIONS.POSTS, incoming.posts);
  addItems(COLLECTIONS.EVENTS, incoming.events);
  addItems(COLLECTIONS.ADMINS, incoming.admins);
  addItems(COLLECTIONS.FILES, incoming.collaborative_files);

  if (batchOps > 0) {
    batches.push(currentBatch);
  }

  if (batches.length > 0) {
    for (const b of batches) {
      try {
        await Promise.race([
          b.commit(),
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
      } catch (batchErr) {
        console.warn('[CloudDB] Aviso durante gravação de lote no Firestore:', batchErr);
      }
    }
  }

  return count;
}

/**
 * Assina em tempo real todas as 9 coleções essenciais do Firestore de forma granular e segura.
 * 
 * Regras cruciais implementadas:
 * 1. A aplicação NUNCA é considerada sincronizada até que TODAS as 9 coleções essenciais
 *    tenham entregue seu snapshot inicial do Firestore.
 * 2. Cada coleção atualiza estritamente sua própria fatia de estado, sem que um listener
 *    sobrescreva dados de outros listeners.
 * 3. Qualquer alteração remota feita em qualquer dispositivo (computador, notebook, celular ou tablet)
 *    é propagada imediatamente em tempo real para todos os outros dispositivos conectados.
 * 4. Evita listeners duplicados e limpa todos os observadores ao desmontar.
 */
export function subscribeToAllCollections(callbacks: CloudSyncCallbacks): Unsubscribe {
  let isDisposed = false;
  const initialLoaded = new Set<EssentialCollectionKey>();
  const totalCollections = ESSENTIAL_COLLECTION_KEYS.length;

  const activeUnsubs: Record<EssentialCollectionKey, Unsubscribe | null> = {
    schools: null,
    classes: null,
    students: null,
    activities: null,
    grades: null,
    posts: null,
    events: null,
    admins: null,
    collaborative_files: null
  };

  const reconnectTimers: Record<EssentialCollectionKey, NodeJS.Timeout | null> = {
    schools: null,
    classes: null,
    students: null,
    activities: null,
    grades: null,
    posts: null,
    events: null,
    admins: null,
    collaborative_files: null
  };

  const setupListener = (colKey: EssentialCollectionKey) => {
    if (isDisposed) return;

    // Cancela listener anterior caso esteja reatribuindo
    if (activeUnsubs[colKey]) {
      try {
        activeUnsubs[colKey]!();
      } catch (e) {
        // ignora
      }
      activeUnsubs[colKey] = null;
    }

    try {
      const colName = colKey === 'collaborative_files' ? COLLECTIONS.FILES : COLLECTIONS[colKey.toUpperCase() as keyof typeof COLLECTIONS] || colKey;
      const colRef = collection(db, colName);

      activeUnsubs[colKey] = onSnapshot(
        colRef,
        snapshot => {
          if (isDisposed) return;

          const docs = snapshot.docs
            .map(d => {
              const data = d.data();
              return {
                ...data,
                entity_id: data.entity_id || d.id
              };
            })
            .filter((item: any) => !isInventedMockId(item?.entity_id));

          // 1. Notifica a atualização independente da coleção para montagem do estado global
          callbacks.onCollectionChange(colKey, docs, COLLECTION_LABELS[colKey]);

          // 2. Controla o carregamento inicial de TODAS as coleções essenciais
          const wasLoadedBefore = initialLoaded.has(colKey);
          if (!wasLoadedBefore) {
            initialLoaded.add(colKey);
            const allLoaded = initialLoaded.size === totalCollections;
            callbacks.onCollectionLoaded(colKey, allLoaded, new Set(initialLoaded));
          }
        },
        error => {
          if (isDisposed) return;
          console.warn(`[CloudDB] Listener de ${COLLECTION_LABELS[colKey]} avisou reconexão:`, error?.message);
          callbacks.onError(error, colKey);

          // Agenda reconexão segura e limpa
          if (reconnectTimers[colKey]) {
            clearTimeout(reconnectTimers[colKey]!);
          }
          reconnectTimers[colKey] = setTimeout(() => {
            if (!isDisposed) {
              setupListener(colKey);
            }
          }, 2500);
        }
      );
    } catch (err: any) {
      console.warn(`[CloudDB] Falha ao iniciar listener para ${COLLECTION_LABELS[colKey]}:`, err?.message);
      if (!isDisposed) {
        if (reconnectTimers[colKey]) clearTimeout(reconnectTimers[colKey]!);
        reconnectTimers[colKey] = setTimeout(() => {
          if (!isDisposed) setupListener(colKey);
        }, 3000);
      }
    }
  };

  // Inicializa os 9 listeners em paralelo
  for (const key of ESSENTIAL_COLLECTION_KEYS) {
    setupListener(key);
  }

  // Monitoramento de reconexão de rede
  const handleOnline = () => {
    if (!isDisposed) {
      console.info('[CloudDB] Conexão restabelecida. Verificando listeners...');
      for (const key of ESSENTIAL_COLLECTION_KEYS) {
        if (!activeUnsubs[key]) {
          setupListener(key);
        }
      }
    }
  };

  window.addEventListener('online', handleOnline);

  // Limpeza completa de todos os listeners e timers ao desmontar
  return () => {
    isDisposed = true;
    window.removeEventListener('online', handleOnline);

    for (const key of ESSENTIAL_COLLECTION_KEYS) {
      if (reconnectTimers[key]) {
        clearTimeout(reconnectTimers[key]!);
        reconnectTimers[key] = null;
      }
      if (activeUnsubs[key]) {
        try {
          activeUnsubs[key]!();
        } catch (e) {
          // ignora
        }
        activeUnsubs[key] = null;
      }
    }
  };
}

/**
 * Assina atualizações da base completa no formato AppData.
 * Aguarda todas as 9 coleções essenciais antes de emitir a base definitiva inicial.
 */
export function subscribeToCloudAppData(
  onDataChange: (data: AppData) => void,
  onError: (error: Error) => void
): Unsubscribe {
  let isDisposed = false;
  let isInitialSyncDone = false;

  const currentCache: AppData = {
    schools: [],
    classes: [],
    students: [],
    activities: [],
    grades: [],
    posts: [],
    events: [],
    admins: defaultAdmins,
    collaborative_files: []
  };

  const emit = () => {
    if (isDisposed || !isInitialSyncDone) return;
    const allAdmins = deduplicateById([...defaultAdmins, ...(currentCache.admins || [])]);
    onDataChange(sanitizeAppData({
      schools: deduplicateById(currentCache.schools),
      classes: deduplicateById(currentCache.classes),
      students: deduplicateById(currentCache.students),
      activities: deduplicateById(currentCache.activities),
      grades: deduplicateById(currentCache.grades),
      posts: deduplicateById(currentCache.posts),
      events: deduplicateById(currentCache.events),
      admins: allAdmins.length > 0 ? allAdmins : defaultAdmins,
      collaborative_files: deduplicateById(currentCache.collaborative_files)
    }));
  };

  const unsubscribe = subscribeToAllCollections({
    onCollectionChange: (colKey, docs) => {
      if (isDisposed) return;
      if (colKey === 'admins') {
        const list = (docs as AdminUser[]).filter(
          a => Boolean(a && a.username && a.password && a.name)
        );
        currentCache.admins = list.length > 0 ? list : defaultAdmins;
      } else if (colKey === 'collaborative_files') {
        currentCache.collaborative_files = docs as CollaborativeFile[];
      } else {
        (currentCache as any)[colKey] = docs;
      }
      if (isInitialSyncDone) {
        emit();
      }
    },
    onCollectionLoaded: (colKey, allLoaded) => {
      if (isDisposed) return;
      if (allLoaded && !isInitialSyncDone) {
        isInitialSyncDone = true;
        emit();
      }
    },
    onError: (err) => {
      if (!isDisposed) onError(err);
    }
  });

  return () => {
    isDisposed = true;
    unsubscribe();
  };
}
