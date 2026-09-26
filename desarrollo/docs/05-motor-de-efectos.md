# 05 · Motor de efectos

Las cartas no tienen código propio: describen su comportamiento con una lista de **efectos**. El motor interpreta esa lista en `runEffects()` (`packages/core/src/engine.ts`).

## Vocabulario actual

| `do` | Parámetros | Qué hace |
|---|---|---|
| `damage` | `amount`, `target` | Daño sin fuente (no aplica Veneno ni Robo vital) |
| `heal` | `amount`, `target` | Cura sin superar el máximo |
| `draw` | `n` | El controlador roba `n` |
| `buff` | `atk`, `hp`, `target` | Suma ataque y vida (y vida máxima) a criaturas |
| `summon` | `token`, `n` | Invoca `n` fichas dormidas, hasta llenar la mesa |
| `destroy` | `target` | Destruye criaturas (ignora Escudo) |
| `energy` | `n` | Brasas extra este turno |
| `setPhase` | `value` (`dia`\|`noche`) | Fuerza la fase |
| `selfDamage` | `amount` | Daño al propio héroe |

## Objetivos (`target`)

**Elegidos por el jugador** (la carta pide un objetivo al jugarla):
`any` (cualquier héroe o criatura), `enemy` (héroe o criatura rival), `enemyCreature`, `friendlyCreature`, `anyCreature`.

**Automáticos**:
`enemyHero`, `ownHero`, `allEnemyCreatures`, `allEnemies` (criaturas rivales y héroe rival), `otherCreatures` (todas menos la propia carta), `otherFriendly`, `allFriendly`.

Regla: una carta pide **como máximo un** objetivo elegido. Si varios efectos usan objetivos elegidos, todos reciben el mismo.

## Disparadores
- `onPlay`: al jugar la carta («Al entrar» en criaturas, el efecto en hechizos).
- `onDeath`: al morir la criatura («Al morir»).
- Poder de héroe: `power.effects`.

## Ejemplos
```jsonc
// Lanza Solar
"onPlay": [{ "do": "damage", "amount": 3, "target": "any" }]
// Remolino: daño a una criatura enemiga + robar
"onPlay": [{ "do": "damage", "amount": 3, "target": "enemyCreature" }, { "do": "draw", "n": 1 }]
// Brote Tenaz
"onDeath": [{ "do": "summon", "token": "t1", "n": 1 }]
```

## Cómo añadir un efecto nuevo (ejemplo: `freeze`, congelar)
1. **Tipo**: en `types.ts` añade `| { do: 'freeze'; target: TargetSpec }` al tipo `Effect`. Si necesita estado, añade el campo a `Unit` (por ejemplo `frozen: boolean`).
2. **Motor**: en `runEffects()` añade el `case 'freeze'`. Emite un evento nuevo (`{ type: 'frozen', uid }`) y añádelo a `GameEvent`.
3. **Reglas relacionadas**: en `canAttack()`, una criatura congelada no ataca; en `startTurn()`, se descongela cuando corresponda.
4. **Esquema**: añade la variante a `data/schema/effect.schema.json`.
5. **IA**: en `chooseEffectTarget()` decide a quién congelar (normalmente al enemigo de más valor).
6. **Pruebas** en `test/engine.test.ts`.
7. **Documentación**: esta tabla, `02-reglas-formales.md`, `04-modelo-de-datos.md` (evento) y el manual.
8. `npm test && npm run vectors && npm run simulate`.

## Extensiones previstas (backlog)
| Efecto o disparador | Idea de carta |
|---|---|
| `onPhaseChange` («Al amanecer» / «Al anochecer») | Criaturas que crecen con cada cambio de fase |
| `onTurnStart` / `onTurnEnd` | Efectos de mantenimiento |
| `returnToHand` | Rebote de Marea |
| `silence` | Quitar palabras clave |
| `conditional` (`if: { phase: 'noche' }`) | «Si es de Noche, en su lugar…» |
| `randomTarget` | Daño a una criatura aleatoria (usa `GameState.rng`, nunca `Math.random`) |
