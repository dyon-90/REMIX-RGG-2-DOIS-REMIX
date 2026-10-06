/**
 * Utilitários de Segurança e Sanitização contra Vulnerabilidades
 * - Previne Cross-Site Scripting (XSS via links maliciosos javascript:, data:, etc.)
 * - Sanitização de credenciais e inputs de formulários (aspas residuais, espaços)
 * - Validação rigorosa de URLs para materiais externos, anexos e submissões
 */

/**
 * Sanitiza URLs externas garantindo que apenas protocolos seguros (http: e https:)
 * sejam aceitos em tags <a href="..."> ou requisições.
 * Bloqueia expressamente esquemas perigosos como javascript:, data:, vbscript:, etc.
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Bloqueio imediato de esquemas de injeção de script
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    console.warn('[Segurança] URL com esquema potencialmente perigoso bloqueada:', trimmed);
    return '';
  }

  // Se a URL começar com // (protocol-relative), normaliza para https://
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  // Se já possui protocolo http ou https válido
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.href;
      }
    } catch {
      return '';
    }
  }

  // Se não tem protocolo mas parece ser um domínio (ex: www.google.com ou drive.google.com)
  if (/^[a-zA-Z0-9][-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b/.test(trimmed)) {
    try {
      const parsed = new URL(`https://${trimmed}`);
      return parsed.href;
    } catch {
      return '';
    }
  }

  return '';
}

/**
 * Sanitiza valores de login e senha removendo aspas delimitadoras residuais
 * (comumente coladas por usuários como "dyon.gomes" ou "@gomes2026")
 * e espaços em branco invisíveis.
 */
export function sanitizeLoginInput(val: string | null | undefined): string {
  if (!val || typeof val !== 'string') return '';
  return val
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim();
}

/**
 * Remove caracteres de controle ou scripts de textos simples.
 */
export function sanitizeText(val: string | null | undefined): string {
  if (!val || typeof val !== 'string') return '';
  // Remove caracteres nulos e de controle perigosos
  return val.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}
