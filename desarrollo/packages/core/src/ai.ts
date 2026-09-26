/**
 * IA del rival (heurística voraz). Devuelve UNA acción por llamada; el bucle que la usa
 * aplica la acción y vuelve a preguntar hasta recibir 'endTurn'.
 * Así la misma IA sirve en el cliente (modo un jugador), en el servidor (bots) y en simulaciones.
 * Ver docs/06-ia-del-rival.md para la lógica y cómo mejorarla.
 */
import {
  attackTargets,
  canAttack,
  canPlayCard,
  canUsePower,
  effectiveAttack,
  findUnit,
  requiredTarget,
  validTargets,
} from './engine.js';
import type { Action, ChosenTarget, Effect, GameData, GameState, PlayerIndex, TargetRef, Unit } from './types.js';

const other = (p: PlayerIndex): PlayerIndex => (p === 0 ? 1 : 0);

/** Valor aproximado de una criatura en mesa. */
export function unitValue(state: GameState, data: GameData, u: Unit): number {
  return (
    effectiveAttack(state, data, u) * 1.5 +
    u.health +
    (u.keywords.includes('guardian') ? 1 : 0) +
    (u.keywords.includes('veneno') ? 2 : 0)
  );
}

function best(units: Unit[], score: (u: Unit) => number): Unit | undefined {
  return [...units].sort((a, b) => score(b) - score(a))[0];
}

/** Elige objetivo para un efecto que lo requiere. null = no conviene / no hay. */
export function chooseEffectTarget(state: GameState, data: GameData, player: PlayerIndex, e: Effect, kind: ChosenTarget): TargetRef | null {
  const op = other(player);
  const ts = validTargets(state, kind, player);
  const units = ts.filter((r) => r.kind === 'unit').map((r) => findUnit(state, (r as { uid: number }).uid)!);
  const enemies = units.filter((u) => u.owner === op);
  const friends = units.filter((u) => u.owner === player);
  const enemyHero = ts.find((r) => r.kind === 'hero' && r.player === op);
  const val = (u: Unit) => unitValue(state, data, u);
  if (e.do === 'damage') {
    if (enemyHero && state.players[op].health <= e.amount) return enemyHero;
    const kill = best(enemies.filter((u) => !u.shield && u.health <= e.amount), val);
    if (kill) return { kind: 'unit', uid: kill.uid };
    if (enemyHero) return enemyHero;
    const b = best(enemies, val);
    return b ? { kind: 'unit', uid: b.uid } : null;
  }
  if (e.do === 'destroy') {
    const b = best(enemies, val);
    return b ? { kind: 'unit', uid: b.uid } : null;
  }
  if (e.do === 'buff' || e.do === 'heal') {
    const b = best(friends, val);
    return b ? { kind: 'unit', uid: b.uid } : null;
  }
  return ts[0] ?? null;
}

/** Reglas de "no juegues esto ahora" por carta. Añade aquí criterios específicos. */
function wantsToPlay(state: GameState, data: GameData, player: PlayerIndex, cardId: string): boolean {
  const me = state.players[player];
  const op = state.players[other(player)];
  const mine = me.board.filter((u) => !u.dead);
  const theirs = op.board.filter((u) => !u.dead);
  switch (cardId) {
    case 'u6': // Pacto de Sangre
      return me.health > 10 && me.hand.length < 7;
    case 'u8': // Eclipse Total
      return mine.length >= 2 || (state.phase === 'dia' && mine.some((u) => data.cards[u.cardId].nightBonus));
    case 'm3': // Marea Sanadora
      return me.health <= me.maxHealth - 4 || me.hand.length <= 2;
    case 's6': // Llamarada
      return theirs.length >= 2;
    case 'u7': // Segador Eclipsado
      return theirs.filter((u) => u.health <= 2).length >= mine.filter((u) => u.health <= 2).length;
    case 'r3': // Crecer
      return mine.length > 0;
  }
  return true;
}

function wantsPower(state: GameState, data: GameData, player: PlayerIndex): { ok: boolean; target?: TargetRef } {
  const me = state.players[player];
  const power = data.heroes[me.heroId].power;
  const kind = requiredTarget(power.effects);
  switch (me.heroId) {
    case 'nerea':
      return { ok: me.health <= me.maxHealth - 3 };
    case 'vesper':
      return { ok: me.health > 9 && me.hand.length < 8 };
    default:
      if (kind) {
        const t = chooseEffectTarget(state, data, player, power.effects.find((e) => 'target' in e && e.target === kind)!, kind);
        return t ? { ok: true, target: t } : { ok: false };
      }
      return { ok: true };
  }
}

function chooseAttackTarget(state: GameState, data: GameData, u: Unit): TargetRef {
  const player = u.owner;
  const op = state.players[other(player)];
  const ts = attackTargets(state, player);
  const a = effectiveAttack(state, data, u);
  const poison = u.keywords.includes('veneno');
  const units = ts.filter((r) => r.kind === 'unit').map((r) => findUnit(state, (r as { uid: number }).uid)!);
  const hero = ts.find((r) => r.kind === 'hero');
  const val = (x: Unit) => unitValue(state, data, x);
  if (!hero) {
    const kill = units.filter((t) => !t.shield && (t.health <= a || poison));
    const pick = [...(kill.length ? kill : units)].sort((x, y) => x.health - y.health)[0];
    return { kind: 'unit', uid: pick.uid };
  }
  const lethal = state.players[player].board.filter((x) => canAttack(state, data, x)).reduce((s, x) => s + effectiveAttack(state, data, x), 0);
  if (lethal >= op.health) return hero;
  let bestT: Unit | undefined;
  let bestS = 0;
  for (const t of units) {
    const ta = effectiveAttack(state, data, t);
    const kills = !t.shield && (t.health <= a || (poison && a > 0));
    const survives = u.shield || (ta < u.health && !(t.keywords.includes('veneno') && ta > 0));
    let s = 0;
    if (kills && survives) s = val(t) + 3;
    else if (kills && val(t) >= val(u)) s = val(t) - val(u) + 1;
    if (s > bestS) {
      bestS = s;
      bestT = t;
    }
  }
  return bestT ? { kind: 'unit', uid: bestT.uid } : hero;
}

/** Siguiente acción de la IA para `player`. Prioridad: cartas (mayor coste primero) → poder → ataques → fin. */
export function chooseAction(state: GameState, data: GameData, player: PlayerIndex): Action {
  const me = state.players[player];
  const options = me.hand
    .map((id, i) => ({ i, card: data.cards[id] }))
    .filter((o) => canPlayCard(state, data, player, o.i).ok && wantsToPlay(state, data, player, o.card.id))
    .sort((a, b) => b.card.cost - a.card.cost);
  for (const o of options) {
    const kind = requiredTarget(o.card.onPlay);
    if (!kind) return { type: 'playCard', player, handIndex: o.i };
    const eff = o.card.onPlay!.find((e) => 'target' in e && e.target === kind)!;
    const t = chooseEffectTarget(state, data, player, eff, kind);
    if (t) return { type: 'playCard', player, handIndex: o.i, target: t };
    if (o.card.type === 'creature' && validTargets(state, kind, player).length === 0) return { type: 'playCard', player, handIndex: o.i };
  }
  if (canUsePower(state, data, player).ok) {
    const w = wantsPower(state, data, player);
    if (w.ok) return { type: 'usePower', player, ...(w.target ? { target: w.target } : {}) };
  }
  const attacker = me.board.find((u) => canAttack(state, data, u));
  if (attacker) return { type: 'attack', player, attackerUid: attacker.uid, target: chooseAttackTarget(state, data, attacker) };
  return { type: 'endTurn', player };
}
