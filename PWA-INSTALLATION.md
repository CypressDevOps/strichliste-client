# 📱 PWA Installation & Offline-Nutzung

## Was ist eine PWA?

**Progressive Web App** = Web-App, die wie eine native App funktioniert:

- ✅ Auf Startbildschirm installierbar
- ✅ Funktioniert offline
- ✅ Keine App-Store-Downloads nötig
- ✅ Automatische Updates

---

## 🚀 Installation auf dem Tablet

### Android (Chrome/Edge):

1. **Öffne deine Vercel-URL** im Browser

   ```
   https://deine-app.vercel.app
   ```

2. **Installieren:**
   - Tippe auf **⋮ Menü** (oben rechts)
   - Wähle **"App installieren"** oder **"Zum Startbildschirm hinzufügen"**
   - Bestätige mit **"Installieren"**

3. **Fertig!**
   - App erscheint auf dem Startbildschirm
   - Öffnet sich im Vollbildmodus (ohne Browser-UI)

---

### iOS (iPad Safari):

1. **Öffne deine Vercel-URL** in Safari

   ```
   https://deine-app.vercel.app
   ```

2. **Installieren:**
   - Tippe auf **Teilen-Button** (📤)
   - Scrolle zu **"Zum Home-Bildschirm"**
   - Benenne die App (z.B. "Vereinskasse")
   - Tippe **"Hinzufügen"**

3. **Fertig!**
   - App erscheint als Icon auf dem iPad
   - Startet ohne Browser-Leiste

---

## 🔌 Offline-Funktionalität

### So funktioniert es:

1. **Beim ersten Öffnen** (Internet nötig):
   - App wird geladen
   - Service Worker installiert sich
   - Alle Dateien werden gecacht

2. **Danach** (auch ohne Internet):
   - App funktioniert komplett offline! ✈️
   - Alle Daten in `localStorage` bleiben verfügbar
   - Neue Deckel, Transaktionen, etc. funktionieren

### Testen:

```bash
1. App öffnen & nutzen (paar Deckel anlegen)
2. Flugmodus einschalten ✈️
3. App komplett schließen
4. App erneut öffnen
   → Funktioniert! 🎉
```

### Offline-Indikator:

- **Rote Box oben rechts:** "Offline-Modus" ✈️
- **Grüne Box (3 Sek.):** "Wieder online" ✓

---

## 🔄 Updates

### Automatische Updates:

- Bei jedem App-Start wird geprüft, ob neue Version verfügbar
- Service Worker lädt Updates im Hintergrund
- Beim nächsten App-Neustart: neue Version aktiv

### Manuelle Aktualisierung:

```bash
# Im Browser:
1. Entwickler-Tools öffnen (F12)
2. Application → Service Workers
3. "Unregister" klicken
4. Seite neu laden (Cache wird geleert)
```

---

## 💾 Daten-Speicherung

### Was wird offline gespeichert?

| Datentyp               | Speicherort          | Offline verfügbar? |
| ---------------------- | -------------------- | ------------------ |
| Deckel & Transaktionen | `localStorage`       | ✅ Ja              |
| Kassenberichte         | `localStorage`       | ✅ Ja              |
| Produkt-Einstellungen  | `localStorage`       | ✅ Ja              |
| App-Dateien (JS/CSS)   | Service Worker Cache | ✅ Ja              |

### Backup-Empfehlung:

Da alles lokal gespeichert ist:

- **Täglich Backup exportieren** (Menü → Backup erstellen)
- Backup-Datei sicher speichern (Cloud/USB)
- Bei Tablet-Wechsel: Backup importieren

---

## 🛠️ Problemlösung

### App lädt nicht offline:

1. **Einmal online öffnen** nach Installation
2. Mindestens 5 Sekunden warten (Service Worker braucht Zeit)
3. App komplett schließen (nicht nur in Hintergrund)
4. Offline neu öffnen

### App zeigt alte Version:

```bash
# Lösung 1: Hard Refresh
- Halte App-Icon & entfernen
- Neu installieren

# Lösung 2: Cache leeren
- Browser → Einstellungen → Speicher
- "Daten löschen" für die App-Domain
- Neu installieren
```

### Daten weg nach Update:

⚠️ **Wichtig:** `localStorage` kann verloren gehen bei:

- Browser-Cache löschen
- App deinstallieren
- Tablet zurücksetzen

**→ Immer Backups erstellen!**

---

## 📊 Speicherplatz

### Wie viel Speicher braucht die App?

- **App-Dateien:** ~2-5 MB
- **Pro 100 Deckel:** ~50-100 KB
- **Pro Monat Kassenberichte:** ~10 KB

### Beispiel:

```
1 Vereinsabend = 20 Deckel × 10 Transaktionen
= ca. 50 KB Daten

→ 100 Abende = 5 MB Daten
```

---

## 🔒 Sicherheitshinweis

Da die App komplett offline läuft:

- ⚠️ Alle Daten sind lokal im Browser
- ⚠️ Kein Cloud-Backup (außer manuell)
- ⚠️ Bei Tablet-Verlust sind Daten weg
- ⚠️ Daten können technisch manipuliert werden

**Empfehlung für Verein:**

- Tablet mit Passcode sichern
- Tägliche Backups erstellen
- Für Steuer-Compliance: PDFs exportieren & archivieren

---

## 📝 Checkliste für Vereins-Abend

- [ ] Tablet aufgeladen
- [ ] App installiert
- [ ] Einmal online getestet (Service Worker aktiv)
- [ ] Backup vom letzten Abend vorhanden
- [ ] Offline-Modus getestet (Flugmodus)
- [ ] Produkte & Preise konfiguriert

Viel Erfolg! 🍻
