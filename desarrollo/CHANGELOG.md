# Changelog

## [0.1.0] · 2026-09-26
### Añadido
- Reglas base: 25 de vida, mazos de 20, brasas hasta 10, poder de héroe de 2 brasas, mesa de 6, mano de 9, fatiga.
- Ciclo Día/Noche con bonos de ataque y cartas que fuerzan la fase.
- 5 palabras clave: Guardián, Furia, Escudo, Veneno y Robo vital.
- 4 héroes (Aurelia, Nerea, Tarn, Vesper), 32 cartas de facción, 4 neutrales y 2 fichas.
- Motor determinista en TypeScript con 25 pruebas, IA voraz, simulación de balance y vectores de prueba.
- Prototipo web jugable, manual en PDF, sistema de diseño y arte procedural provisional.

### Problemas conocidos
- Balance: Aurelia ~70 % de victoria global, Vesper ~23 % (ver docs/15).
- El prototipo web usa una copia anterior del motor: quien empieza es siempre el humano.
