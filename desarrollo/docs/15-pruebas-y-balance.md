# 15 · Pruebas y balance

## Pruebas automáticas (`packages/core/test`)
`npm test` ejecuta 25 pruebas:
- **Reglas unitarias**: preparación, brasas, fase, bonos, Furia, Guardián, combate, Escudo + Veneno, Veneno, Robo vital, «Al morir», objetivos, mesa llena, fatiga, mano llena, victoria.
- **Propiedades**: `applyAction` no modifica la entrada; determinismo (misma semilla ⇒ mismo hash); `viewFor` oculta información; `getLegalActions` ⊆ acciones válidas.
- **Fuzzing**: 300 partidas IA contra IA en los 16 emparejamientos, comprobando invariantes en cada paso (mesa ≤ 6, mano ≤ 9, vida ≤ máximo, ninguna criatura muerta en mesa) y que todas terminan.

## Simulación de balance
`npm run simulate -- 400` escribe `15-pruebas-y-balance.resultados.md`.

### Resultado v0.1 (400 partidas por emparejamiento, 6400 en total)
| Héroe | Victoria global |
|---|---|
| Aurelia (Sol) | **70,0 %** |
| Tarn (Raíz) | 61,9 % |
| Nerea (Marea) | 45,5 % |
| Vesper (Umbra) | **22,6 %** |

- Duración media: 13,3 rondas. Quien empieza gana el 56 %.
- Los espejos (mismo héroe) dan ~50 %, lo que confirma que el motor es justo.
- Nerea vence a Vesper el 93 % de las veces, pero pierde contra Tarn el 91 %.

### Diagnóstico y propuestas para v0.2
**Vesper (demasiado débil)**
- Pacto menor (−2 de vida por 1 carta) y Pacto de Sangre castigan demasiado frente a la agresión de Sol. Propuesta: Pacto menor → «pierde 1 de vida, roba 1».
- Las criaturas de Noche solo ganan ataque en rondas pares. Propuesta: Polilla Nocturna 1/3; Espectro Hambriento 3/4.
- Segador Eclipsado daña también a las criaturas propias, que son pequeñas. Propuesta: «a todas las criaturas enemigas y 1 a las propias».

**Aurelia (demasiado fuerte)**
- Forjador de Brasas (1 de daño a todos los enemigos al entrar) es muy eficiente contra Raíz y Umbra. Propuesta: coste 4.
- Chispa (1 de daño a cualquier objetivo) remata fichas cada turno. Propuesta: «1 de daño a una criatura».

**Nerea contra Tarn (8,8 %)**: Marea no tiene daño en área. Propuesta: una carta nueva «Marejada: 1 de daño a todas las criaturas enemigas».

> La IA es voraz; parte del desbalance puede venir de cómo juega (ver doc 06). Repite la simulación después de cada cambio y, en cuanto haya partidas reales, contrástala con la telemetría.

## Vectores para ports
`npm run vectors` genera:
- `data/test-vectors/rng.json`: secuencias de mulberry32 para 5 semillas.
- `data/test-vectors/games.json`: 8 partidas completas (semilla, héroes, cada acción y el hash del estado tras aplicarla).

Un port es correcto cuando, con la misma semilla y aplicando las mismas acciones, obtiene **todos** los hashes iguales (`hashState` = FNV-1a de 32 bits sobre el JSON canónico con claves ordenadas).
