/**
 * Motor de reglas de Eclipsia.
 *
 * Principios (ver docs/03-arquitectura.md):
 *  - Funciones puras hacia fuera: applyAction(estado, acción) -> { estado nuevo, eventos }.
 *    El estado de entrada nunca se modifica.
 *  - Determinista: toda la aleatoriedad sale de GameState.rng.
 *  - Sin dependencias de UI, red ni motor gráfico. Lo usan el servidor, la IA y cualquier cliente.
 */
import { nextRandom, shuffleInPlace } from './rng.js';
import { defaultDeck } from './data.js';
import {
  CHOSEN_TARGETS,
  type Action,
  type ApplyResult,
  type AutoTarget,
  type ChosenTarget,
  type Effect,
  type GameData,
  type GameEvent,
  type GameState,
  type Phase,
  type PlayerIndex,
  type PlayerState,
  type TargetRef,
  type TargetSpec,
  type Unit,
  type Validation,
} from './types.js';

export class InvalidActionError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'InvalidActionError';
  }
}

export interface CreateGameOptions {
  heroes: [string, string];
  seed: number;
  /** Si no se indica, se sortea con la semilla. */
  firstPlayer?: PlayerIndex;
  /** Mazos personalizados (ids de carta). Por defecto: defaultDeck(). */
  decks?: [string[], string[]];
}

/* ====================== Utilidades de consulta (sin efectos) ====================== */

const other = (p: PlayerIndex): PlayerIndex => (p === 0 ? 1 : 0);
export const sameTarget = (a?: TargetRef, b?: TargetRef): boolean =>
  !!a && !!b && a.kind === b.kind && (a.kind === 'hero' ? a.player === (b as typeof a).player : a.uid === (b as { uid: number }).uid);
const unitRef = (u: Unit): TargetRef => ({ kind: 'unit', uid: u.uid });
const heroRef = (player: PlayerIndex): TargetRef => ({ kind: 'hero', player });
const isChosen = (t: TargetSpec): t is ChosenTarget => (CHOSEN_TARGETS as readonly string[]).includes(t);
const living = (p: PlayerState) => p.board.filter((u) => !u.dead);

export function findUnit(state: GameState, uid: number): Unit | undefined {
  for (const p of state.players) for (const u of p.board) if (u.uid === uid) return u;
  return undefined;
}

export function phaseBonus(state: GameState, data: GameData, unit: Unit): number {
  const c = data.cards[unit.cardId];
  return state.phase === 'dia' ? c.dayBonus ?? 0 : c.nightBonus ?? 0;
}

/** Ataque efectivo = ataque (con buffs) + bono de fase, mínimo 0. */
export function effectiveAttack(state: GameState, data: GameData, unit: Unit): number {
  return Math.max(0, unit.attack + phaseBonus(state, data, unit));
}

export function canAttack(state: GameState, data: GameData, unit: Unit): boolean {
  return !unit.dead && !unit.attacked && !unit.asleep && effectiveAttack(state, data, unit) > 0;
}

/** El primer objetivo elegible de una lista de efectos (una carta solo pide un objetivo). */
export function requiredTarget(effects: Effect[] | undefined): ChosenTarget | null {
  for (const e of effects ?? []) if ('target' in e && isChosen(e.target)) return e.target;
  return null;
}

export function validTargets(state: GameState, kind: ChosenTarget, player: PlayerIndex): TargetRef[] {
  const me = state.players[player];
  const op = state.players[other(player)];
  const enemies = living(op).map(unitRef);
  const friends = living(me).map(unitRef);
  switch (kind) {
    case 'any':
      return [heroRef(other(player)), ...enemies, heroRef(player), ...friends];
    case 'enemy':
      return [heroRef(other(player)), ...enemies];
    case 'enemyCreature':
      return enemies;
    case 'friendlyCreature':
      return friends;
    case 'anyCreature':
      return [...enemies, ...friends];
  }
}

/** Si el rival tiene Guardianes, solo se puede atacar a ellos. */
export function attackTargets(state: GameState, player: PlayerIndex): TargetRef[] {
  const op = state.players[other(player)];
  const units = living(op);
  const guardians = units.filter((u) => u.keywords.includes('guardian'));
  if (guardians.length) return guardians.map(unitRef);
  return [heroRef(other(player)), ...units.map(unitRef)];
}

export function canPlayCard(state: GameState, data: GameData, player: PlayerIndex, handIndex: number): Validation {
  const p = state.players[player];
  const id = p.hand[handIndex];
  if (id === undefined) return { ok: false, reason: 'No hay carta en esa posición de la mano' };
  const card = data.cards[id];
  if (card.cost > p.energy) return { ok: false, reason: 'Brasas insuficientes' };
  if (card.type === 'creature' && living(p).length >= data.rules.maxBoard) return { ok: false, reason: 'Mesa llena' };
  const t = requiredTarget(card.onPlay);
  if (t && card.type === 'spell' && validTargets(state, t, player).length === 0)
    return { ok: false, reason: 'No hay objetivos válidos' };
  return { ok: true };
}

export function canUsePower(state: GameState, data: GameData, player: PlayerIndex): Validation {
  const p = state.players[player];
  const power = data.heroes[p.heroId].power;
  if (p.powerUsed) return { ok: false, reason: 'El poder ya se usó este turno' };
  if (p.energy < power.cost) return { ok: false, reason: 'Brasas insuficientes' };
  if (power.effects.some((e) => e.do === 'summon') && living(p).length >= data.rules.maxBoard)
    return { ok: false, reason: 'Mesa llena' };
  const t = requiredTarget(power.effects);
  if (t && validTargets(state, t, player).length === 0) return { ok: false, reason: 'No hay objetivos válidos' };
  return { ok: true };
}

export function validateAction(state: GameState, data: GameData, a: Action): Validation {
  if (state.winner !== null) return { ok: false, reason: 'La partida terminó' };
  if (a.player !== state.current) return { ok: false, reason: 'No es tu turno' };
  switch (a.type) {
    case 'endTurn':
      return { ok: true };
    case 'playCard': {
      const v = canPlayCard(state, data, a.player, a.handIndex);
      if (!v.ok) return v;
      const card = data.cards[state.players[a.player].hand[a.handIndex]];
      const t = requiredTarget(card.onPlay);
      if (t) {
        const vt = validTargets(state, t, a.player);
        if (a.target && !vt.some((x) => sameTarget(x, a.target))) return { ok: false, reason: 'Objetivo no válido' };
        if (!a.target && vt.length > 0) return { ok: false, reason: 'Esta carta necesita un objetivo' };
      } else if (a.target) return { ok: false, reason: 'Esta carta no usa objetivo' };
      return { ok: true };
    }
    case 'usePower': {
      const v = canUsePower(state, data, a.player);
      if (!v.ok) return v;
      const t = requiredTarget(data.heroes[state.players[a.player].heroId].power.effects);
      if (t && !validTargets(state, t, a.player).some((x) => sameTarget(x, a.target))) return { ok: false, reason: 'Objetivo no válido' };
      if (!t && a.target) return { ok: false, reason: 'Este poder no usa objetivo' };
      return { ok: true };
    }
    case 'attack': {
      const u = findUnit(state, a.attackerUid);
      if (!u || u.owner !== a.player) return { ok: false, reason: 'Atacante no válido' };
      if (!canAttack(state, data, u)) return { ok: false, reason: 'Esta criatura no puede atacar ahora' };
      if (!attackTargets(state, a.player).some((x) => sameTarget(x, a.target))) return { ok: false, reason: 'Objetivo no válido (¿hay un Guardián?)' };
      return { ok: true };
    }
  }
}

/** Todas las acciones legales del jugador en este estado. Útil para IA, UI y servidor. */
export function getLegalActions(state: GameState, data: GameData, player: PlayerIndex): Action[] {
  if (state.winner !== null || state.current !== player) return [];
  const out: Action[] = [];
  const p = state.players[player];
  p.hand.forEach((id, handIndex) => {
    if (!canPlayCard(state, data, player, handIndex).ok) return;
    const t = requiredTarget(data.cards[id].onPlay);
    const ts = t ? validTargets(state, t, player) : [];
    if (ts.length) ts.forEach((target) => out.push({ type: 'playCard', player, handIndex, target }));
    else out.push({ type: 'playCard', player, handIndex });
  });
  if (canUsePower(state, data, player).ok) {
    const t = requiredTarget(data.heroes[p.heroId].power.effects);
    if (t) validTargets(state, t, player).forEach((target) => out.push({ type: 'usePower', player, target }));
    else out.push({ type: 'usePower', player });
  }
  for (const u of p.board)
    if (canAttack(state, data, u)) attackTargets(state, player).forEach((target) => out.push({ type: 'attack', player, attackerUid: u.uid, target }));
  out.push({ type: 'endTurn', player });
  return out;
}

/* ====================== Mutación interna (sobre una copia) ====================== */

class Ctx {
  events: GameEvent[] = [];
  constructor(public s: GameState, public d: GameData) {}
  emit(e: GameEvent) {
    this.events.push(e);
  }
}

function makeUnit(ctx: Ctx, cardId: string, owner: PlayerIndex): Unit {
  const c = ctx.d.cards[cardId];
  const kw = [...(c.keywords ?? [])];
  return {
    uid: ctx.s.nextUid++,
    cardId,
    owner,
    attack: c.attack ?? 0,
    health: c.health ?? 1,
    maxHealth: c.health ?? 1,
    keywords: kw,
    shield: kw.includes('escudo'),
    asleep: !kw.includes('furia'),
    attacked: false,
    dead: false,
  };
}

function draw(ctx: Ctx, player: PlayerIndex, n: number) {
  const p = ctx.s.players[player];
  for (let i = 0; i < n; i++) {
    const id = p.deck.pop();
    if (id === undefined) {
      p.fatigue++;
      ctx.emit({ type: 'fatigue', player, amount: p.fatigue });
      damage(ctx, heroRef(player), p.fatigue, null);
      continue;
    }
    if (p.hand.length >= ctx.d.rules.maxHand) {
      ctx.emit({ type: 'cardBurned', player, cardId: id });
      continue;
    }
    p.hand.push(id);
    ctx.emit({ type: 'cardDrawn', player, cardId: id });
  }
}

function heal(ctx: Ctx, r: TargetRef, amount: number) {
  if (r.kind === 'unit') {
    const u = findUnit(ctx.s, r.uid);
    if (!u || u.dead) return;
    const h = Math.min(amount, u.maxHealth - u.health);
    if (h > 0) {
      u.health += h;
      ctx.emit({ type: 'healed', target: r, amount: h });
    }
  } else {
    const p = ctx.s.players[r.player];
    const h = Math.min(amount, p.maxHealth - p.health);
    if (h > 0) {
      p.health += h;
      ctx.emit({ type: 'healed', target: r, amount: h });
    }
  }
}

/** Aplica daño. `source` es la criatura que lo causa (para Veneno y Robo vital), o null. */
function damage(ctx: Ctx, r: TargetRef, amount: number, source: Unit | null): number {
  if (amount <= 0) return 0;
  if (r.kind === 'unit') {
    const u = findUnit(ctx.s, r.uid);
    if (!u || u.dead) return 0;
    if (u.shield) {
      u.shield = false;
      ctx.emit({ type: 'shieldBroken', uid: u.uid });
      return 0;
    }
    u.health -= amount;
    if (source && source.keywords.includes('veneno')) u.health = Math.min(u.health, 0);
    ctx.emit({ type: 'damaged', target: r, amount });
    if (u.health <= 0) u.dead = true;
  } else {
    ctx.s.players[r.player].health -= amount;
    ctx.emit({ type: 'damaged', target: r, amount });
  }
  if (source && source.keywords.includes('vital')) heal(ctx, heroRef(source.owner), amount);
  return amount;
}

function setPhase(ctx: Ctx, phase: Phase, forced: boolean) {
  if (ctx.s.phase === phase) return;
  ctx.s.phase = phase;
  ctx.emit({ type: 'phaseChanged', phase, forced });
}

function autoTargets(ctx: Ctx, kind: AutoTarget, player: PlayerIndex, self: Unit | null): TargetRef[] {
  const me = ctx.s.players[player];
  const op = ctx.s.players[other(player)];
  const sid = self?.uid ?? -1;
  switch (kind) {
    case 'enemyHero':
      return [heroRef(other(player))];
    case 'ownHero':
      return [heroRef(player)];
    case 'allEnemyCreatures':
      return living(op).map(unitRef);
    case 'allEnemies':
      return [...living(op).map(unitRef), heroRef(other(player))];
    case 'otherCreatures':
      return [...living(me), ...living(op)].filter((u) => u.uid !== sid).map(unitRef);
    case 'otherFriendly':
      return living(me).filter((u) => u.uid !== sid).map(unitRef);
    case 'allFriendly':
      return living(me).map(unitRef);
  }
}

interface EffectCtx {
  player: PlayerIndex;
  self: Unit | null;
  target?: TargetRef;
}

function resolveTargets(ctx: Ctx, spec: TargetSpec, ec: EffectCtx): TargetRef[] {
  if (isChosen(spec)) return ec.target ? [ec.target] : [];
  return autoTargets(ctx, spec, ec.player, ec.self);
}

function runEffects(ctx: Ctx, effects: Effect[] | undefined, ec: EffectCtx) {
  for (const e of effects ?? []) {
    const p = ctx.s.players[ec.player];
    switch (e.do) {
      case 'damage':
        resolveTargets(ctx, e.target, ec).forEach((r) => damage(ctx, r, e.amount, null));
        break;
      case 'heal':
        resolveTargets(ctx, e.target, ec).forEach((r) => heal(ctx, r, e.amount));
        break;
      case 'draw':
        draw(ctx, ec.player, e.n);
        break;
      case 'buff':
        resolveTargets(ctx, e.target, ec).forEach((r) => {
          if (r.kind !== 'unit') return;
          const u = findUnit(ctx.s, r.uid);
          if (!u || u.dead) return;
          u.attack += e.atk;
          u.health += e.hp;
          u.maxHealth += e.hp;
          ctx.emit({ type: 'buffed', uid: u.uid, attack: e.atk, health: e.hp });
        });
        break;
      case 'summon':
        for (let i = 0; i < e.n; i++) {
          if (living(p).length >= ctx.d.rules.maxBoard) break;
          const u = makeUnit(ctx, e.token, ec.player);
          p.board.push(u);
          ctx.emit({ type: 'unitSummoned', player: ec.player, uid: u.uid, cardId: u.cardId });
        }
        break;
      case 'destroy':
        resolveTargets(ctx, e.target, ec).forEach((r) => {
          const u = r.kind === 'unit' ? findUnit(ctx.s, r.uid) : undefined;
          if (u && !u.dead) {
            u.health = 0;
            u.dead = true;
            ctx.emit({ type: 'destroyed', uid: u.uid });
          }
        });
        break;
      case 'energy':
        p.energy += e.n;
        ctx.emit({ type: 'energyGained', player: ec.player, amount: e.n });
        break;
      case 'setPhase':
        setPhase(ctx, e.value, true);
        break;
      case 'selfDamage':
        damage(ctx, heroRef(ec.player), e.amount, null);
        break;
    }
  }
}

/** Retira criaturas muertas y resuelve «Al morir» hasta que la mesa quede estable. */
function resolveDeaths(ctx: Ctx) {
  for (let guard = 0; guard < 20; guard++) {
    let any = false;
    for (const p of ctx.s.players) {
      const dead = p.board.filter((u) => u.dead);
      if (!dead.length) continue;
      any = true;
      p.board = p.board.filter((u) => !u.dead);
      for (const u of dead) {
        ctx.emit({ type: 'unitDied', uid: u.uid, cardId: u.cardId, owner: u.owner });
        runEffects(ctx, ctx.d.cards[u.cardId].onDeath, { player: u.owner, self: null });
      }
    }
    if (!any) return;
  }
}

function checkWinner(ctx: Ctx) {
  if (ctx.s.winner !== null) return;
  const a = ctx.s.players[0].health <= 0;
  const b = ctx.s.players[1].health <= 0;
  if (!a && !b) return;
  ctx.s.winner = a && b ? 'draw' : a ? 1 : 0;
  ctx.emit({ type: 'gameOver', winner: ctx.s.winner });
}

function startTurn(ctx: Ctx, player: PlayerIndex) {
  const s = ctx.s;
  s.current = player;
  s.turn++;
  if (player === s.firstPlayer) {
    s.round++;
    if (s.round > 1 && ctx.d.rules.phaseAlternatesEachRound) setPhase(ctx, s.phase === 'dia' ? 'noche' : 'dia', false);
  }
  const p = s.players[player];
  p.maxEnergy = Math.min(ctx.d.rules.maxEnergy, p.maxEnergy + 1);
  p.energy = p.maxEnergy;
  p.powerUsed = false;
  for (const u of p.board) {
    u.asleep = false;
    u.attacked = false;
  }
  ctx.emit({ type: 'turnStarted', player, round: s.round, turn: s.turn });
  draw(ctx, player, 1);
}

/* ====================== API pública ====================== */

export function createGame(data: GameData, opts: CreateGameOptions): ApplyResult {
  let rng = opts.seed | 0;
  let first = opts.firstPlayer;
  if (first === undefined) {
    const [v, n] = nextRandom(rng);
    rng = n;
    first = v < 0.5 ? 0 : 1;
  }
  const mk = (i: PlayerIndex): PlayerState => {
    const deck = [...(opts.decks?.[i] ?? defaultDeck(data, opts.heroes[i]))];
    rng = shuffleInPlace(deck, rng);
    return {
      heroId: opts.heroes[i],
      health: data.rules.startingHealth,
      maxHealth: data.rules.startingHealth,
      deck,
      hand: [],
      board: [],
      energy: 0,
      maxEnergy: 0,
      powerUsed: false,
      fatigue: 0,
    };
  };
  const players: [PlayerState, PlayerState] = [mk(0), mk(1)];
  const state: GameState = {
    schema: 1,
    rulesVersion: data.rules.version,
    rng,
    players,
    current: first,
    firstPlayer: first,
    round: 0,
    turn: 0,
    phase: data.rules.phaseStart,
    winner: null,
    nextUid: 1,
  };
  const ctx = new Ctx(state, data);
  ctx.emit({ type: 'gameStarted', heroes: opts.heroes, firstPlayer: first });
  draw(ctx, first, data.rules.startingHand.first);
  draw(ctx, other(first), data.rules.startingHand.second);
  startTurn(ctx, first);
  checkWinner(ctx);
  return { state, events: ctx.events };
}

/** Aplica una acción validada. Lanza InvalidActionError si no es legal. No modifica `state`. */
export function applyAction(state: GameState, data: GameData, action: Action): ApplyResult {
  const v = validateAction(state, data, action);
  if (!v.ok) throw new InvalidActionError(v.reason);
  const ctx = new Ctx(structuredClone(state), data);
  const s = ctx.s;
  const pi = action.player;
  const p = s.players[pi];

  switch (action.type) {
    case 'playCard': {
      const cardId = p.hand[action.handIndex];
      const card = data.cards[cardId];
      p.energy -= card.cost;
      p.hand.splice(action.handIndex, 1);
      ctx.emit({ type: 'cardPlayed', player: pi, cardId, target: action.target });
      let self: Unit | null = null;
      if (card.type === 'creature') {
        self = makeUnit(ctx, cardId, pi);
        p.board.push(self);
        ctx.emit({ type: 'unitSummoned', player: pi, uid: self.uid, cardId });
      }
      runEffects(ctx, card.onPlay, { player: pi, self, target: action.target });
      break;
    }
    case 'usePower': {
      const power = data.heroes[p.heroId].power;
      p.energy -= power.cost;
      p.powerUsed = true;
      ctx.emit({ type: 'powerUsed', player: pi, heroId: p.heroId, target: action.target });
      runEffects(ctx, power.effects, { player: pi, self: null, target: action.target });
      break;
    }
    case 'attack': {
      const u = findUnit(s, action.attackerUid)!;
      u.attacked = true;
      ctx.emit({ type: 'attackDeclared', player: pi, attackerUid: u.uid, target: action.target });
      const atk = effectiveAttack(s, data, u);
      if (action.target.kind === 'unit') {
        const t = findUnit(s, action.target.uid)!;
        const back = effectiveAttack(s, data, t);
        damage(ctx, action.target, atk, u);
        damage(ctx, unitRef(u), back, t);
      } else {
        damage(ctx, action.target, atk, u);
      }
      break;
    }
    case 'endTurn': {
      resolveDeaths(ctx);
      checkWinner(ctx);
      if (s.winner === null) startTurn(ctx, other(pi));
      break;
    }
  }
  resolveDeaths(ctx);
  checkWinner(ctx);
  return { state: s, events: ctx.events };
}

/* ====================== Vista para un jugador (información oculta) ====================== */

export interface PlayerView extends Omit<GameState, 'players' | 'rng'> {
  you: PlayerIndex;
  players: [PublicPlayer, PublicPlayer];
}
export interface PublicPlayer extends Omit<PlayerState, 'deck' | 'hand'> {
  deckCount: number;
  handCount: number;
  hand?: string[]; // solo para el propio jugador
}

/** Lo que el servidor envía a cada cliente: sin el mazo ni la mano del rival, sin estado del RNG. */
export function viewFor(state: GameState, you: PlayerIndex): PlayerView {
  const { rng: _rng, players, ...rest } = structuredClone(state);
  const pub = (p: PlayerState, own: boolean): PublicPlayer => {
    const { deck, hand, ...r } = p;
    return { ...r, deckCount: deck.length, handCount: hand.length, ...(own ? { hand } : {}) };
  };
  return { ...rest, you, players: [pub(players[0], you === 0), pub(players[1], you === 1)] };
}
