/**
 * Generador pseudoaleatorio determinista (mulberry32).
 * El estado vive dentro de GameState.rng para que la misma semilla + las mismas acciones
 * produzcan siempre la misma partida (necesario para servidor autoritativo, repeticiones y pruebas).
 * Cualquier port a otro lenguaje debe reproducir exactamente esta función (ver data/test-vectors).
 */
export function nextRandom(state: number): [value: number, next: number] {
  const next = (state + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, next];
}

/** Fisher–Yates con el RNG determinista. Devuelve el nuevo estado del RNG. */
export function shuffleInPlace<T>(arr: T[], rng: number): number {
  let r = rng;
  for (let i = arr.length - 1; i > 0; i--) {
    const [v, n] = nextRandom(r);
    r = n;
    const j = Math.floor(v * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return r;
}
