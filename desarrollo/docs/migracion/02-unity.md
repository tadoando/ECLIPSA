# Migración a Unity (C#)

## Estructura
```
Assets/
  Eclipsia/
    Core/            ← port del motor (C# puro, sin MonoBehaviour) · asmdef "Eclipsia.Core"
      Types.cs Rng.cs Engine.cs Ai.cs StateHash.cs DataLoader.cs
    Game/            GameController.cs (MonoBehaviour), EventPlayer.cs (DOTween o corrutinas)
    UI/              CardView.cs, UnitView.cs, HeroPanel.cs, PowerButton.cs, PhaseDisc.cs, HandView.cs, BoardView.cs
    Prefabs/  Scenes/ (Boot, Menu, HeroSelect, Table, Result)
    Data/            ← StreamingAssets o Resources: cards.json, heroes.json, rules.json
    Art/             cards/ heroes/ icons/ fonts/
  Tests/EditMode/    VectorTests.cs (Unity Test Framework / NUnit)
```
El núcleo va en su propio *assembly definition*, sin referencias a `UnityEngine`. Así se prueba en EditMode y se puede reutilizar en un servidor .NET.

## Tipos
Usa clases serializables con los **mismos nombres de campo** que el JSON (camelCase), con Newtonsoft.Json (`com.unity.nuget.newtonsoft-json`). Los efectos son polimórficos por el campo `do`: un `JsonConverter` que lea `do` y cree `DamageEffect`, `HealEffect`, etc., o una clase única `Effect` con todos los campos opcionales (lo más simple).

```csharp
[Serializable] public class Unit {
  public int uid; public string cardId; public int owner;
  public int attack, health, maxHealth;
  public List<string> keywords;
  public bool shield, asleep, attacked, dead;
}
```

## RNG verificado (mulberry32)
```csharp
public static class Rng {
  // Devuelve (valor en [0,1), nuevo estado con signo). Coincide con data/test-vectors/rng.json
  public static (double value, int next) NextRandom(int state) {
    unchecked {
      uint n = (uint)state + 0x6D2B79F5u;
      uint t = n;
      t = (t ^ (t >> 15)) * (1u | t);
      t = (t + ((t ^ (t >> 7)) * (61u | t))) ^ t;
      double v = (t ^ (t >> 14)) / 4294967296.0;
      return (v, (int)n);
    }
  }
  public static int ShuffleInPlace<T>(IList<T> a, int rng) {
    for (int i = a.Count - 1; i > 0; i--) {
      var (v, n) = NextRandom(rng); rng = n;
      int j = (int)Math.Floor(v * (i + 1));
      (a[i], a[j]) = (a[j], a[i]);
    }
    return rng;
  }
}
```

## Hash (JSON canónico + FNV-1a)
Serializa el estado a `JObject` y ordena las claves con comparación ordinal (`StringComparer.Ordinal`) de forma recursiva. Escribe sin espacios (`Formatting.None`) y aplica FNV-1a sobre los *code units* UTF-16 del string:
```csharp
uint h = 0x811C9DC5u;
foreach (char c in canonical) { h ^= c; h = unchecked(h * 0x01000193u); }
return h.ToString("x8");
```

## Presentación
- UI con **uGUI** o **UI Toolkit**. Las cartas como prefab con `AspectRatioFitter` (0,714). Los tamaños internos en % del ancho con `LayoutElement` y anclas.
- Fuentes con TextMeshPro (genera los *font assets* de Grenze y Alegreya Sans con el rango Latin-1 + ñ, á…).
- Animación: DOTween (gratuito) o corrutinas con las duraciones de `tokens.json`.
- Entrada: `IPointerDownHandler` / `IDragHandler` para tocar y arrastrar.

## Exportar
Android: módulo Android Build Support, IL2CPP, ARM64, AAB. iOS: módulo iOS, proyecto Xcode desde macOS.
