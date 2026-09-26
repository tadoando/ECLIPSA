# 04 · Modelo de datos

La definición exacta está en `packages/core/src/types.ts` y en `data/schema/*.json`. Aquí va el resumen para portar a otros lenguajes.

## Contenido estático

### CardDef (`data/cards.json`)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | Estable, en minúsculas (`s1`, `m7`, `t1`) |
| `collector` | string | `S-01`… Letra de facción: S Sol, M Marea, R Raíz, U Umbra, N Neutral, T Ficha |
| `name` | string | Nombre visible |
| `faction` | `sol`\|`marea`\|`raiz`\|`umbra`\|`neutral` | |
| `type` | `creature`\|`spell` | |
| `cost` | int 0–10 | |
| `attack`, `health` | int | Solo criaturas |
| `keywords` | Keyword[] | `guardian`, `furia`, `escudo`, `veneno`, `vital` |
| `dayBonus`, `nightBonus` | int | Ataque extra en esa fase |
| `onPlay`, `onDeath` | Effect[] | Ver doc 05 |
| `token` | bool | No va en mazos |
| `text` | string | Texto de reglas visible |
| `flavor` | string | Texto de ambientación |

### HeroDef (`data/heroes.json`)
`id`, `faction`, `name`, `title`, `lore`, `power { name, cost, text, effects[] }`.

### RulesConfig (`data/rules.json`)
Constantes: `startingHealth`, `deckComposition`, `startingHand`, `maxEnergy`, `maxHand`, `maxBoard`, `powerCost`, `phaseStart`, `phaseAlternatesEachRound`, `version`.

## Estado de partida (`GameState`)

```jsonc
{
  "schema": 1,
  "rulesVersion": "0.1.0",
  "rng": 123456,              // estado del mulberry32
  "players": [PlayerState, PlayerState],
  "current": 0,               // jugador activo
  "firstPlayer": 0,
  "round": 3, "turn": 5,
  "phase": "dia",             // "dia" | "noche"
  "winner": null,             // 0 | 1 | "draw" | null
  "nextUid": 17               // siguiente id de criatura
}
```

**PlayerState**: `heroId`, `health`, `maxHealth`, `deck: string[]` (tope = último), `hand: string[]`, `board: Unit[]`, `energy`, `maxEnergy`, `powerUsed`, `fatigue`.

**Unit**: `uid`, `cardId`, `owner`, `attack` (con refuerzos, sin bono de fase), `health`, `maxHealth`, `keywords[]`, `shield`, `asleep`, `attacked`, `dead`.

## Referencias de objetivo
```jsonc
{ "kind": "hero", "player": 1 }
{ "kind": "unit", "uid": 12 }
```

## Acciones (entrada)
```jsonc
{ "type": "playCard", "player": 0, "handIndex": 2, "target": { "kind": "hero", "player": 1 } }
{ "type": "usePower", "player": 0 }
{ "type": "attack",   "player": 0, "attackerUid": 7, "target": { "kind": "unit", "uid": 12 } }
{ "type": "endTurn",  "player": 0 }
```

## Eventos (salida)
| Evento | Campos | Uso en la UI |
|---|---|---|
| `gameStarted` | heroes, firstPlayer | Pantalla de inicio de duelo |
| `turnStarted` | player, round, turn | Cartel «Tu turno» |
| `phaseChanged` | phase, forced | Animar el disco de fase y el ambiente de la mesa |
| `cardDrawn` | player, cardId | Carta del mazo a la mano (ocultar `cardId` al rival) |
| `cardBurned` | player, cardId | Carta que se quema |
| `fatigue` | player, amount | Aviso de fatiga |
| `cardPlayed` | player, cardId, target? | Mostrar la carta en grande un instante |
| `powerUsed` | player, heroId, target? | Brillo del poder |
| `unitSummoned` | player, uid, cardId | Criatura entra a la mesa |
| `attackDeclared` | player, attackerUid, target | Embestida |
| `damaged` | target, amount | Número flotante rojo, sacudida |
| `shieldBroken` | uid | Romper halo dorado |
| `healed` | target, amount | Número verde |
| `buffed` | uid, attack, health | «+1/+1» dorado |
| `destroyed` | uid | Efecto de destrucción |
| `unitDied` | uid, cardId, owner | Animación de muerte, retirar de la mesa |
| `energyGained` | player, amount | «+1 brasa» |
| `gameOver` | winner | Pantalla de resultado |

## Persistencia recomendada (cliente)
| Clave | Contenido |
|---|---|
| `match.current` | `{ seed, heroes, actions[] }` (repetir acciones es más robusto que guardar el estado) |
| `settings` | sonido, velocidad de animación, idioma, movimiento reducido |
| `progress` | héroes desbloqueados, tutorial completado |

## Base de datos del servidor
Ver `docs/10-backend-y-multijugador.md`.
