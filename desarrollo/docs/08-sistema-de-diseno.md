# 08 · Sistema de diseño

Fuente de verdad: `design/tokens/tokens.json` (también en `tokens.css` para la web). Íconos en `design/assets/icons/`.

## Principios
- **Mesa nocturna**: tema único oscuro, con fondo índigo y ciruela (`bg #15131d`). No hay tema claro en la partida; los menús pueden tenerlo más adelante.
- **Oro de eclipse** (`gold #e6b85c`, `gold2 #f4d58d`) para lo seleccionado, el valor y el ataque.
- **Color de facción** solo en marcos, retratos y títulos de facción. Nunca para estados.
- **Colores semánticos** separados del acento: jugable/curación `#6fcf8e`, objetivo/daño `#e8675d`, coste `#e8663a`, vida `#c23b4e`.

## Tipografía
| Rol | Fuente | Uso |
|---|---|---|
| Display | **Grenze** 500–700 | Nombres de carta, héroes, números de estadísticas y títulos |
| Texto | **Alegreya Sans** 400–700 | Texto de reglas, interfaz |
| Datos | **IBM Plex Mono** 400–500 | Crónica, contadores, número de colección |

Las tres tienen licencia SIL OFL. Se descargan de Google Fonts y se incluyen en la app (no cargarlas en tiempo de ejecución).

## Carta (proporción 5:7)
Todas las medidas son **% del ancho de la carta**, así la misma carta escala a la mano (104–128 pt), la vista ampliada (200 pt) o la galería.

| Elemento | Medida | Estilo |
|---|---|---|
| Marco | borde 2 %, radio 7 % | color de facción |
| Gema de coste | círculo 22 %, desplazado −4 % arriba e izquierda | degradado ámbar → `ember`, número Grenze 14 % |
| Ilustración | 45 % del alto | los hechizos tienen la base redondeada |
| Nombre | Grenze 600, 11 % | centrado, `text-wrap: balance` |
| Tipo · facción | 5,6 % mayúsculas, espaciado 0,1 em | color de facción |
| Caja de texto | fondo `parchment`, tinta `ink`, 7,9 % | palabras clave en negrita |
| Ataque / vida | círculos 21 %, en las esquinas inferiores (−4 %) | oro / carmesí |
| Número de colección | Plex Mono 4,8 % | abajo al centro |

## Criatura en mesa (4:5)
Ilustración a sangre, borde de facción 3,5 %, radio 12 %. Estadísticas en círculos del 32 %. Íconos de palabra clave apilados arriba a la derecha (24 %). **Guardián**: borde del 5,5 % y base en forma de escudo (radio inferior del 50 % / 32 %).

## Íconos
`kw-guardian.svg` (escudo), `kw-furia.svg` (rayo), `kw-escudo.svg` (anillo), `kw-veneno.svg` (gota), `kw-vital.svg` (corazón), `phase-dia.svg`, `phase-noche.svg`, `eclipse-logo.svg`. Todos en una rejilla de 16×16 y con `currentColor` para teñirlos con `color.keyword.*`.

## Movimiento
| Animación | ms |
|---|---|
| Embestida de ataque | 260 |
| Sacudida al recibir golpe | 350 |
| Muerte (desvanecer, escalar a 0,6 y rotar −8°) | 450 |
| Número flotante | 1100 |
| Cambio de fase (la luna cubre el sol, la mesa cambia de tono) | 1000, `cubic-bezier(.6,0,.3,1)` |
| Cartel de turno | 1500 |
| Pausas de la IA | 1000 al empezar, 700 entre cartas, 420 entre ataques |

## Arte
El arte actual es **procedural y provisional** (`design/art-generator/art.js`): fondo con el degradado de la facción, polvo de estrellas, un motivo de facción (sol con rayos, olas, árbol, luna creciente, montañas) y, encima, una constelación (criaturas) o un sello circular (hechizos). Sirve como guía de composición para el arte final: ver `09-direccion-de-arte.md`.
