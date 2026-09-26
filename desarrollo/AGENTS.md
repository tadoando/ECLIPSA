# AGENTS.md · guía para IAs y colaboradores

Este archivo explica cómo trabajar en Eclipsia sin romper nada. Aplica a cualquier asistente de IA (Claude, ChatGPT, Copilot, Cursor, Gemini…) y a cualquier persona.

## 1. Fuentes de verdad (en este orden)

1. **`data/*.json`**: el contenido del juego (cartas, héroes, constantes). Nunca pongas valores de cartas en el código.
2. **`packages/core/`**: la implementación de referencia de las reglas. Si otro código (el prototipo web o un port) se comporta distinto, el que está mal es el otro.
3. **`docs/02-reglas-formales.md`**: las reglas en lenguaje natural. Debe coincidir con el motor. Si cambias uno, cambia el otro.
4. **`design/tokens/tokens.json`**: colores, tamaños y tiempos de animación.

`prototype-web/eclipsia.html` es una **referencia visual y de interacción**, no de reglas. Su motor es una copia anterior escrita a mano.

## 2. Invariantes que no se pueden romper

- **Determinismo.** Toda la aleatoriedad sale de `GameState.rng` (mulberry32). Prohibido usar `Math.random()`, la hora del sistema o el orden de iteración de objetos dentro del motor.
- **Pureza.** `applyAction(estado, datos, acción)` no modifica el estado de entrada y devuelve `{ state, events }`.
- **Estado serializable.** `GameState` es JSON puro: nada de clases, funciones, `Map` ni `Set`.
- **El motor no conoce la UI.** Nada de DOM, motor gráfico, red ni tiempo real en `packages/core/src` (salvo `node-data.ts`, que es solo para Node).
- **Los ids de carta son estables.** No renombres ni reutilices un `id`. Para retirar una carta, márcala o elimínala, pero no reasignes su id.
- **Idioma.** El texto visible del juego va en español. Los identificadores de código van en inglés, salvo los valores de dominio ya existentes: `dia`, `noche`, `furia`, `escudo`, `veneno`, `vital`, `guardian` y los ids de facción.

## 3. Tareas frecuentes

### Cambiar el balance de una carta existente
1. Edita el valor en `data/cards.json` (y su `text` si cambia lo que dice).
2. `npm test` en `packages/core`.
3. `npm run simulate` y compara con `docs/15-pruebas-y-balance.resultados.md`.
4. `npm run vectors` (los hashes cambian: es esperado).
5. Anota el cambio en `CHANGELOG.md`.

### Añadir una carta que usa efectos existentes
1. Añade el objeto a `data/cards.json`. Usa un `id` nuevo y un `collector` consecutivo, como `S-09`.
2. Valida contra `data/schema/card.schema.json`.
3. Si la IA debe tratarla de forma especial, añade un caso en `wantsToPlay()` de `packages/core/src/ai.ts`.
4. Añade una prueba en `packages/core/test/engine.test.ts` si la carta tiene una interacción nueva.
5. Pasos 2 a 5 de la sección anterior. El arte se regenera con `design/art-generator/`.

### Añadir un tipo de efecto nuevo
Sigue `docs/05-motor-de-efectos.md`. En resumen: tipo en `types.ts`, caso en `runEffects()` de `engine.ts`, esquema en `data/schema/effect.schema.json`, prueba, documentación y, si aplica, heurística en `ai.ts`.

### Añadir una palabra clave
Hay que tocar `types.ts` (`Keyword`), `data/keywords.json`, la lógica en `engine.ts` (normalmente en `damage()`, `canAttack()` o `attackTargets()`), el esquema, un ícono en `design/assets/icons/`, pruebas y `docs/02-reglas-formales.md`.

### Portar el motor a otro lenguaje (GDScript, C#, Dart…)
Sigue `docs/migracion/00-estrategia.md`. El port está terminado cuando reproduce **todos** los hashes de `data/test-vectors/games.json`.

## 4. Antes de terminar cualquier cambio

- [ ] `npm test` pasa.
- [ ] Si cambió una regla: `docs/02-reglas-formales.md` y el manual están actualizados, o hay una nota pendiente en `CHANGELOG.md`.
- [ ] Si cambió el contenido: se regeneraron `npm run vectors` y `npm run simulate`.
- [ ] No hay secretos (claves, contraseñas, tokens) en ningún archivo. Usa variables de entorno y valores de ejemplo como `TU_API_KEY_AQUI`.

## 5. Contexto de producto

- Plataforma objetivo: Android e iOS. El motor gráfico está por decidir (ver `docs/migracion/`).
- Modo inicial: un jugador contra la IA. Después: PvP en línea con servidor autoritativo.
- Público: jugadores casuales y medios de TCG. Partidas de 8 a 12 minutos (unas 13 rondas).
- Pendiente de decisión del dueño del producto: monetización, modelo de colección (sobres o desbloqueo) y nombre definitivo.
