# Eclipsia · juego de cartas (v0.1)

Un juego de cartas coleccionables (TCG) original. Hay un demo web jugable contra la máquina, el diseño de las reglas y un manual en PDF.

## Estructura de la carpeta

| Carpeta | Contenido |
|---|---|
| `manual/` | `Manual_Eclipsia_v0.1.pdf`: el manual del juego (14 páginas) |
| `demo-web/` | `eclipsia.html`: el demo jugable. Se abre con doble clic en cualquier navegador |
| `diseno/` | `diseno-v0.1.md` (resumen de reglas y cartas), `cartas.csv` (para Excel) y `cartas.json` (la base de datos que usará el motor) |
| `arte/cartas/` | Imagen de cada carta, nombrada por número de colección (S-01, M-01, R-01, U-01, N-01, T-01) |
| `arte/heroes/` | Retratos de los 4 héroes |

Demo en línea (privado): https://claude.ai/artifact/NAoQHNFBtsAskHxEi9pdXb

## Cómo hacer cambios

Las cartas, los héroes y sus efectos son datos. Para cambiar el balance o crear cartas nuevas:

1. Edita `diseno/cartas.csv` o anota los cambios que quieras.
2. Se actualizan los datos en el demo (`CARDS` y `HEROES` en `eclipsia.html`), el manual y las imágenes.

## Próximos pasos

Mulligan, constructor de mazos, cartas legendarias, balance con partidas simuladas y la versión móvil (Godot o Unity con un servidor autoritativo).
