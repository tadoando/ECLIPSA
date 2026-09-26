# ADR-0002 · Motor de referencia en TypeScript

**Estado:** aceptada · v0.1

## Contexto
El motor debe correr en el cliente (modo un jugador), en el servidor (en línea) y en herramientas (simulación y pruebas). El motor gráfico aún no está decidido.

## Decisión
La implementación de referencia es TypeScript puro (`packages/core`), sin dependencias.

## Consecuencias
- Web, React Native y un servidor Node lo usan directamente.
- Godot o Unity deben portarlo. Para garantizar la paridad existen `data/test-vectors` y `hashState`.
- Alternativa descartada por ahora: escribir el motor en Rust y compilarlo a WASM y a bibliotecas nativas. Da un único código para todo, pero complica mucho el flujo de trabajo en esta etapa.
