# Eclipsia · proyecto de desarrollo

Eclipsia es un juego de cartas coleccionables (TCG) original: 4 héroes, 4 facciones, 38 cartas y un ciclo **Día/Noche** que cambia la fuerza de las cartas cada ronda.

Esta carpeta tiene todo lo necesario para seguir desarrollándolo, a mano o con otra IA, y llevarlo a **Android e iOS**: un motor de reglas probado, los datos del juego, el sistema de diseño, el arte, el prototipo y la documentación de arquitectura.

> **¿Eres una IA o un desarrollador nuevo?** Lee primero [`AGENTS.md`](AGENTS.md). Después lee [`docs/03-arquitectura.md`](docs/03-arquitectura.md).

## Estructura

```
desarrollo/
├── AGENTS.md                  Instrucciones para IAs y colaboradores (léelo primero)
├── README.md                  Este archivo
├── CHANGELOG.md               Historial de versiones del reglamento y del código
├── data/                      FUENTE DE VERDAD del contenido del juego
│   ├── cards.json             38 cartas (32 de facción, 4 neutrales, 2 fichas)
│   ├── heroes.json            4 héroes y sus poderes
│   ├── keywords.json          Palabras clave y su texto
│   ├── factions.json          Facciones, colores y descripción
│   ├── rules.json             Constantes (vida 25, mazo 20, mesa 6, mano 9, brasas 10…)
│   ├── schema/                JSON Schema para validar los datos
│   └── test-vectors/          Partidas y RNG de referencia para verificar ports a otros lenguajes
├── packages/core/             MOTOR DE REGLAS en TypeScript (determinista, sin UI, 25 pruebas)
│   ├── src/                   types, rng, data, engine, ai, hash
│   ├── test/                  Pruebas (node:test)
│   └── scripts/               Simulación de balance y exportación de vectores
├── design/
│   ├── tokens/                Tokens de diseño (JSON y CSS): colores, tipografía, tamaños, animación
│   ├── assets/cards/          Imagen de cada carta (PNG, 660 px de ancho)
│   ├── assets/heroes/         Retratos de los héroes
│   ├── assets/icons/          Íconos SVG (palabras clave, fases, logo)
│   └── art-generator/         Generador del arte procedural (placeholder)
├── prototype-web/             Demo web jugable (referencia visual y de interacción)
└── docs/                      Documentación de producto, reglas, arquitectura y migración
    ├── 01-vision-y-alcance.md
    ├── 02-reglas-formales.md
    ├── 03-arquitectura.md
    ├── 04-modelo-de-datos.md
    ├── 05-motor-de-efectos.md
    ├── 06-ia-del-rival.md
    ├── 07-ui-ux.md
    ├── 08-sistema-de-diseno.md
    ├── 09-direccion-de-arte.md
    ├── 10-backend-y-multijugador.md
    ├── 11-roadmap.md
    ├── 15-pruebas-y-balance.md (+ .resultados.md)
    ├── migracion/             Estrategia y guías: Godot, Unity, React Native
    ├── adr/                   Decisiones de arquitectura registradas
    └── Manual_Eclipsia_v0.1.pdf
```

## Inicio rápido

Necesitas Node.js 20 o superior.

```bash
cd packages/core
npm install
npm test            # 25 pruebas de reglas + 300 partidas de fuzzing
npm run simulate    # balance: IA contra IA en los 16 emparejamientos
npm run vectors     # regenera data/test-vectors tras cambiar reglas o cartas
```

Para ver el juego: abre `prototype-web/eclipsia.html` en el navegador.

## Estado actual (v0.1)

| Área | Estado |
|---|---|
| Reglas v0.1 | Completas y probadas en `packages/core` |
| Contenido | 4 héroes, 38 cartas, 5 palabras clave |
| IA del rival | Heurística voraz funcional |
| Prototipo web | Jugable contra la IA (su motor es una copia anterior; la referencia es `packages/core`) |
| Balance | **Desbalanceado**: Aurelia gana ~70 % y Vesper ~23 % (ver `docs/15-pruebas-y-balance.md`) |
| App móvil | Pendiente: elegir motor según `docs/migracion/00-estrategia.md` |
| Multijugador | Diseñado en `docs/10-backend-y-multijugador.md`, sin implementar |

## Licencias de terceros

Fuentes Grenze, Alegreya Sans e IBM Plex Mono: SIL Open Font License (Google Fonts). El resto del contenido es original del proyecto.
