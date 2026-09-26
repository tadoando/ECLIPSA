# ADR-0003 · Servidor autoritativo para el juego en línea

**Estado:** aceptada (implementación en v0.4)

## Decisión
En línea, solo el servidor aplica acciones. Los clientes envían intenciones y reciben eventos filtrados y una vista con información oculta (`viewFor`).

## Consecuencias
Evita trampas (ver la mano del rival, forzar robos, alterar el daño). Requiere infraestructura, reconexión y gestión de la latencia. La animación en el cliente espera la respuesta del servidor; la latencia se disimula con animación de «preparación» (<150 ms).
