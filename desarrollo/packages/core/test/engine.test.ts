import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAction,
  chooseAction,
  createGame,
  defaultDeck,
  effectiveAttack,
  getLegalActions,
  hashState,
  InvalidActionError,
  validateAction,
  viewFor,
  type Action,
  type GameState,
  type PlayerIndex,
  type Unit,
} from '../src/index.js';
import { loadData } from '../src/node-data.js';

const data = loadData();

/** Partida base con el jugador 0 empezando, y utilidades para preparar escenarios. */
function setup(heroes: [string, string] = ['aurelia', 'vesper'], seed = 42): GameState {
  return createGame(data, { heroes, seed, firstPlayer: 0 }).state;
}
function put(s: GameState, owner: PlayerIndex, cardId: string, patch: Partial<Unit> = {}): Unit {
  const c = data.cards[cardId];
  const kw = [...(c.keywords ?? [])];
  const u: Unit = {
    uid: s.nextUid++, cardId, owner, attack: c.attack ?? 0, health: c.health ?? 1, maxHealth: c.health ?? 1,
    keywords: kw, shield: kw.includes('escudo'), asleep: false, attacked: false, dead: false, ...patch,
  };
  s.players[owner].board.push(u);
  return u;
}
function giveHand(s: GameState, p: PlayerIndex, ids: string[], energy = 10) {
  s.players[p].hand = [...ids];
  s.players[p].energy = energy;
}
const apply = (s: GameState, a: Action) => applyAction(s, data, a);

test('mazo por defecto: 20 cartas (8×2 de facción + 4 neutrales)', () => {
  for (const h of Object.keys(data.heroes)) {
    const d = defaultDeck(data, h);
    assert.equal(d.length, 20);
    assert.ok(d.every((id) => !data.cards[id].token));
  }
});

test('preparación: manos iniciales, brasas y vida', () => {
  const s = setup();
  assert.equal(s.players[0].hand.length, 4); // 3 + robo del primer turno
  assert.equal(s.players[1].hand.length, 4);
  assert.equal(s.players[0].maxEnergy, 1);
  assert.equal(s.players[0].health, 25);
  assert.equal(s.round, 1);
  assert.equal(s.phase, 'dia');
});

test('las brasas suben 1 por turno hasta 10', () => {
  let s = setup();
  for (let i = 0; i < 24; i++) s = apply(s, { type: 'endTurn', player: s.current }).state;
  assert.equal(s.players[0].maxEnergy, 10);
  assert.equal(s.players[1].maxEnergy, 10);
});

test('la fase alterna al empezar cada ronda', () => {
  let s = setup();
  const phases = [s.phase];
  for (let i = 0; i < 6; i++) {
    s = apply(s, { type: 'endTurn', player: s.current }).state;
    if (s.current === 0) phases.push(s.phase);
  }
  assert.deepEqual(phases, ['dia', 'noche', 'dia', 'noche']);
});

test('bono de fase afecta solo al ataque', () => {
  const s = setup();
  const u = put(s, 0, 'u1'); // Polilla 1/2, Noche +2
  assert.equal(effectiveAttack(s, data, u), 1);
  s.phase = 'noche';
  assert.equal(effectiveAttack(s, data, u), 3);
  assert.equal(u.health, 2);
});

test('una criatura recién jugada duerme; Furia puede atacar', () => {
  const s = setup();
  giveHand(s, 0, ['n2', 's1']);
  let r = apply(s, { type: 'playCard', player: 0, handIndex: 0 });
  const golem = r.state.players[0].board[0];
  assert.equal(golem.asleep, true);
  r = apply(r.state, { type: 'playCard', player: 0, handIndex: 0 });
  const chispa = r.state.players[0].board[1];
  const ok = validateAction(r.state, data, { type: 'attack', player: 0, attackerUid: chispa.uid, target: { kind: 'hero', player: 1 } });
  assert.equal(ok.ok, true);
  const no = validateAction(r.state, data, { type: 'attack', player: 0, attackerUid: golem.uid, target: { kind: 'hero', player: 1 } });
  assert.equal(no.ok, false);
});

test('Guardián obliga a atacarlo primero', () => {
  const s = setup();
  const a = put(s, 0, 'n2');
  const g = put(s, 1, 'm1');
  assert.throws(() => apply(s, { type: 'attack', player: 0, attackerUid: a.uid, target: { kind: 'hero', player: 1 } }), InvalidActionError);
  const r = apply(s, { type: 'attack', player: 0, attackerUid: a.uid, target: { kind: 'unit', uid: g.uid } });
  assert.equal(r.state.players[1].board.length, 0); // Perla 1/3 recibe 3 y muere
  assert.equal(r.state.players[0].board[0].health, 3); // Gólem 3/4 recibe 1
});

test('combate simultáneo y el daño persiste', () => {
  const s = setup();
  const lobo = put(s, 0, 'r2'); // 3/2
  const heraldo = put(s, 1, 's2'); // 2/3 (+1 de día)
  const r = apply(s, { type: 'attack', player: 0, attackerUid: lobo.uid, target: { kind: 'unit', uid: heraldo.uid } });
  assert.equal(r.state.players[0].board.length, 0);
  assert.equal(r.state.players[1].board.length, 0);
  assert.ok(r.events.some((e) => e.type === 'unitDied'));
});

test('Escudo absorbe el primer daño, incluso con Veneno', () => {
  const s = setup();
  const anguila = put(s, 0, 'm4'); // 2/2 veneno
  const centinela = put(s, 1, 's7'); // 4/5 guardián escudo
  const r = apply(s, { type: 'attack', player: 0, attackerUid: anguila.uid, target: { kind: 'unit', uid: centinela.uid } });
  const c = r.state.players[1].board[0];
  assert.equal(c.shield, false);
  assert.equal(c.health, 5);
  assert.equal(r.state.players[0].board.length, 0); // la anguila recibe 4
});

test('Veneno destruye sin importar la vida', () => {
  const s = setup();
  const aracne = put(s, 0, 'u4'); // 1/4 veneno
  const vigia = put(s, 1, 'n3'); // 2/7
  const r = apply(s, { type: 'attack', player: 0, attackerUid: aracne.uid, target: { kind: 'unit', uid: vigia.uid } });
  assert.equal(r.state.players[1].board.length, 0);
  assert.equal(r.state.players[0].board[0].health, 2);
});

test('Robo vital cura al héroe sin superar el máximo', () => {
  const s = setup();
  s.players[0].health = 20;
  const acolito = put(s, 0, 'u2'); // 2/3 vital
  const r = apply(s, { type: 'attack', player: 0, attackerUid: acolito.uid, target: { kind: 'hero', player: 1 } });
  assert.equal(r.state.players[0].health, 22);
  assert.equal(r.state.players[1].health, 23);
  s.players[0].health = 25;
  const r2 = apply(s, { type: 'attack', player: 0, attackerUid: acolito.uid, target: { kind: 'hero', player: 1 } });
  assert.equal(r2.state.players[0].health, 25);
});

test('Al morir: Brote Tenaz deja una Semilla', () => {
  const s = setup();
  const lobo = put(s, 0, 'r2');
  const brote = put(s, 1, 'r1');
  const r = apply(s, { type: 'attack', player: 0, attackerUid: lobo.uid, target: { kind: 'unit', uid: brote.uid } });
  assert.deepEqual(r.state.players[1].board.map((u) => u.cardId), ['t1']);
});

test('hechizos con objetivo: Lanza Solar necesita objetivo válido', () => {
  const s = setup();
  giveHand(s, 0, ['s3']);
  assert.throws(() => apply(s, { type: 'playCard', player: 0, handIndex: 0 }), InvalidActionError);
  const r = apply(s, { type: 'playCard', player: 0, handIndex: 0, target: { kind: 'hero', player: 1 } });
  assert.equal(r.state.players[1].health, 22);
});

test('Canto Abisal no se puede jugar sin criaturas enemigas', () => {
  const s = setup(['nerea', 'tarn']);
  giveHand(s, 0, ['m8']);
  assert.equal(validateAction(s, data, { type: 'playCard', player: 0, handIndex: 0 }).ok, false);
});

test('Eclipse Total fuerza la Noche y refuerza aliadas', () => {
  const s = setup(['vesper', 'tarn']);
  const polilla = put(s, 0, 'u1');
  giveHand(s, 0, ['u8']);
  const r = apply(s, { type: 'playCard', player: 0, handIndex: 0 });
  assert.equal(r.state.phase, 'noche');
  const u = r.state.players[0].board[0];
  assert.equal(u.uid, polilla.uid);
  assert.equal(effectiveAttack(r.state, data, u), 4); // 1 +1 buff +2 noche
  assert.equal(u.maxHealth, 3);
});

test('Segador Eclipsado daña a todas las demás criaturas, también las propias', () => {
  const s = setup(['vesper', 'tarn']);
  put(s, 0, 'u1');
  put(s, 1, 'r4');
  giveHand(s, 0, ['u7']);
  const r = apply(s, { type: 'playCard', player: 0, handIndex: 0 });
  assert.deepEqual(r.state.players[0].board.map((u) => u.cardId), ['u7']);
  assert.equal(r.state.players[1].board.length, 0);
});

test('mesa máxima de 6 y las invocaciones se detienen', () => {
  const s = setup(['tarn', 'nerea']);
  for (let i = 0; i < 5; i++) put(s, 0, 't1');
  giveHand(s, 0, ['r4']); // Madre Enjambre + 2 semillas
  const r = apply(s, { type: 'playCard', player: 0, handIndex: 0 });
  assert.equal(r.state.players[0].board.length, 6);
});

test('fatiga creciente con el mazo vacío', () => {
  let s = setup();
  s.players[1].deck = [];
  s = apply(s, { type: 'endTurn', player: 0 }).state;
  assert.equal(s.players[1].health, 24);
  s = apply(s, { type: 'endTurn', player: 1 }).state;
  s = apply(s, { type: 'endTurn', player: 0 }).state;
  assert.equal(s.players[1].health, 22);
});

test('mano llena quema la carta robada', () => {
  let s = setup();
  s.players[1].hand = Array(9).fill('n2');
  const r = apply(s, { type: 'endTurn', player: 0 });
  assert.equal(r.state.players[1].hand.length, 9);
  assert.ok(r.events.some((e) => e.type === 'cardBurned'));
});

test('victoria al llegar a 0 de vida y no se aceptan más acciones', () => {
  const s = setup();
  s.players[1].health = 3;
  giveHand(s, 0, ['s3']);
  const r = apply(s, { type: 'playCard', player: 0, handIndex: 0, target: { kind: 'hero', player: 1 } });
  assert.equal(r.state.winner, 0);
  assert.equal(validateAction(r.state, data, { type: 'endTurn', player: 0 }).ok, false);
});

test('applyAction no modifica el estado de entrada', () => {
  const s = setup();
  const before = hashState(s);
  apply(s, { type: 'endTurn', player: 0 });
  assert.equal(hashState(s), before);
});

test('determinismo: misma semilla y acciones ⇒ mismo estado', () => {
  const run = () => {
    let s = createGame(data, { heroes: ['tarn', 'vesper'], seed: 7 }).state;
    for (let i = 0; i < 300 && s.winner === null; i++) s = apply(s, chooseAction(s, data, s.current)).state;
    return hashState(s);
  };
  assert.equal(run(), run());
});

test('viewFor oculta la mano y el mazo del rival', () => {
  const s = setup();
  const v = viewFor(s, 0);
  assert.ok(v.players[0].hand);
  assert.equal(v.players[1].hand, undefined);
  assert.equal(v.players[1].handCount, s.players[1].hand.length);
  assert.equal((v as unknown as { rng?: number }).rng, undefined);
});

test('getLegalActions solo devuelve acciones válidas', () => {
  let s = setup(['aurelia', 'nerea'], 99);
  for (let step = 0; step < 200 && s.winner === null; step++) {
    const legal = getLegalActions(s, data, s.current);
    for (const a of legal) assert.equal(validateAction(s, data, a).ok, true, JSON.stringify(a));
    s = apply(s, legal[(step * 7) % legal.length]).state;
  }
});

test('fuzz: 300 partidas IA contra IA terminan y respetan invariantes', () => {
  const heroes = Object.keys(data.heroes);
  for (let g = 0; g < 300; g++) {
    const h0 = heroes[g % 4];
    const h1 = heroes[(g >> 2) % 4];
    let s = createGame(data, { heroes: [h0, h1], seed: 1000 + g }).state;
    let steps = 0;
    while (s.winner === null && steps < 2000) {
      s = apply(s, chooseAction(s, data, s.current)).state;
      steps++;
      for (const p of s.players) {
        assert.ok(p.board.length <= data.rules.maxBoard);
        assert.ok(p.hand.length <= data.rules.maxHand);
        assert.ok(p.health <= p.maxHealth);
        assert.ok(p.board.every((u) => !u.dead && u.health > 0));
      }
    }
    assert.notEqual(s.winner, null, `partida ${g} sin terminar`);
  }
});
