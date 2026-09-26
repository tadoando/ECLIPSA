# Migración a Godot 4 (GDScript)

## Estructura del proyecto
```
eclipsia-godot/
  project.godot
  data/                 ← copia de /data (cards.json, heroes.json, rules.json)
  core/                 ← port del motor (sin nodos, solo RefCounted/estáticos)
    rng.gd  engine.gd  ai.gd  hash.gd  data_loader.gd
  game/
    game_controller.gd  ← autoload: estado, cola de eventos, modo local u online
    event_player.gd     ← reproduce GameEvent con Tween
  ui/
    card.tscn / card.gd         (Control 5:7, escalable)
    unit.tscn / unit.gd         (Control 4:5)
    hero_panel.tscn, power_button.tscn, phase_disc.tscn, hand.tscn, board.tscn
    screens/ main_menu.tscn, hero_select.tscn, table.tscn, result.tscn
  assets/  fonts/ (Grenze, Alegreya Sans, IBM Plex Mono)  cards/  heroes/  icons/
  tests/   test_vectors.gd  (con GUT o gdUnit4)
```

## Representación del estado
Usa `Dictionary` y `Array` con las **mismas claves** que el JSON de TypeScript (`players`, `board`, `uid`, `maxHealth`…). Así el hash coincide y el estado se puede serializar con `JSON.stringify`. Para copiar: `state.duplicate(true)`.

## RNG verificado (mulberry32)
Los `int` de GDScript son de 64 bits, así que hay que emular la aritmética de 32 bits. Este algoritmo está verificado contra `data/test-vectors/rng.json`.

```gdscript
# core/rng.gd
class_name EclRng
const M := 0xFFFFFFFF

static func _imul(a: int, b: int) -> int:
	# (a * b) mod 2^32 sin desbordar 64 bits
	return (a * (b & 0xFFFF) + (((a * (b >> 16)) & 0xFFFF) << 16)) & M

static func _to_signed(n: int) -> int:
	return n - 0x100000000 if n >= 0x80000000 else n

## Devuelve [valor en [0,1), nuevo estado con signo]
static func next_random(state: int) -> Array:
	var n := (state + 0x6D2B79F5) & M
	var t := n
	t = _imul(t ^ (t >> 15), 1 | t)
	t = ((t + _imul(t ^ (t >> 7), 61 | t)) & M) ^ t
	var value := float((t ^ (t >> 14)) & M) / 4294967296.0
	return [value, _to_signed(n)]

static func shuffle_in_place(arr: Array, rng: int) -> int:
	var r := rng
	for i in range(arr.size() - 1, 0, -1):
		var res := next_random(r)
		r = res[1]
		var j := int(floor(res[0] * (i + 1)))
		var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp
	return r
```
Ojo: `state & M` convierte un estado negativo al rango sin signo. Funciona porque los `int` de Godot son de complemento a dos de 64 bits.

## Hash verificado (JSON canónico + FNV-1a)
```gdscript
# core/hash.gd
class_name EclHash
static func canonical(v) -> String:
	match typeof(v):
		TYPE_ARRAY:
			return "[" + ",".join(v.map(func(x): return canonical(x))) + "]"
		TYPE_DICTIONARY:
			var keys: Array = v.keys(); keys.sort()
			var parts := PackedStringArray()
			for k in keys:
				parts.append(JSON.stringify(str(k)) + ":" + canonical(v[k]))
			return "{" + ",".join(parts) + "}"
		TYPE_FLOAT:
			# el motor solo usa enteros; si llega un float entero, escríbelo sin decimales
			return str(int(v)) if v == floor(v) else str(v)
		_:
			return JSON.stringify(v)

static func hash_state(state: Dictionary) -> String:
	var s := canonical(state)
	var h := 0x811C9DC5
	for i in s.length():
		h = h ^ s.unicode_at(i)
		h = EclRng._imul(h, 0x01000193)
	return "%08x" % h
```
Al leer JSON, Godot convierte los números a `float`: convierte a `int` los campos numéricos del estado al cargar (`uid`, `health`…) o maneja floats enteros como arriba.

## Engine
Traduce `engine.ts` función por función, manteniendo nombres en snake_case (`apply_action`, `validate_action`, `get_legal_actions`, `view_for`). Los eventos son `Dictionary` con la clave `type` igual que en TS.

## Presentación
- `Card`: `Control` con `custom_minimum_size` proporcional; los tamaños internos se calculan como % del ancho (ver doc 08). Fuente con `FontFile` + `LabelSettings`.
- Selección de objetivos: al elegir la carta, pide `validTargets` al motor y activa el resaltado en esos nodos.
- `EventPlayer`: un `await` por evento con `create_tween()` y las duraciones de `tokens.motion`.
- Ambiente de fase: un `ColorRect` superpuesto con `modulate.a` animado (Día 0, Noche 1).

## Exportar
Android: plantillas de exportación + SDK/JDK, formato AAB para Play. iOS: exportar proyecto Xcode desde macOS y firmar con tu cuenta de Apple Developer.
