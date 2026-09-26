# ADR-0001 · Las cartas son datos, no código

**Estado:** aceptada · v0.1

## Contexto
Un TCG vive de publicar contenido nuevo. Si cada carta es código, cada expansión exige publicar una versión nueva de la app y pasar la revisión de las tiendas.

## Decisión
Las cartas y los héroes se describen en JSON (`data/`) con un vocabulario cerrado de efectos y objetivos que interpreta el motor.

## Consecuencias
- Se pueden añadir o equilibrar cartas descargando JSON, siempre que usen efectos existentes.
- Un efecto nuevo sí exige código (y una versión nueva de la app). Por eso el vocabulario debe crecer con cuidado.
- Las cartas únicas y muy complejas son más difíciles de expresar. Si hacen falta, se crea un efecto específico con nombre propio.
