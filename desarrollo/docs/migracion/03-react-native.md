# Migración a React Native (Expo)

Es el camino con menos riesgo: **el motor no se porta**, se importa.

## Crear el proyecto
```bash
npx create-expo-app@latest eclipsia-app --template tabs   # TypeScript
cd eclipsia-app
npx expo install react-native-reanimated react-native-gesture-handler @shopify/react-native-skia expo-font expo-haptics expo-av
```

## Monorepo recomendado
```
eclipsia/
  package.json           { "workspaces": ["packages/*", "apps/*"] }
  data/                  ← este /data
  packages/core/         ← este packages/core
  apps/mobile/           ← la app Expo
  apps/server/           ← servidor Node (v0.4) con el mismo core
```
En `apps/mobile/package.json`: `"@eclipsia/core": "*"`. Metro soporta workspaces a partir de Expo SDK 50 (configura `watchFolders` si hace falta).

Para cargar los datos en la app sin `fs`:
```ts
import cards from '../../data/cards.json';
import heroes from '../../data/heroes.json';
import rules from '../../data/rules.json';
import { buildGameData, type CardDef, type HeroDef, type RulesConfig } from '@eclipsia/core';
export const DATA = buildGameData(cards as CardDef[], heroes as HeroDef[], rules as RulesConfig);
```
No importes `node-data.ts` en la app: usa `fs` y solo es para Node.

## Estado y eventos
```ts
// game/useGame.ts (Zustand o useReducer)
type Store = { state: GameState; queue: GameEvent[]; busy: boolean };
function dispatch(action: Action) {
  const v = validateAction(store.state, DATA, action);
  if (!v.ok) return showToast(v.reason);
  const { state, events } = applyAction(store.state, DATA, action);
  set({ queue: [...store.queue, ...events], pending: state });
}
// EventPlayer consume queue con animaciones Reanimated y al final aplica `pending`.
```

## Componentes
| Componente | Implementación |
|---|---|
| `Card` | `View` con `aspectRatio: 5/7`; tamaños derivados de `width` con `onLayout` o de una prop `width` |
| `Unit` | `aspectRatio: 4/5`; forma de Guardián con `borderBottomLeftRadius/RightRadius` grandes o una máscara de Skia |
| Arte | `Image` con los PNG de `design/assets/cards` o el `art.js` portado a Skia |
| Disco de fase | Skia: dos círculos y la traslación de la luna animada con `withTiming(1000)` |
| Mano | `FlatList` horizontal; arrastre con `Gesture.Pan()` |
| Números flotantes | `Animated.Text` absoluto, `translateY` −34 y opacidad a 0 en 1100 ms |

## Fuentes
Copia los TTF de Grenze, Alegreya Sans e IBM Plex Mono a `assets/fonts` y cárgalos con `useFonts` de `expo-font`.

## Builds
`eas build -p android` (AAB) y `eas build -p ios` (requiere cuenta de Apple Developer). `eas submit` publica en las tiendas.
