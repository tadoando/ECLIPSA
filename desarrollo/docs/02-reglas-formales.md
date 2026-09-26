# 02 · Reglas formales (v0.1.0)

Especificación precisa, pensada para implementadores. La implementación de referencia está en `packages/core/src/engine.ts`. Las constantes están en `data/rules.json`.

## R1. Componentes
- **Héroe**: vida inicial y máxima 25. Tiene un poder que cuesta 2 brasas.
- **Mazo**: 20 cartas. Las cartas de la facción del héroe ×2 y las neutrales ×1. Las fichas (`token: true`) nunca van en el mazo.
- **Zonas por jugador**: mazo (oculto, ordenado), mano (oculta al rival, máximo 9) y mesa (pública, máximo 6 criaturas).

## R2. Preparación
1. Se barajan ambos mazos con el RNG de la partida (semilla → mulberry32 → Fisher–Yates).
2. Si no se indica quién empieza, se sortea con el RNG: `valor < 0,5` → jugador 0.
3. Quien empieza roba 3 cartas; el otro roba 4.
4. Comienza el primer turno (R3). La fase inicial es **Día**.

## R3. Comienzo de turno (en este orden)
1. `turno += 1`. Si el jugador activo es quien empezó la partida: `ronda += 1`, y si `ronda > 1` la fase alterna (Día ↔ Noche).
2. `brasasMáx = min(10, brasasMáx + 1)`; `brasas = brasasMáx`; el poder queda disponible.
3. Todas las criaturas del jugador activo despiertan (`dormida = false`, `yaAtacó = false`).
4. El jugador roba 1 carta (R4).

## R4. Robar
- Con el mazo vacío: `fatiga += 1` y el héroe recibe daño igual a `fatiga`.
- Con la mano en 9: la carta robada se quema (se descarta sin efecto).
- Si no, la carta va a la mano. El tope del mazo es el último elemento del arreglo `deck`.

## R5. Acciones del jugador activo
Se pueden hacer en cualquier orden y cantidad mientras sean legales:

| Acción | Condiciones |
|---|---|
| Jugar carta | coste ≤ brasas; si es criatura, menos de 6 criaturas vivas propias; si es un hechizo que requiere objetivo, debe existir al menos uno válido |
| Usar poder | no usado este turno; brasas ≥ coste; si invoca, mesa no llena; si requiere objetivo, debe existir uno |
| Atacar | la criatura es propia, está viva, no dormida, no atacó este turno y tiene ataque efectivo > 0; el objetivo está en R7 |
| Terminar turno | siempre |

**Objetivo requerido.** Una carta o poder necesita objetivo si alguno de sus efectos usa un objetivo elegido (`any`, `enemy`, `enemyCreature`, `friendlyCreature`, `anyCreature`). Se elige **un solo objetivo** por carta y todos los efectos elegidos lo comparten. Una **criatura** cuyo efecto requiere objetivo y no tiene objetivos válidos puede jugarse igualmente: el efecto no hace nada.

## R6. Jugar una carta
1. Se pagan las brasas y la carta sale de la mano.
2. Si es criatura, entra a la mesa **dormida** (salvo Furia), con Escudo activo si lo tiene.
3. Se resuelven los efectos `onPlay` en orden (ver doc 05).
4. Se resuelven las muertes (R9) y se comprueba la victoria (R10).

## R7. Objetivos de ataque
Si el rival tiene criaturas vivas con **Guardián**, solo son objetivo esas. Si no, el héroe rival y cualquier criatura rival.

## R8. Resolución de un ataque
1. El atacante queda con `yaAtacó = true`.
2. `A` = ataque efectivo del atacante. Si el objetivo es una criatura, `B` = su ataque efectivo, calculado **antes** de aplicar daño.
3. Daño `A` al objetivo, con el atacante como fuente.
4. Si el objetivo es una criatura: daño `B` al atacante, con el objetivo como fuente. Los héroes no devuelven daño.
5. Muertes (R9) y victoria (R10).

**Ataque efectivo** = ataque (con refuerzos) + bono de fase vigente (`dayBonus` de Día o `nightBonus` de Noche), con mínimo 0.

## R8b. Aplicar daño a un objetivo
- Si es una criatura con Escudo: se rompe el escudo, no hay daño y **no se aplican** Veneno ni Robo vital.
- Si no: la vida baja en la cantidad. Si la fuente tiene **Veneno** y el objetivo es una criatura, su vida queda en ≤ 0. Con vida ≤ 0 queda marcada como muerta (sigue en mesa hasta R9).
- Si la fuente tiene **Robo vital**, su héroe se cura esa cantidad, sin superar su máximo.
- Los hechizos y los poderes no tienen fuente: no aplican Veneno ni Robo vital.
- Daño 0 o negativo no tiene ningún efecto.

## R9. Muertes
Se repite hasta que no quede ninguna criatura muerta. Para el jugador 0 y luego para el jugador 1: se retiran de su mesa todas sus criaturas marcadas y, por cada una en orden de mesa, se resuelven sus efectos `onDeath` controlados por su dueño.

## R10. Victoria
Tras cada acción y tras resolver muertes: si un héroe tiene vida ≤ 0, gana el otro. Si ambos, empate. Una partida terminada no acepta acciones.

## R11. Fin de turno
Se resuelven muertes y victoria. Si la partida sigue, empieza el turno del rival (R3). Las brasas no gastadas se pierden. Las criaturas dañadas **no se curan**.

## R12. Fase
- Al empezar cada ronda nueva la fase alterna.
- `setPhase` fija la fase; si ya era esa, no pasa nada. La fase forzada dura hasta la siguiente alternancia.
- Los bonos de fase solo afectan al ataque.

## R13. Palabras clave
| Clave | Id | Regla |
|---|---|---|
| Guardián | `guardian` | R7 |
| Furia | `furia` | Entra despierta |
| Escudo | `escudo` | R8b, primer daño anulado. `destroy` lo ignora |
| Veneno | `veneno` | R8b, destruye criaturas a las que daña |
| Robo vital | `vital` | R8b, cura a su héroe el daño infligido |

## R14. Límites de mesa
Las invocaciones se detienen en cuanto hay 6 criaturas vivas propias. Las muertas pendientes de R9 no cuentan.

## Cuestiones abiertas (para v0.2)
- ¿Mulligan? Propuesta: devolver hasta 3 cartas al inicio.
- ¿Compensación para quien va segundo? Hoy es 1 carta más. La simulación da 56 % de victoria a quien empieza; se propone añadir una carta «Brasa extra» de coste 0.
- ¿Efectos al cambiar de fase («Al amanecer», «Al anochecer»)? Encajan con la identidad del juego.
