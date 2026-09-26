# ADR-0004 · Motor determinista con RNG en el estado

**Estado:** aceptada · v0.1

## Decisión
Toda la aleatoriedad usa mulberry32, con su estado dentro de `GameState.rng`. `applyAction` es una función pura.

## Consecuencias
- Semilla + acciones reproducen cualquier partida: repeticiones, soporte, detección de trampas y pruebas.
- El estado del RNG nunca debe llegar al cliente en línea (se podrían predecir los robos).
- Prohibido `Math.random()` en el motor. La IA de dificultad variable usa su propio RNG, fuera del estado.
