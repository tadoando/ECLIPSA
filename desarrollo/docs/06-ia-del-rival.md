# 06 · IA del rival

Archivo: `packages/core/src/ai.ts`. Función principal: `chooseAction(state, data, player) → Action`.

## Estrategia actual (voraz, sin búsqueda)
En cada llamada devuelve la primera acción que encuentra en este orden:
1. **Jugar cartas**, de mayor a menor coste, si son legales y `wantsToPlay()` lo permite (hay reglas específicas por carta: no usar Pacto de Sangre con poca vida, no usar Llamarada contra una sola criatura…).
   - Objetivos (`chooseEffectTarget`): **daño** → daño letal al héroe si alcanza; si no, la criatura enemiga de más valor que muera; si no, el héroe. **Destruir** → la criatura enemiga de más valor. **Refuerzo o curación** → la aliada de más valor.
2. **Poder de héroe** si `wantsPower()` lo aprueba.
3. **Atacar** con la primera criatura que pueda:
   - Si hay Guardianes: el que pueda matar con menos vida.
   - Si el daño total disponible es letal: al héroe.
   - Si no, el mejor intercambio: matar sin morir (+3), o un cambio favorable en valor. Si no hay ninguno, al héroe.
4. **Terminar turno.**

`unitValue = ataqueEfectivo × 1,5 + vida + 1 (Guardián) + 2 (Veneno)`

## Limitaciones conocidas
- No planifica el orden de los ataques ni guarda cartas para la fase siguiente.
- Juega las cartas en orden de coste, no en la mejor combinación de brasas.
- No tiene en cuenta que Segador Eclipsado también daña a sus propias criaturas (solo lo compara de forma aproximada).
- Juega peor con Vesper y Nerea, lo que infla sus malos resultados en la simulación.

## Mejoras recomendadas, de menor a mayor esfuerzo
1. **Mochila de brasas**: elegir el conjunto de cartas que mejor aprovecha las brasas.
2. **Búsqueda de un turno**: con `getLegalActions` + `applyAction` (puros y baratos), probar secuencias del turno actual y evaluar el estado final con una función de evaluación.
3. **Niveles de dificultad**: mezclar la acción óptima con una aleatoria según una probabilidad (usa un RNG de la IA separado del de la partida).
4. **MCTS con determinización** (muestrear la mano oculta del rival) para el nivel difícil.

La IA no debe leer la mano ni el mazo del rival. En modo en línea, usa `viewFor()` para garantizarlo.
