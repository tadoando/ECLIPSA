/**
 * Tipos del dominio de Eclipsia.
 * Este archivo es el contrato entre el motor, los clientes (Godot, Unity, React Native, web)
 * y el servidor. Si cambias un tipo aquí, actualiza docs/04-modelo-de-datos.md y los esquemas
 * de data/schema/.
 */

export type PlayerIndex = 0 | 1;
export type FactionId = 'sol' | 'marea' | 'raiz' | 'umbra' | 'neutral';
export type Keyword = 'guardian' | 'furia' | 'escudo' | 'veneno' | 'vital';
export type Phase = 'dia' | 'noche';
export type CardType = 'creature' | 'spell';

/** Objetivos que elige el jugador al jugar la carta o usar el poder. */
export type ChosenTarget = 'any' | 'enemy' | 'enemyCreature' | 'friendlyCreature' | 'anyCreature';
/** Objetivos que el motor resuelve solo. */
export type AutoTarget =
  | 'enemyHero'
  | 'ownHero'
  | 'allEnemyCreatures'
  | 'allEnemies'
  | 'otherCreatures'
  | 'otherFriendly'
  | 'allFriendly';
export type TargetSpec = ChosenTarget | AutoTarget;

export const CHOSEN_TARGETS: readonly ChosenTarget[] = ['any', 'enemy', 'enemyCreature', 'friendlyCreature', 'anyCreature'];

/** Vocabulario de efectos. Para añadir uno nuevo: ver docs/05-motor-de-efectos.md */
export type Effect =
  | { do: 'damage'; amount: number; target: TargetSpec }
  | { do: 'heal'; amount: number; target: TargetSpec }
  | { do: 'draw'; n: number }
  | { do: 'buff'; atk: number; hp: number; target: TargetSpec }
  | { do: 'summon'; token: string; n: number }
  | { do: 'destroy'; target: TargetSpec }
  | { do: 'energy'; n: number }
  | { do: 'setPhase'; value: Phase }
  | { do: 'selfDamage'; amount: number };

export interface CardDef {
  id: string;
  collector: string;
  name: string;
  faction: FactionId;
  type: CardType;
  cost: number;
  attack?: number;
  health?: number;
  keywords?: Keyword[];
  dayBonus?: number;
  nightBonus?: number;
  onPlay?: Effect[];
  onDeath?: Effect[];
  token?: boolean;
  text: string;
  flavor?: string;
}

export interface HeroDef {
  id: string;
  faction: FactionId;
  name: string;
  title: string;
  lore: string;
  power: { name: string; cost: number; text: string; effects: Effect[] };
}

export interface RulesConfig {
  version: string;
  startingHealth: number;
  deckComposition: { factionCopies: number; neutralCopies: number };
  startingHand: { first: number; second: number };
  maxEnergy: number;
  maxHand: number;
  maxBoard: number;
  powerCost: number;
  phaseStart: Phase;
  phaseAlternatesEachRound: boolean;
}

export interface GameData {
  cards: Record<string, CardDef>;
  heroes: Record<string, HeroDef>;
  rules: RulesConfig;
}

/* ---------------- Estado de partida (serializable a JSON) ---------------- */

export interface Unit {
  uid: number;
  cardId: string;
  owner: PlayerIndex;
  attack: number; // ataque base + buffs (sin bono de fase)
  health: number;
  maxHealth: number;
  keywords: Keyword[];
  shield: boolean;
  asleep: boolean;
  attacked: boolean;
  dead: boolean;
}

export interface PlayerState {
  heroId: string;
  health: number;
  maxHealth: number;
  deck: string[]; // el último elemento es el tope del mazo
  hand: string[];
  board: Unit[];
  energy: number;
  maxEnergy: number;
  powerUsed: boolean;
  fatigue: number;
}

export type Winner = PlayerIndex | 'draw' | null;

export interface GameState {
  schema: 1;
  rulesVersion: string;
  rng: number; // estado del generador pseudoaleatorio (determinista)
  players: [PlayerState, PlayerState];
  current: PlayerIndex;
  firstPlayer: PlayerIndex;
  round: number;
  turn: number;
  phase: Phase;
  winner: Winner;
  nextUid: number;
}

export type TargetRef = { kind: 'hero'; player: PlayerIndex } | { kind: 'unit'; uid: number };

/* ---------------- Acciones (entrada) ---------------- */

export type Action =
  | { type: 'playCard'; player: PlayerIndex; handIndex: number; target?: TargetRef }
  | { type: 'usePower'; player: PlayerIndex; target?: TargetRef }
  | { type: 'attack'; player: PlayerIndex; attackerUid: number; target: TargetRef }
  | { type: 'endTurn'; player: PlayerIndex };

/* ---------------- Eventos (salida, para animar la UI y registrar) ---------------- */

export type GameEvent =
  | { type: 'gameStarted'; heroes: [string, string]; firstPlayer: PlayerIndex }
  | { type: 'turnStarted'; player: PlayerIndex; round: number; turn: number }
  | { type: 'phaseChanged'; phase: Phase; forced: boolean }
  | { type: 'cardDrawn'; player: PlayerIndex; cardId: string }
  | { type: 'cardBurned'; player: PlayerIndex; cardId: string }
  | { type: 'fatigue'; player: PlayerIndex; amount: number }
  | { type: 'cardPlayed'; player: PlayerIndex; cardId: string; target?: TargetRef }
  | { type: 'powerUsed'; player: PlayerIndex; heroId: string; target?: TargetRef }
  | { type: 'unitSummoned'; player: PlayerIndex; uid: number; cardId: string }
  | { type: 'attackDeclared'; player: PlayerIndex; attackerUid: number; target: TargetRef }
  | { type: 'damaged'; target: TargetRef; amount: number }
  | { type: 'shieldBroken'; uid: number }
  | { type: 'healed'; target: TargetRef; amount: number }
  | { type: 'buffed'; uid: number; attack: number; health: number }
  | { type: 'destroyed'; uid: number }
  | { type: 'unitDied'; uid: number; cardId: string; owner: PlayerIndex }
  | { type: 'energyGained'; player: PlayerIndex; amount: number }
  | { type: 'gameOver'; winner: Exclude<Winner, null> };

export interface ApplyResult {
  state: GameState;
  events: GameEvent[];
}

export type Validation = { ok: true } | { ok: false; reason: string };
