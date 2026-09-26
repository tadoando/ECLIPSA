# @eclipsia/core

Motor de reglas determinista de Eclipsia. Sin dependencias, sin UI.

```ts
import { createGame, applyAction, validateAction, getLegalActions, chooseAction, viewFor } from '@eclipsia/core';

let { state, events } = createGame(DATA, { heroes: ['tarn', 'vesper'], seed: 1234 });
const action = { type: 'endTurn', player: state.current } as const;
if (validateAction(state, DATA, action).ok) ({ state, events } = applyAction(state, DATA, action));
```

| Archivo | Contenido |
|---|---|
| `src/types.ts` | Contrato de tipos (datos, estado, acciones, eventos) |
| `src/rng.ts` | mulberry32 + barajado |
| `src/data.ts` | Construcción y validación de GameData, mazo por defecto |
| `src/engine.ts` | Reglas: crear partida, validar, aplicar, acciones legales, vista con información oculta |
| `src/ai.ts` | IA heurística |
| `src/hash.ts` | JSON canónico + FNV-1a para verificar ports |
| `src/node-data.ts` | Carga de `/data` desde disco (solo Node) |

Comandos: `npm test`, `npm run simulate -- 400`, `npm run vectors`.
