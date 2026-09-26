# 11 · Roadmap

## v0.2 · Reglas y balance (siguiente)
- [ ] Balancear Vesper (≈23 % de victoria) y Aurelia (≈70 %) hasta el rango 45–55 % (propuestas en doc 15).
- [ ] Mejorar la IA de Vesper y Nerea para descartar que el desbalance venga de la IA.
- [ ] Mulligan (devolver hasta 3 cartas).
- [ ] Compensación para quien va segundo.
- [ ] Disparadores «Al amanecer» / «Al anochecer».
- [ ] 8 cartas nuevas (2 por facción) que aprovechen los disparadores.
- [ ] Actualizar el prototipo web para que use `@eclipsia/core` compilado.

## v0.3 · MVP móvil
- [ ] Elegir motor (doc `migracion/00-estrategia.md`) y crear el proyecto.
- [ ] Integrar o portar el motor (el port debe pasar los vectores).
- [ ] Pantallas: inicio, selección de héroe, mesa, resultado, colección, reglas, ajustes.
- [ ] Tutorial de 5 pasos.
- [ ] Guardado de partida en curso (semilla + acciones).
- [ ] Sonido y vibración.
- [ ] Arte final de 4 héroes y 38 cartas (doc 09).
- [ ] Builds de prueba: TestFlight (iOS) y prueba interna de Google Play.

## v0.4 · En línea
- [ ] Servidor autoritativo (doc 10), cuentas y colección en la nube.
- [ ] PvP casual y reconexión.
- [ ] Analítica de producto y telemetría de balance real.

## v1.0 · Lanzamiento
- [ ] 100+ cartas, constructor de mazos y ranking por temporadas.
- [ ] Tienda y monetización (por decidir), cumplimiento de App Store y Google Play.
- [ ] Localización (inglés y portugués).

## Checklist de publicación móvil
- Cuenta de Apple Developer (anual) y de Google Play Console (pago único).
- Íconos de app (1024×1024 a partir de `design/assets/icons/eclipse-logo.svg`), pantalla de arranque y capturas por tamaño.
- Política de privacidad pública y clasificación por edad (IARC / App Store).
- Firma: keystore de Android y certificados de iOS, guardados fuera del repositorio.
