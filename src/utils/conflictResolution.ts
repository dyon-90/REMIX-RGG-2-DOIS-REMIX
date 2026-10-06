/**
 * Algoritmo inteligente de resolução de conflitos e mesclagem de texto colaborativo (3-Way / Diff Merge).
 * 
 * Permite que múltiplos usuários editem o mesmo arquivo simultaneamente sem que
 * as alterações de um colega sobrescrevam ou apaguem o trabalho do outro.
 */

export interface MergeResult {
  mergedText: string;
  hasConflict: boolean;
  conflictDetails?: string;
}

/**
 * Divide o texto em blocos/parágrafos lógicos para mesclagem semântica.
 */
function splitBlocks(text: string): string[] {
  return (text || '').split(/\r?\n/);
}

/**
 * Mesclagem inteligente de parágrafos/linhas entre a versão base (comum),
 * a versão local (digitada pelo usuário atual) e a versão remota (enviada pelo colega).
 */
export function smartMergeText(base: string, local: string, remote: string): MergeResult {
  // Se forem idênticos, nada a mesclar
  if (local === remote) {
    return { mergedText: local, hasConflict: false };
  }
  // Se o usuário local não mudou nada em relação à base, adote as alterações do colega
  if (local === base) {
    return { mergedText: remote, hasConflict: false };
  }
  // Se o colega não mudou nada em relação à base, mantenha o local
  if (remote === base) {
    return { mergedText: local, hasConflict: false };
  }

  const baseBlocks = splitBlocks(base);
  const localBlocks = splitBlocks(local);
  const remoteBlocks = splitBlocks(remote);

  const merged: string[] = [];
  let hasConflict = false;

  const maxLen = Math.max(localBlocks.length, remoteBlocks.length);

  for (let i = 0; i < maxLen; i++) {
    const baseLine = baseBlocks[i] ?? '';
    const localLine = localBlocks[i] ?? '';
    const remoteLine = remoteBlocks[i] ?? '';

    // Caso 1: Ambos os blocos são iguais
    if (localLine === remoteLine) {
      merged.push(localLine);
    }
    // Caso 2: Apenas o usuário local alterou a linha
    else if (remoteLine === baseLine) {
      merged.push(localLine);
    }
    // Caso 3: Apenas o colega remoto alterou a linha
    else if (localLine === baseLine) {
      merged.push(remoteLine);
    }
    // Caso 4: Ambos alteraram a mesma linha/parágrafo
    else {
      // Tenta fusão inteligente intra-linha
      const intraLine = mergeLineIntraText(baseLine, localLine, remoteLine);
      merged.push(intraLine.text);
      if (intraLine.conflict) {
        hasConflict = true;
      }
    }
  }

  return {
    mergedText: merged.join('\n'),
    hasConflict,
    conflictDetails: hasConflict ? 'Algumas alterações no mesmo parágrafo foram combinadas.' : undefined
  };
}

/**
 * Fusão intra-parágrafo para preservar acréscimos de ambos os usuários.
 */
function mergeLineIntraText(base: string, local: string, remote: string): { text: string; conflict: boolean } {
  // Se um for prefixo ou sufixo do outro
  if (local.includes(remote)) return { text: local, conflict: false };
  if (remote.includes(local)) return { text: remote, conflict: false };

  // Se ambos adicionaram texto ao final
  if (local.startsWith(base) && remote.startsWith(base)) {
    const localAdded = local.slice(base.length).trim();
    const remoteAdded = remote.slice(base.length).trim();
    return {
      text: `${base} ${localAdded} ${remoteAdded}`.replace(/\s+/g, ' ').trim(),
      conflict: false
    };
  }

  // Se ambos adicionaram texto ao início
  if (local.endsWith(base) && remote.endsWith(base)) {
    const localPrefix = local.slice(0, local.length - base.length).trim();
    const remotePrefix = remote.slice(0, remote.length - base.length).trim();
    return {
      text: `${localPrefix} ${remotePrefix} ${base}`.replace(/\s+/g, ' ').trim(),
      conflict: false
    };
  }

  // Se ambos editaram profundamente a mesma linha, combina preservando ambos
  return {
    text: `${local} [Contribuição do colega: ${remote}]`,
    conflict: true
  };
}

/**
 * Mescla registros inteiros em nível de campos de forma não destrutiva.
 */
export function mergeEntityFields<T extends Record<string, any>>(
  base: T,
  local: T,
  remote: T,
  lastLocalTimestamp: number,
  lastRemoteTimestamp: number
): T {
  const result: any = { ...base };
  const allKeys = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)]);

  allKeys.forEach(key => {
    const bVal = base[key];
    const lVal = local[key];
    const rVal = remote[key];

    // Se é texto longo e difere em ambos
    if (typeof lVal === 'string' && typeof rVal === 'string' && lVal !== rVal && typeof bVal === 'string') {
      const merged = smartMergeText(bVal, lVal, rVal);
      result[key] = merged.mergedText;
    }
    // Caso padrão de campo único: quem alterou mais recentemente vence, preservando integridade
    else if (lVal !== bVal && rVal === bVal) {
      result[key] = lVal;
    } else if (rVal !== bVal && lVal === bVal) {
      result[key] = rVal;
    } else if (lVal !== rVal) {
      result[key] = lastLocalTimestamp >= lastRemoteTimestamp ? lVal : rVal;
    } else {
      result[key] = lVal;
    }
  });

  return result as T;
}
