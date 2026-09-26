# Migración a Android e iOS · estrategia

## Tres caminos

| | **React Native / Expo** | **Godot 4** | **Unity** |
|---|---|---|---|
| Lenguaje | TypeScript | GDScript (o C#) | C# |
| Motor de reglas | **Se importa tal cual** (`@eclipsia/core`) | Port a GDScript | Port a C# |
| Mismo código en servidor | Sí (Node) | No: port o servidor Node aparte | No: port o servidor Node aparte |
| Animación y efectos | Buena con Reanimated + Skia | Muy buena (2D nativo, partículas) | Excelente |
| Tamaño de la app | Medio | Pequeño | Grande |
| Coste | Gratis | Gratis y open source | Licencia según ingresos |
| Mejor si… | El equipo viene de la web y prioriza velocidad | Equipo pequeño, 2D, sin licencias | Ambición comercial alta, 3D, muchos assets de la tienda |

**Recomendación por defecto: React Native + Expo** para el MVP, porque el motor ya probado se reutiliza sin reescribirlo y el servidor usa el mismo código. Si la prioridad es el pulido visual tipo videojuego, **Godot 4** con el motor portado.

## Qué se reutiliza en cualquier caso
- `data/*.json`: sin cambios.
- `design/tokens/tokens.json`: se traduce a constantes del motor elegido.
- `design/assets/`: PNG, JPG y SVG. En Godot o Unity, convierte los SVG a PNG en 2× y 3×.
- Toda la documentación, en especial `02-reglas-formales.md` y `07-ui-ux.md`.

## Portar el motor: procedimiento
1. Porta en este orden: `types` → `rng` (mulberry32) → `data` (carga de JSON) → `engine` → `ai` → `hash`.
2. Implementa `hashState` exactamente igual: JSON canónico (claves ordenadas, sin espacios, enteros sin decimales, `null`/`true`/`false`) y FNV-1a de 32 bits.
3. Pasa los vectores en este orden:
   - `rng.json`: tu `nextRandom(seed)` devuelve los mismos `values` y `states`.
   - `hash.json`: tu `hashState(state)` del estado de ejemplo da el mismo `hash`.
   - `games.json`: para cada partida, `createGame(seed, heroes)` da `initialHash`; después, cada `step.action` aplicada da `step.hash`.
4. Si un paso falla, compara el JSON canónico de tu estado con el del motor TS en ese paso. Normalmente la diferencia está en el orden de los eventos, en los redondeos o en el orden del barajado.

### Detalles que suelen romper la paridad
- **Enteros de 32 bits**: `Math.imul` y `>>>` de JavaScript. Ver los ports verificados en `01-godot.md` y `02-unity.md`.
- `GameState.rng` se guarda como **entero con signo** de 32 bits (`| 0` en JS).
- El tope del mazo es el **último** elemento.
- `Array.sort` no interviene en el motor, así que no hay problemas de estabilidad al ordenar.
- `structuredClone`: en otros lenguajes, copia profunda antes de modificar el estado.

## Plan de trabajo sugerido para el MVP
1. Proyecto base con navegación y fuentes. Carga de `data/*.json`.
2. Motor integrado o portado, con los vectores pasando en la integración continua.
3. Componentes `Card` y `Unit` según `08-sistema-de-diseno.md`, con una pantalla de galería para revisarlos.
4. Pantalla de mesa: estado estático, luego la entrada (toques), luego la cola de eventos animada.
5. Bucle de IA con las pausas de `tokens.motion.ai`.
6. Selección de héroe, resultado y reglas.
7. Guardado de partida, ajustes, sonido, tutorial.
8. Builds de prueba en TestFlight y Google Play (pista interna).
