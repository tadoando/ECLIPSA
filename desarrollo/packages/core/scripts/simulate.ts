/**
 * Simulación de balance: IA contra IA en todos los emparejamientos.
 * Uso: npm run simulate -- [partidasPorEmparejamiento=500]
 * Escribe el informe en docs/15-pruebas-y-balance.resultados.md
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyAction, chooseAction, createGame, type GameEvent } from '../src/index.js';
import { DATA_DIR, loadData } from '../src/node-data.js';

const data = loadData();
const N = Number(process.argv[2] ?? 500);
const heroes = Object.keys(data.heroes);
const wins: Record<string, Record<string, number>> = {};
let firstWins = 0, total = 0, rounds = 0, draws = 0;
const played: Record<string, { n: number; w: number }> = {};

let seed = 1;
for (const a of heroes) {
  wins[a] = {};
  for (const b of heroes) {
    let w = 0;
    for (let g = 0; g < N; g++) {
      let s = createGame(data, { heroes: [a, b], seed: seed++ }).state;
      const byPlayer: [Set<string>, Set<string>] = [new Set(), new Set()];
      while (s.winner === null) {
        const r = applyAction(s, data, chooseAction(s, data, s.current));
        for (const e of r.events as GameEvent[]) if (e.type === 'cardPlayed') byPlayer[e.player].add(e.cardId);
        s = r.state;
      }
      total++; rounds += s.round;
      if (s.winner === 'draw') { draws++; continue; }
      if (s.winner === 0) w++;
      if (s.winner === s.firstPlayer) firstWins++;
      byPlayer.forEach((set, p) => set.forEach((id) => {
        played[id] ??= { n: 0, w: 0 };
        played[id].n++;
        if (s.winner === p) played[id].w++;
      }));
    }
    wins[a][b] = w / N;
  }
}
const pct = (x: number) => (x * 100).toFixed(1) + '%';
let md = `# Resultados de simulación (IA contra IA)\n\nGenerado por \`npm run simulate\` con ${N} partidas por emparejamiento (${total} en total).\n\n`;
md += `- Duración media: **${(rounds / total).toFixed(1)} rondas**\n- Victorias de quien empieza: **${pct(firstWins / (total - draws))}**\n- Empates: ${draws}\n\n`;
md += `## Porcentaje de victoria (fila contra columna)\n\n| | ${heroes.join(' | ')} |\n|---|${heroes.map(() => '---').join('|')}|\n`;
for (const a of heroes) md += `| **${a}** | ${heroes.map((b) => pct(wins[a][b])).join(' | ')} |\n`;
const overall = heroes.map((h) => [h, heroes.reduce((s, b) => s + wins[h][b] + (1 - wins[b][h]), 0) / (2 * heroes.length)] as const);
md += `\n## Victoria global por héroe\n\n| Héroe | Victoria |\n|---|---|\n${overall.map(([h, v]) => `| ${h} | ${pct(v)} |`).join('\n')}\n`;
md += `\n## Cartas: tasa de victoria cuando se jugaron\n\nUna tasa muy alta o muy baja es una pista para revisar la carta (no una prueba: depende de la IA).\n\n| Carta | Partidas | Victoria |\n|---|---|---|\n`;
for (const [id, v] of Object.entries(played).sort((x, y) => y[1].w / y[1].n - x[1].w / x[1].n))
  md += `| ${data.cards[id].collector} ${data.cards[id].name} | ${v.n} | ${pct(v.w / v.n)} |\n`;
const out = resolve(DATA_DIR, '../docs/15-pruebas-y-balance.resultados.md');
writeFileSync(out, md);
console.log(md.split('\n').slice(0, 20).join('\n'));
