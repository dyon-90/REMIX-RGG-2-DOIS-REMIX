/**
 * Configuração Central do Cliente Supabase (PostgreSQL)
 * 
 * Centraliza a conexão com a instância do Supabase.
 * Todas as requisições utilizam a chave pública (anon key) respeitando as políticas RLS do PostgreSQL.
 * NUNCA utilize ou exponha a service_role key no frontend.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Chaves padrão oficiais do projeto
export const DEFAULT_SUPABASE_URL = 'https://cvxxyqjefqkpculdjfqp.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_7TMRp-37R6pEZurbQZn_Xg_yhZ4GJmJ';

// Chaves padrão via variáveis de ambiente Vite (ou projeto oficial pré-configurado)
const ENV_SUPABASE_URL = ((import.meta.env && import.meta.env.VITE_SUPABASE_URL) || DEFAULT_SUPABASE_URL).trim();
const ENV_SUPABASE_ANON_KEY = ((import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON_KEY).trim();

// Chave local para administradores que configuram via interface em tempo de execução
const STORAGE_CONFIG_KEY = 'app_supabase_runtime_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled?: boolean;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  let url = ENV_SUPABASE_URL;
  let anonKey = ENV_SUPABASE_ANON_KEY;
  let enabled = true;

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.url && parsed.anonKey) {
          url = parsed.url;
          anonKey = parsed.anonKey;
        }
        if (parsed.enabled !== undefined) {
          enabled = Boolean(parsed.enabled);
        }
      }
    } catch {
      // Ignora erro de parsing
    }
  }

  return { url, anonKey, enabled };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string, enabled: boolean = true): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify({ 
        url: url.trim(), 
        anonKey: anonKey.trim(),
        enabled
      }));
    } catch {
      // Ignora erro
    }
  }
  supabaseInstance = null;
  lastInstantiatedUrl = '';
  lastInstantiatedKey = '';
}

export function clearStoredSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_CONFIG_KEY);
    } catch {
      // Ignora erro
    }
  }
  supabaseInstance = null;
  lastInstantiatedUrl = '';
  lastInstantiatedKey = '';
}

export function setSupabaseEnabled(enabled: boolean): void {
  const current = getStoredSupabaseConfig();
  saveStoredSupabaseConfig(current.url, current.anonKey, enabled);
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey, enabled } = getStoredSupabaseConfig();
  if (enabled === false) return false;
  return (
    Boolean(url) &&
    Boolean(anonKey) &&
    url.startsWith('https://') &&
    !url.includes('SEU_SUPABASE_URL') &&
    !url.includes('your-project') &&
    anonKey.length > 20
  );
}

let supabaseInstance: SupabaseClient | null = null;
let lastInstantiatedUrl = '';
let lastInstantiatedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();

  if (!isSupabaseConfigured()) {
    return null;
  }

  if (supabaseInstance && lastInstantiatedUrl === url && lastInstantiatedKey === anonKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    lastInstantiatedUrl = url;
    lastInstantiatedKey = anonKey;
    return supabaseInstance;
  } catch (error) {
    console.error('[Supabase] Erro ao instanciar cliente Supabase:', error);
    return null;
  }
}

// Export singleton para importação direta
export const supabase = getSupabaseClient();
