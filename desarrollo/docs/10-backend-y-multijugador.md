# 10 · Backend y multijugador (diseño para v0.4)

## Principio: servidor autoritativo
El cliente **solo envía intenciones** (`Action`). El servidor valida con `validateAction`, aplica con `applyAction` y envía a cada jugador sus eventos y su vista (`viewFor`). El cliente nunca decide daño, robo ni barajado.

## Opción A (recomendada): Node.js + el mismo `@eclipsia/core`
- Un solo motor para el cliente (React Native o web) y el servidor, sin riesgo de que diverjan.
- Stack: Node 20+, Fastify (HTTP) + `ws` o uWebSockets (tiempo real), PostgreSQL y Redis (partidas activas y emparejamiento).
- Despliegue: contenedor en Fly.io, Railway, Render, Cloud Run o similar.

## Opción B: Nakama (open source)
Aporta cuentas, emparejamiento, amigos, tablas de clasificación y almacenamiento. La lógica de partida va en un *match handler* en TypeScript (el runtime JS de Nakama), donde se puede empaquetar `@eclipsia/core`.

## Opción C: Python (FastAPI)
Útil si el equipo domina Python. Exige portar el motor y verificarlo con `data/test-vectors` (ver migración).

## Protocolo WebSocket (JSON)
```jsonc
// Cliente → servidor
{ "t": "hello", "token": "<JWT de sesión>", "client": "1.0.0", "rules": "0.1.0" }
{ "t": "queue", "heroId": "tarn", "deckId": "default" }
{ "t": "action", "matchId": "m_123", "seq": 14, "action": { "type": "endTurn", "player": 0 } }
{ "t": "resync", "matchId": "m_123" }

// Servidor → cliente
{ "t": "matchFound", "matchId": "m_123", "you": 0, "opponent": { "name": "…", "heroId": "vesper" } }
{ "t": "events", "matchId": "m_123", "seq": 15, "events": [/* GameEvent ya filtrados */], "view": { /* viewFor */ } }
{ "t": "rejected", "seq": 14, "reason": "No es tu turno" }
{ "t": "matchEnded", "winner": 1, "reason": "health|concede|timeout" }
```
- `seq` crece de uno en uno: el servidor descarta duplicados y fuera de orden.
- **Filtrar eventos** por jugador: el `cardDrawn` del rival viaja sin `cardId`.
- **Reloj de turno**: 75 s con aviso a los 15 s. Al agotarse, el servidor aplica `endTurn`. Tres agotamientos seguidos = derrota.
- **Reconexión**: `resync` devuelve la vista actual y los últimos eventos.

## Esquema PostgreSQL inicial
```sql
CREATE TABLE players (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  rating       INT NOT NULL DEFAULT 1000
);
-- La autenticación la maneja un proveedor (Sign in with Apple, Google, correo);
-- solo se guarda un identificador externo, nunca contraseñas en texto plano.
CREATE TABLE auth_identities (
  player_id  UUID REFERENCES players(id) ON DELETE CASCADE,
  provider   TEXT NOT NULL,
  subject    TEXT NOT NULL,
  PRIMARY KEY (provider, subject)
);
CREATE TABLE collection (
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  card_id   TEXT NOT NULL,
  copies    INT NOT NULL CHECK (copies >= 0),
  PRIMARY KEY (player_id, card_id)
);
CREATE TABLE decks (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  hero_id   TEXT NOT NULL,
  cards     TEXT[] NOT NULL CHECK (array_length(cards, 1) = 20)
);
CREATE TABLE matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rules_version TEXT NOT NULL,
  seed          INT NOT NULL,
  player0       UUID REFERENCES players(id),
  player1       UUID REFERENCES players(id),
  heroes        TEXT[2] NOT NULL,
  winner        SMALLINT,              -- 0, 1, NULL = empate o abandono
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at      TIMESTAMPTZ
);
-- Semilla + acciones permiten reconstruir cualquier partida (repeticiones, soporte, antitrampas)
CREATE TABLE match_actions (
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  seq      INT NOT NULL,
  action   JSONB NOT NULL,
  state_hash CHAR(8) NOT NULL,
  PRIMARY KEY (match_id, seq)
);
```

## Seguridad
- La semilla y el estado del RNG nunca se envían al cliente.
- Toda entrada se valida (esquema del mensaje + `validateAction`). Consultas SQL siempre parametrizadas.
- Límite de mensajes por conexión (por ejemplo 10 por segundo).
- Secretos (JWT, base de datos) en variables de entorno o un gestor de secretos, nunca en el repositorio: `DATABASE_URL=postgres://USUARIO:CONTRASEÑA@HOST/eclipsia` es solo un ejemplo.
- Las compras dentro de la app se validan en el servidor con los recibos de App Store y Google Play.
- Datos personales mínimos (nombre visible e identificador del proveedor). Cumplir las políticas de privacidad de Apple y Google y la ley aplicable (en Colombia, la Ley 1581 de 2012).

## Emparejamiento
Cola por rango de `rating` que se amplía ±50 cada 5 s. Elo simple (K=32) para v0.4; Glicko-2 para temporadas.
