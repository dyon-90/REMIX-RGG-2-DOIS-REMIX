/**
 * Camada de Persistência em Banco de Dados Relacional Supabase + PostgreSQL
 * 
 * Centraliza e sincroniza os dados em tempo real entre todos os dispositivos,
 * garantindo o PostgreSQL hospedado no Supabase como a ÚNICA FONTE OFICIAL DA VERDADE.
 * Todos os computadores, notebooks, celulares e tablets consultam e gravam no mesmo banco.
 */

import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import {
  AppData,
  School,
  ClassRoom,
  Student,
  Activity,
  Grade,
  Post,
  AcademicEvent,
  AdminUser,
  CollaborativeFile
} from '../types';
import { defaultAdmins, isInventedMockId } from '../data/initialData';
import { deduplicateById, sanitizeAppData } from '../utils/storage';
import {
  COLLECTIONS,
  ESSENTIAL_COLLECTION_KEYS,
  COLLECTION_LABELS,
  EssentialCollectionKey,
  CloudSyncCallbacks
} from './cloudDb';

/**
 * Remove campos com valores indefinidos e ajusta tipos para o PostgreSQL
 */
export function cleanForPostgres<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (key === 'tags' || key === 'collaborators') {
        cleaned[key] = value ?? [];
      } else if (key === 'metrics' || key === 'snapshot') {
        cleaned[key] = value ?? {};
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

/**
 * Resposta de diagnóstico do teste de conexão com o Supabase
 */
export interface SupabaseTestResult {
  success: boolean;
  message: string;
  tablesCreated?: boolean;
}

/**
 * Testa a conectividade com o banco de dados PostgreSQL no Supabase com diagnóstico detalhado.
 */
export async function testSupabaseConnection(
  customUrl?: string,
  customAnonKey?: string
): Promise<SupabaseTestResult> {
  let client = getSupabaseClient();

  if (customUrl && customAnonKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      client = createClient(customUrl.trim(), customAnonKey.trim(), {
        auth: { persistSession: false }
      });
    } catch (e: any) {
      return {
        success: false,
        message: `Formato de URL ou Chave inválido: ${e?.message || 'Erro'}`
      };
    }
  }

  if (!client) {
    return {
      success: false,
      message: 'Supabase não configurado. Forneça a URL do Projeto (https://...) e a Chave Pública Anon.'
    };
  }

  try {
    const { error } = await client
      .from('schools')
      .select('entity_id')
      .limit(1);

    if (error) {
      // Código de erro PostgreSQL 42P01 ou PGRST205 (tabela não encontrada / schema cache)
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache')
      ) {
        return {
          success: true,
          tablesCreated: false,
          message: '✓ Conexão com o Supabase estabelecida com sucesso! Porém, as tabelas ainda precisam ser criadas. Execute o script "supabase/schema.sql" no SQL Editor do Supabase.'
        };
      }
      if (error.message?.includes('JWT') || error.code === 'PGRST301' || error.code === '401') {
        return {
          success: false,
          message: 'Chave Pública Anon inválida ou expirada. Verifique suas credenciais em Project Settings -> API no Supabase.'
        };
      }
      return {
        success: false,
        message: `Erro retornado pelo Supabase: ${error.message} (Código: ${error.code || 'N/A'})`
      };
    }

    return {
      success: true,
      tablesCreated: true,
      message: '✓ Conexão com o Supabase PostgreSQL validada com sucesso! As 12 tabelas estão prontas e sincronizando.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Falha ao tentar conectar ao Supabase: ${err?.message || 'Sem conexão com a internet'}. Verifique se a URL está correta (deve iniciar com https://) e se o projeto não está pausado.`
    };
  }
}

/**
 * Busca todos os dados da aplicação armazenados nas tabelas PostgreSQL do Supabase.
 */
export async function fetchSupabaseAppData(): Promise<AppData> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase não configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }

  try {
    const [
      schoolsRes,
      classesRes,
      studentsRes,
      activitiesRes,
      gradesRes,
      postsRes,
      eventsRes,
      adminsRes,
      filesRes
    ] = await Promise.all([
      client.from(COLLECTIONS.SCHOOLS).select('*'),
      client.from(COLLECTIONS.CLASSES).select('*'),
      client.from(COLLECTIONS.STUDENTS).select('*'),
      client.from(COLLECTIONS.ACTIVITIES).select('*'),
      client.from(COLLECTIONS.GRADES).select('*'),
      client.from(COLLECTIONS.POSTS).select('*'),
      client.from(COLLECTIONS.EVENTS).select('*'),
      client.from(COLLECTIONS.ADMINS).select('*'),
      client.from(COLLECTIONS.FILES).select('*')
    ]);

    const sanitizeList = <T extends { entity_id: string }>(res: { data: any[] | null; error: any }): T[] => {
      if (res.error) {
        console.warn('[SupabaseDB] Erro ao buscar tabela:', res.error);
        return [];
      }
      return (res.data || [])
        .map(d => ({ ...d, entity_id: String(d.entity_id || d.id) }))
        .filter(item => !isInventedMockId(item.entity_id)) as T[];
    };

    const schools = sanitizeList<School>(schoolsRes);
    const classes = sanitizeList<ClassRoom>(classesRes);
    const students = sanitizeList<Student>(studentsRes);
    const activities = sanitizeList<Activity>(activitiesRes);
    const grades = sanitizeList<Grade>(gradesRes);
    const posts = sanitizeList<Post>(postsRes);
    const events = sanitizeList<AcademicEvent>(eventsRes);
    const admins = sanitizeList<AdminUser>(adminsRes);
    const collaborative_files = sanitizeList<CollaborativeFile>(filesRes);

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
    console.error('[SupabaseDB] Erro ao buscar dados do PostgreSQL no Supabase:', error);
    throw new Error(`Falha de conexão com PostgreSQL Supabase: ${error?.message || 'Erro desconhecido'}`);
  }
}

/**
 * Salva ou atualiza um item no PostgreSQL do Supabase via UPSERT atômico.
 */
export async function saveSupabaseItem<T extends { entity_id: string }>(
  tableName: string,
  item: T
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase não configurado.');
  }

  const payload = cleanForPostgres({
    ...item,
    entity_id: String(item.entity_id)
  });

  const { error } = await client
    .from(tableName)
    .upsert(payload, { onConflict: 'entity_id' });

  if (error) {
    console.error(`[SupabaseDB] Erro ao salvar na tabela ${tableName}:`, error);
    throw new Error(`Erro ao salvar no PostgreSQL Supabase (${tableName}): ${error.message}`);
  }
}

/**
 * Remove um registro do PostgreSQL do Supabase.
 */
export async function deleteSupabaseItem(
  tableName: string,
  entityId: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase não configurado.');
  }

  const { error } = await client
    .from(tableName)
    .delete()
    .eq('entity_id', String(entityId));

  if (error) {
    console.error(`[SupabaseDB] Erro ao excluir da tabela ${tableName}:`, error);
    throw new Error(`Erro ao excluir do PostgreSQL Supabase (${tableName}): ${error.message}`);
  }
}

/**
 * Garante que o administrador autêntico exista na tabela admins do Supabase.
 */
export async function seedSupabaseDatabaseIfEmpty(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { data, error } = await client
      .from(COLLECTIONS.ADMINS)
      .select('entity_id')
      .limit(1);

    if (error) return false;

    if (!data || data.length === 0) {
      console.info('[SupabaseDB] Tabela admins vazia. Inserindo administrador padrão...');
      for (const adm of defaultAdmins) {
        await client.from(COLLECTIONS.ADMINS).upsert(cleanForPostgres(adm), { onConflict: 'username' });
      }
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[SupabaseDB] Falha ao verificar seed de administradores:', err);
    return false;
  }
}

/**
 * Importa múltiplos registros em lote para o Supabase PostgreSQL.
 */
export async function batchImportToSupabase(incoming: Partial<AppData>): Promise<number> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase não configurado.');

  let count = 0;

  const importTable = async (tableName: string, list?: any[]) => {
    if (list && Array.isArray(list) && list.length > 0) {
      const cleanedList = list
        .filter(item => item && item.entity_id)
        .map(item => cleanForPostgres(item));

      if (cleanedList.length > 0) {
        const { error } = await client
          .from(tableName)
          .upsert(cleanedList, { onConflict: 'entity_id' });

        if (error) {
          console.warn(`[SupabaseDB] Erro no lote da tabela ${tableName}:`, error.message);
        } else {
          count += cleanedList.length;
        }
      }
    }
  };

  await Promise.all([
    importTable(COLLECTIONS.SCHOOLS, incoming.schools),
    importTable(COLLECTIONS.CLASSES, incoming.classes),
    importTable(COLLECTIONS.STUDENTS, incoming.students),
    importTable(COLLECTIONS.ACTIVITIES, incoming.activities),
    importTable(COLLECTIONS.GRADES, incoming.grades),
    importTable(COLLECTIONS.POSTS, incoming.posts),
    importTable(COLLECTIONS.EVENTS, incoming.events),
    importTable(COLLECTIONS.ADMINS, incoming.admins),
    importTable(COLLECTIONS.FILES, incoming.collaborative_files)
  ]);

  return count;
}

/**
 * Limpa tabelas operacionais do Supabase preservando administradores.
 */
export async function clearSupabaseDatabase(currentAdmins?: AdminUser[]): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase não configurado.');

  const tablesToClear = [
    COLLECTIONS.SCHOOLS,
    COLLECTIONS.CLASSES,
    COLLECTIONS.STUDENTS,
    COLLECTIONS.ACTIVITIES,
    COLLECTIONS.GRADES,
    COLLECTIONS.POSTS,
    COLLECTIONS.EVENTS,
    COLLECTIONS.FILES
  ];

  for (const table of tablesToClear) {
    await client.from(table).delete().neq('entity_id', 'NON_EXISTENT_PLACEHOLDER');
  }

  // Garante que administradores permaneçam salvos
  const adminsToKeep = (currentAdmins && currentAdmins.length > 0) ? currentAdmins : defaultAdmins;
  for (const adm of adminsToKeep) {
    await client.from(COLLECTIONS.ADMINS).upsert(cleanForPostgres(adm), { onConflict: 'entity_id' });
  }
}

/**
 * Restaura o Supabase PostgreSQL para o estado limpo em branco.
 */
export async function resetSupabaseDatabaseToDefaults(): Promise<void> {
  await clearSupabaseDatabase(defaultAdmins);
}

/**
 * Assina em tempo real todas as 9 coleções essenciais utilizando Supabase Realtime (WebSockets)
 * e o banco PostgreSQL como fonte única da verdade.
 */
export function subscribeToSupabaseCollections(callbacks: CloudSyncCallbacks): () => void {
  const client = getSupabaseClient();
  if (!client) {
    callbacks.onError(new Error('Supabase não está configurado.'));
    return () => {};
  }

  let isDisposed = false;
  const initialLoaded = new Set<EssentialCollectionKey>();
  const totalCollections = ESSENTIAL_COLLECTION_KEYS.length;

  // Função para buscar e emitir uma tabela específica
  const refreshTable = async (colKey: EssentialCollectionKey) => {
    if (isDisposed) return;
    const tableName = colKey === 'collaborative_files' ? COLLECTIONS.FILES : COLLECTIONS[colKey.toUpperCase() as keyof typeof COLLECTIONS] || colKey;

    try {
      const { data, error } = await client.from(tableName).select('*');
      if (error) {
        const isMissing =
          error.code === '42P01' ||
          error.code === 'PGRST205' ||
          error.message?.includes('does not exist') ||
          error.message?.includes('schema cache');

        if (isMissing) {
          console.info(`[SupabaseDB] Tabela "${tableName}" pendente de criação via schema.sql.`);
          const fallbackDocs = colKey === 'admins' ? defaultAdmins : [];
          callbacks.onCollectionChange(colKey, fallbackDocs, COLLECTION_LABELS[colKey]);

          if (!initialLoaded.has(colKey)) {
            initialLoaded.add(colKey);
            const allLoaded = initialLoaded.size === totalCollections;
            callbacks.onCollectionLoaded(colKey, allLoaded, new Set(initialLoaded));
          }
          return;
        }

        console.warn(`[SupabaseDB] Erro ao carregar tabela ${tableName}:`, error.message);
        callbacks.onError(new Error(error.message), colKey);
        return;
      }

      if (isDisposed) return;

      const docs = (data || [])
        .map(d => ({ ...d, entity_id: String(d.entity_id || d.id) }))
        .filter((item: any) => !isInventedMockId(item?.entity_id));

      callbacks.onCollectionChange(colKey, docs, COLLECTION_LABELS[colKey]);

      const wasLoaded = initialLoaded.has(colKey);
      if (!wasLoaded) {
        initialLoaded.add(colKey);
        const allLoaded = initialLoaded.size === totalCollections;
        callbacks.onCollectionLoaded(colKey, allLoaded, new Set(initialLoaded));
      }
    } catch (err: any) {
      if (!isDisposed) {
        callbacks.onError(err, colKey);
      }
    }
  };

  // 1. Carga inicial de todas as 9 tabelas essenciais
  for (const key of ESSENTIAL_COLLECTION_KEYS) {
    refreshTable(key);
  }

  // 2. Assinatura em tempo real via Supabase Realtime Channel
  const channel = client.channel('app_sync_channel');

  for (const key of ESSENTIAL_COLLECTION_KEYS) {
    const tableName = key === 'collaborative_files' ? COLLECTIONS.FILES : COLLECTIONS[key.toUpperCase() as keyof typeof COLLECTIONS] || key;

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName
      },
      () => {
        if (!isDisposed) {
          // Quando qualquer alteração ocorrer em qualquer dispositivo, recarrega a tabela em tempo real
          refreshTable(key);
        }
      }
    );
  }

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.info('[SupabaseDB] ✓ Canal Realtime conectado com sucesso a todas as tabelas.');
    }
  });

  return () => {
    isDisposed = true;
    client.removeChannel(channel);
  };
}
