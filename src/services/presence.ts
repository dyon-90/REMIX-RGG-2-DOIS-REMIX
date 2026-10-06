/**
 * Gerenciador de Presença em Tempo Real (API REST PHP & MySQL)
 * 
 * Mantém o registro de administradores, alunos e visitantes conectados em tempo real,
 * sincronizando com o banco MySQL via API REST PHP na Hostinger.
 * NENHUM dado de sessão ou presença é persistido em sessionStorage ou localStorage.
 */

import { OnlineUserPresence } from '../types';
import { api } from './api';

// Identificador único da sessão em memória nesta aba (sem localStorage/sessionStorage)
const inMemorySessionId = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);

export function getSessionId(): string {
  return inMemorySessionId;
}

// Detecta amigavelmente o tipo de dispositivo e navegador
export function getDeviceInfo(): { deviceType: 'desktop' | 'mobile' | 'tablet'; browserName: string } {
  if (typeof navigator === 'undefined') {
    return { deviceType: 'desktop', browserName: 'Navegador' };
  }

  const ua = navigator.userAgent.toLowerCase();
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    deviceType = 'mobile';
  }

  let browserName = 'Navegador';
  if (ua.includes('edg/')) browserName = 'Edge';
  else if (ua.includes('chrome/')) browserName = 'Chrome';
  else if (ua.includes('firefox/')) browserName = 'Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome')) browserName = 'Safari';

  return { deviceType, browserName };
}

let activeHeartbeat: NodeJS.Timeout | null = null;
let currentPresencePayload: OnlineUserPresence | null = null;
let lastHeartbeatSentAt = 0;
const subscribers = new Set<(users: OnlineUserPresence[]) => void>();

async function sendHeartbeatNow(): Promise<void> {
  if (!currentPresencePayload) return;
  const now = Date.now();
  if (now - lastHeartbeatSentAt < 3000) return;
  lastHeartbeatSentAt = now;

  try {
    const list = await api.sendPresence(currentPresencePayload);
    if (Array.isArray(list)) {
      subscribers.forEach(cb => cb(list));
    }
  } catch (err) {
    // Falha silenciosa de rede transitória
  }
}

export async function setOnlinePresence(user: {
  userId: string;
  userName: string;
  userRole: 'admin' | 'student' | 'visitor';
  roleDetail?: string;
  currentPage?: string;
}): Promise<void> {
  const sessionId = getSessionId();
  const { deviceType, browserName } = getDeviceInfo();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  const payload: OnlineUserPresence = {
    session_id: sessionId,
    user_id: user.userId,
    user_name: user.userName,
    user_role: user.userRole,
    role_detail: user.roleDetail || (
      user.userRole === 'admin' 
        ? 'Administrador' 
        : user.userRole === 'student' 
          ? 'Aluno' 
          : 'Visitante'
    ),
    device_type: deviceType,
    browser_name: browserName,
    current_page: user.currentPage || 'Plataforma 2+DOIS= Aprender',
    last_seen: nowIso,
    last_seen_millis: now,
    joined_at: currentPresencePayload?.joined_at || nowIso
  };

  currentPresencePayload = payload;
  lastHeartbeatSentAt = now;

  try {
    const active = await api.sendPresence(payload);
    if (Array.isArray(active)) {
      subscribers.forEach(cb => cb(active));
    }
  } catch {
    // Falha de rede transitória
  }

  if (activeHeartbeat) {
    clearInterval(activeHeartbeat);
  }

  activeHeartbeat = setInterval(() => {
    sendHeartbeatNow();
  }, 10000);
}

export async function clearOnlinePresence(): Promise<void> {
  if (activeHeartbeat) {
    clearInterval(activeHeartbeat);
    activeHeartbeat = null;
  }
  currentPresencePayload = null;
}

export function subscribeToOnlineUsers(
  onUsersChange: (users: OnlineUserPresence[]) => void,
  onError?: (err: Error) => void
): () => void {
  subscribers.add(onUsersChange);

  // Executa uma primeira busca de presença
  if (currentPresencePayload) {
    api.sendPresence(currentPresencePayload)
      .then(users => {
        if (Array.isArray(users)) onUsersChange(users);
      })
      .catch(() => {});
  }

  return () => {
    subscribers.delete(onUsersChange);
  };
}
