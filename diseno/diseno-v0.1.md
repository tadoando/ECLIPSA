# Eclipsia — diseño v0.1 (demo web)

Artifact publicado: https://claude.ai/artifact/NAoQHNFBtsAskHxEi9pdXb
Código fuente: claude/eclipsia.html (HTML único; cartas, héroes y efectos definidos como datos en CARDS / HEROES).

## Reglas base
- Héroe con 25 de vida. Mazo de 20: 8 cartas de facción x2 + 4 neutrales x1.
- Mano inicial: 3 cartas el que empieza (humano), 4 el segundo (IA). Mano máx 9, mesa máx 6. Fatiga creciente.
- Brasas (energía): +1 máx por turno hasta 10.
- Poder de héroe: 2 brasas, 1 vez por turno.
- Las criaturas no atacan el turno en que entran (salvo Furia). Combate simultáneo; el daño persiste.
- Ciclo Día/Noche: empieza Día, alterna cada ronda. "Día: +X ataque" / "Noche: +X ataque". Corona del Cenit fuerza Día; Eclipse Total fuerza Noche.
- Palabras clave: Guardián, Furia, Escudo, Veneno, Robo vital.

## Héroes
- Aurelia, Forjadora del Alba (Sol) — Chispa: 1 daño a cualquier objetivo.
- Nerea, Voz de la Marea (Marea) — Bruma sanadora: +3 vida a tu héroe.
- Tarn, Guardián de la Raíz (Raíz) — Germinar: invoca Semilla 1/1.
- Vesper, la Sombra Quieta (Umbra) — Pacto menor: pierdes 2 vida, robas 1.

## Cartas (coste · ataque/vida · texto)
Sol: Chispa Errante 1·2/1 Furia | Heraldo del Alba 2·2/3 Día +1 | Lanza Solar 2 hechizo 3 daño cualquier objetivo | Forjador de Brasas 3·3/2 al entrar 1 daño a todos los enemigos | Fénix de Cobre 4·4/2 Furia, Día +1 | Llamarada 4 hechizo 2 daño a criaturas enemigas | Centinela Dorado 5·4/5 Guardián Escudo | Corona del Cenit 7·6/6 Furia, fase Día + 2 daño al héroe rival
Marea: Perla Viva 1·1/3 Guardián | Oráculo de Espuma 2·1/2 roba 1 | Marea Sanadora 2 hechizo +4 vida, roba 1 | Anguila Voltaica 3·2/2 Veneno | Custodio de Coral 4·2/6 Guardián, Noche +2 | Remolino 3 hechizo 3 daño a criatura enemiga, roba 1 | Leviatán Dormido 6·5/7 Guardián Robo vital | Canto Abisal 5 hechizo destruye criatura enemiga
Raíz: Brote Tenaz 1·1/2 al morir Semilla | Lobo de Musgo 2·3/2 | Crecer 1 hechizo +2/+2 aliada | Madre Enjambre 3·2/2 invoca 2 Semillas | Ciervo Ancestral 4·3/4 otras aliadas +1/+1 | Trenzador de Espinas 3·2/4 Guardián | Coloso de Ceiba 6·6/6 Guardián, +4 vida | Despertar del Bosque 5 hechizo 3 Espíritus 2/2
Umbra: Polilla Nocturna 1·1/2 Noche +2 | Acólito Velado 2·2/3 Robo vital | Susurro 1 hechizo 2 daño a criatura enemiga | Aracne del Umbral 3·1/4 Veneno | Espectro Hambriento 4·3/3 Robo vital, Noche +2 | Pacto de Sangre 2 hechizo pierdes 3, robas 2 | Segador Eclipsado 5·4/5 2 daño a todas las demás criaturas | Eclipse Total 4 hechizo fase Noche, aliadas +1/+1
Neutral: Mercader de Caminos 2·2/2 +1 brasa | Gólem de Arcilla 3·3/4 | Vigía de Piedra 4·2/7 Guardián | Titán del Crepúsculo 8·7/7 Guardián Robo vital
Fichas: Semilla 1·1/1, Espíritu del Bosque 2·2/2

## Pendiente
Mulligan, constructor de mazos, legendarias, PvP en línea, balance con simulaciones.
