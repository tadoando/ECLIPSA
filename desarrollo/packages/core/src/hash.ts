import type { GameState } from './types.js';

/** Serialización canónica (claves ordenadas) para comparar estados entre plataformas. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    return '{' + Object.keys(o).sort().filter((k) => o[k] !== undefined).map((k) => JSON.stringify(k) + ':' + canonicalJson(o[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

/** Hash FNV-1a de 32 bits del estado canónico, en hexadecimal. Fácil de portar a GDScript/C#/Dart. */
export function hashState(state: GameState): string {
  const s = canonicalJson(state);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
