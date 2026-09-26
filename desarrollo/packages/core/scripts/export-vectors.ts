/**
 * Exporta vectores de prueba para verificar que un port (GDScript, C#, Dart…) reproduce
 * exactamente el motor de referencia. Ver docs/migracion/00-estrategia.md.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyAction, chooseAction, createGame, hashState, nextRandom, type Action } from '../src/index.js';
import { DATA_DIR, loadData } from '../src/node-data.js';

const data = loadData();
const dir = resolve(DATA_DIR, 'test-vectors');
mkdirSync(dir, { recursive: true });

// 1) RNG
const rng: { seed: number; values: number[]; states: number[] }[] = [];
for (const seed of [0, 1, 42, 123456789, -5]) {
  let s = seed | 0; const values: number[] = [], states: number[] = [];
  for (let i = 0; i < 8; i++) { const [v, n] = nextRandom(s); values.push(v); states.push(n); s = n; }
  rng.push({ seed, values, states });
}
writeFileSync(resolve(dir, 'rng.json'), JSON.stringify(rng, null, 2));

// 2) Partidas completas: semilla, acciones y hash del estado tras cada acción
const heroes = Object.keys(data.heroes);
const games = [];
for (let g = 0; g < 8; g++) {
  const h: [string, string] = [heroes[g % 4], heroes[(g + 1 + (g >> 2)) % 4]];
  const seed = 2026 + g;
  let s = createGame(data, { heroes: h, seed }).state;
  const initialHash = hashState(s);
  const steps: { action: Action; hash: string }[] = [];
  while (s.winner === null) {
    const action = chooseAction(s, data, s.current);
    s = applyAction(s, data, action).state;
    steps.push({ action, hash: hashState(s) });
  }
  games.push({ heroes: h, seed, initialHash, steps, winner: s.winner, rounds: s.round, finalHash: hashState(s) });
}
writeFileSync(resolve(dir, 'games.json'), JSON.stringify(games));
console.log('vectores:', games.map((g) => `${g.heroes.join(' vs ')} → ${g.winner} en ${g.rounds} rondas, ${g.steps.length} acciones`).join('\n'));

// 3) Hash: un estado de ejemplo y su hash, para verificar canonicalJson + FNV-1a por separado
{
  const s = createGame(data, { heroes: ['aurelia', 'tarn'], seed: 99 }).state;
  writeFileSync(resolve(dir, 'hash.json'), JSON.stringify({ state: s, hash: hashState(s) }, null, 2));
}
