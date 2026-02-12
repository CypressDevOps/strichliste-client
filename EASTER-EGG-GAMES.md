# 🎮 Easter Egg: Spiele-Zone

## Geheime Spiele in deiner Vereins-Kasse!

### 🤫 So findest du sie:

**8x schnell auf das Datum tippen!**

```
┌─────────────────────────────────┐
│ Deckelübersicht – [12.2.2026]  │  ← 8x hier drauf klicken!
│                    ↑↑↑↑↑↑↑↑     │
└─────────────────────────────────┘
```

**Innerhalb von 2 Sekunden** musst du 8 Mal auf das Datum tippen. Dann öffnet sich das **Game-Menü** mit 3 Spielen!

---

## 🎮 Die 3 Spiele:

### 1. 🍺 Schnellzapf-Challenge

**Gameplay:** Klicke so schnell wie möglich auf das Bierfass!

- ⏱️ 10 Sekunden Zeit
- 🏆 Highscore wird gespeichert
- ⭐ Achievements ab 20/30/50 Bieren
- 🎯 Ziel: Zapfmeister werden!

**Steuerung:** Mausklick / Touch

---

### 2. 🔢 2048

**Gameplay:** Kombiniere Zahlen bis zur 2048!

- ⬅️ ➡️ ⬆️ ⬇️ Pfeiltasten zum Bewegen
- 🧮 Strategie: Ecke freihalten
- 🏆 Highscore-Tracking
- 🎨 Schöne Farben für jede Zahl

**Steuerung:** Pfeiltasten (Keyboard)

---

### 3. 🇩🇪 Deutschland-Quiz

**Gameplay:** 250 Fragen über Deutschland!

- 📚 **6 Kategorien:**
  - 🗺️ Geografie
  - 📜 Geschichte
  - 🎭 Kultur
  - 🏛️ Politik
  - ⚽ Sport
  - 💼 Wirtschaft

- 🎯 **3 Schwierigkeitsgrade:**
  - 🟢 Leicht
  - 🟡 Mittel
  - 🔴 Schwer

- 🎲 Jede Runde: 10 zufällige Fragen
- ✅ Sofortiges Feedback nach jeder Antwort
- 🏆 Highscore speichern
- 📊 Prozentuale Auswertung am Ende

**Steuerung:** Mausklick / Touch

---

## 💾 Speicherung

Alle Highscores werden in **LocalStorage** gespeichert:

- 🍺 Beer Clicker: `beer_clicker_highscore`
- 🔢 2048: `2048_best_score`
- 🇩🇪 Deutschland-Quiz: `deutschland_quiz_highscore`

→ Auch offline verfügbar!
→ Bleibt beim Browser-Neustart erhalten
→ Pro Gerät gespeichert (kein Cloud-Sync)

---

## 🎨 Design

Jedes Spiel hat sein eigenes Theme:

- 🍺 Beer Clicker: **Amber/Bier-Theme** (Braun-Gelb)
- 🔢 2048: **Grayscale mit bunten Kacheln**
- 🇩🇪 Deutschland Quiz: **Grün-Smaragd** (Deutschland-Farben)

---

## 📦 Technische Details

### Speichergröße:

```
Beer Clicker:     ~20 KB Code
2048:             ~80 KB Code
Deutschland Quiz: ~250 KB Fragen + ~50 KB Code
────────────────────────────────────────────
TOTAL:            ~400 KB (minimal!)
```

### Performance:

- Keine externen APIs
- Keine Bilderdaten
- 100% Offline-fähig
- Läuft smooth auf Tablets

---

## 🏆 Highscore-Tipps

### 🍺 Beer Clicker:

- **50+ Biere:** Zapfmeister! ⭐⭐⭐
- **30-49:** Fast Profi! ⭐⭐
- **20-29:** Gut! ⭐

**Pro-Tipp:** Zwei Finger abwechselnd klicken!

### 🔢 2048:

- Halte die höchste Zahl in einer Ecke
- Bewege nur in 3 Richtungen (eine Richtung sperren)
- Baue von klein nach groß

**Pro-Tipp:** Immer in gleicher Reihenfolge bewegen (z.B. Links → Unten → Links → Unten)

### 🇩🇪 Deutschland Quiz:

- Leichte Fragen geben gleich viele Punkte wie schwere
- Historische Jahreszahlen merken (1989, 1990, 1949)
- Bayern = München, Sachsen = Dresden, NRW = Düsseldorf

**Pro-Tipp:** Quiz mehrmals spielen – du siehst jedes Mal andere Fragen!

---

## 🎭 Credits

Easter Eggs entwickelt für die **Vereins-Kasse** 🍻

- Design: Tailwind CSS
- Spiele: React + TypeScript
- Offline: 100% Browser-basiert
- Keine Dependencies außer React

**Viel Spaß beim Spielen!** 🎉

---

## 🐛 Bekannte "Features"

- 8x Tap funktioniert nur innerhalb von 2 Sekunden
- Bei sehr langsamen Tablets: 2048 könnte ruckeln (aber Fußball-WM 2026 Tablets schaffen das!)
- Deutschland-Quiz: Manche Fragen sind schwierig – das ist Absicht! 😈

---

**Easter Egg gefunden?**
Glückwunsch! Du bist aufmerksam! 🎉
