# 01 · Visión y alcance

## Propuesta
Un TCG móvil de partidas cortas en el que **el tiempo del tablero es un recurso**. El ciclo Día/Noche alterna cada ronda, y decidir *cuándo* jugar una carta pesa tanto como decidir *qué* jugar.

## Pilares de diseño
1. **Legible en una pantalla de teléfono.** Como máximo 6 criaturas por lado, 5 palabras clave y textos de una línea.
2. **Partidas cortas.** Unas 13 rondas, de 8 a 12 minutos.
3. **Ritmo por fases.** Cada facción tiene una relación distinta con el Día y la Noche.
4. **Contenido como datos.** Cartas y héroes nuevos sin publicar una versión nueva de la app (ver ADR-0001).
5. **Justo en línea.** Servidor autoritativo y motor determinista (ADR-0003 y ADR-0004).

## Público
Jugadores de Hearthstone, Marvel Snap o Legends of Runeterra que buscan sesiones cortas, y jugadores casuales que se inician en los TCG.

## Alcance por versión

| Versión | Alcance |
|---|---|
| **v0.1 (actual)** | Reglas base, 4 héroes, 38 cartas, IA, prototipo web, motor probado |
| v0.2 | Balance (Vesper y Aurelia), mulligan, 8 cartas nuevas, efectos «al inicio de fase» |
| v0.3 · MVP móvil | App Android/iOS contra la IA, tutorial, colección básica, constructor de mazos |
| v0.4 | Cuentas, sincronización en la nube, PvP en línea (casual) |
| v1.0 | Ranking, temporadas, tienda, 100+ cartas, eventos |

## Fuera de alcance (por ahora)
Intercambio entre jugadores, NFT o blockchain, modo draft y juego cruzado con consolas.

## Métricas de éxito del MVP
- El tutorial se completa en más del 70 % de los casos.
- Duración media de partida entre 8 y 12 minutos.
- Retención D1 ≥ 35 % y D7 ≥ 12 % (referencias del género casual).
- Ningún héroe por fuera del 45–55 % de victoria en simulación y en partidas reales.
