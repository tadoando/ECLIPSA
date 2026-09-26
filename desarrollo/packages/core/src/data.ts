import type { CardDef, GameData, HeroDef, RulesConfig } from './types.js';

/**
 * Construye el GameData a partir de los JSON de /data.
 * Los clientes pueden cargar los JSON desde disco, red o empaquetados en la app.
 */
export function buildGameData(cards: CardDef[], heroes: HeroDef[], rules: RulesConfig): GameData {
  const c: Record<string, CardDef> = {};
  for (const card of cards) {
    if (c[card.id]) throw new Error(`Carta duplicada: ${card.id}`);
    c[card.id] = card;
  }
  const h: Record<string, HeroDef> = {};
  for (const hero of heroes) h[hero.id] = hero;
  validateData({ cards: c, heroes: h, rules });
  return { cards: c, heroes: h, rules };
}

/** Comprobaciones de integridad de datos. Lanza un error con todos los problemas encontrados. */
export function validateData(data: GameData): void {
  const errors: string[] = [];
  const checkEffects = (owner: string, effects: unknown[] | undefined) => {
    for (const e of (effects ?? []) as { do: string; token?: string }[]) {
      if (e.do === 'summon' && (!e.token || !data.cards[e.token])) errors.push(`${owner}: ficha inexistente ${e.token}`);
    }
  };
  for (const card of Object.values(data.cards)) {
    if (card.type === 'creature' && (card.attack === undefined || card.health === undefined))
      errors.push(`${card.id}: criatura sin ataque o vida`);
    if (card.cost < 0 || card.cost > 10) errors.push(`${card.id}: coste fuera de rango`);
    checkEffects(card.id, card.onPlay);
    checkEffects(card.id, card.onDeath);
  }
  for (const hero of Object.values(data.heroes)) checkEffects(hero.id, hero.power.effects);
  if (errors.length) throw new Error('Datos inválidos:\n' + errors.join('\n'));
}

/** Mazo por defecto de la v0.1: cartas de la facción ×2 + neutrales ×1. */
export function defaultDeck(data: GameData, heroId: string): string[] {
  const hero = data.heroes[heroId];
  if (!hero) throw new Error(`Héroe desconocido: ${heroId}`);
  const { factionCopies, neutralCopies } = data.rules.deckComposition;
  const deck: string[] = [];
  for (const card of Object.values(data.cards)) {
    if (card.token) continue;
    const copies = card.faction === hero.faction ? factionCopies : card.faction === 'neutral' ? neutralCopies : 0;
    for (let i = 0; i < copies; i++) deck.push(card.id);
  }
  return deck;
}
