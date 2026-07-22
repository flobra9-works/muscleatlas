# MuscleAtlas 💪

Fitness-App für die Übungsauswahl im Gym — **App-Sprache: Englisch**, Muskeln
und Muskelgruppen mit **anatomisch-lateinischen Namen** (z. B. Latissimus dorsi,
Deltoideus posterior), Design: dunkler **„Neon Athletic"**-Look (Orange→Magenta).

Funktionen: Muskelgruppe am schematischen Körper (männlich/weiblich) oder per
Liste wählen → passende Übungen mit Filtern (Free weights / Machine,
Compound / Isolation) → bei 13 Übungen **interaktive Beanspruchungs-Ansicht**
(Heatmap + Balken je nach Ausführung). Dazu Workout-Planer, Trainingsmodus mit
gesprochenem Countdown (englisch), Puls-Kopplung und Spotify-Player.

Alle Daten bleiben **nur auf deinem Gerät** (kein Konto, keine Cloud).
Bestehende Daten der deutschen Vorversion werden beim ersten Start
automatisch übernommen. In der Übungssuche funktionieren weiterhin auch
deutsche Namen („Bankdrücken" findet Barbell Bench Press).

---

## Starten

**Am PC:** Doppelklick auf **`Start MuscleAtlas.bat`** (öffnet die App im Browser).

**Am Handy (Android):** Web-App — zwei Wege:

1. App hosten (z. B. GitHub Pages oder später der Tools-Portal-Server), in
   Chrome öffnen → Menü → **„Zum Startbildschirm hinzufügen"** → verhält sich
   wie installiert (Icon, Vollbild, offline dank Service Worker).
2. **Echte Android-App (APK):** Der Code ist Capacitor-vorbereitet — sag
   Bescheid, dann verpacken wir ihn als APK bzw. später für Play Store / App Store.

---

## Puls-Kopplung (Training-Tab)

Funktioniert in **Chrome/Edge** (Web Bluetooth) mit allen Geräten, die den
Bluetooth-Standard „Heart Rate" senden:

| Gerät | Kopplung | Hinweis |
|---|---|---|
| Brustgurt (Polar H9/H10, Garmin, Wahoo …) | ✅ direkt | genaueste Variante |
| Garmin-Uhr | ✅ direkt | an der Uhr: Einstellungen → Sensoren/Herzfrequenz → **„Herzfrequenz-Übertragung"** (Broadcast), dann in der App „Pair heart-rate device" |
| Polar-Uhr | ✅ direkt | „HF-Übertragung" in den Uhr-Einstellungen aktivieren |
| Apple Watch / Fitbit | ❌ (Web-Version) | senden den Standard nicht — kommt später über die native App (Health-Schnittstellen) |

Mit Puls + Profil (Settings ⚙: Age, Height, Weight) berechnet die App den
Kalorienverbrauch pro Workout (Keytel-Formel) und den Tagesbedarf
(Mifflin-St-Jeor). Ohne Puls: grobe MET-Schätzung.
**Alles Richtwerte, kein medizinischer Rat.**

## Spotify

Im Training-Tab einen Spotify-Link einfügen (Playlist/Album/Song → Share →
Copy link). Volle Songs nur, wenn du im selben Browser bei Spotify eingeloggt
bist — sonst 30-Sekunden-Vorschau (Spotify-Vorgabe). Braucht Internet.

## Sprachansagen

Countdown und Übungsansagen auf Englisch („five, four … Go! Barbell Bench
Press, set 2 of 3"). Abschaltbar in den Settings ⚙, ebenso Ton und Vibration.

## Datensicherung

Settings ⚙ → **Create backup** lädt eine JSON-Datei mit allen Workouts und
dem Profil herunter. Auf einem anderen Gerät: **Load backup** (akzeptiert auch
Sicherungen der alten deutschen Version).

---

## Technik (für später)

- Reines HTML/CSS/JS ohne Build-Schritt (`index.html` + `js/` + `data/`).
- Bei Änderungen an CSS/JS: die `?v=`-Nummer in `index.html` **und** `sw.js`
  hochzählen (verhindert veraltete Browser-Caches). Aktuell: `v=4`.
- Deep-Links: `index.html?gruppe=ruecken&region=lat`, `?uebung=rudern-kabel`, `?tab=training`.
- Übungsdatenbank: `data/exercises.js` (96 Übungen, englisch, `nameDe` für die
  Suche; 12 interaktive Modelle — redaktionelle Richtwerte).
- Muskelnamen: `data/muscles.js` (Latein + englischer Alltagsname).
- Körpergrafiken: `data/bodysvg.js` erzeugt die 4 SVG-Varianten parametrisch.
- Puls: `js/heartrate.js` kapselt Web Bluetooth als austauschbare Quelle
  (vorbereitet für Capacitor-BLE / Health Connect / HealthKit).
- **Weg in die Stores:** Capacitor-Wrapper (`npx cap init`, `npx cap add android`),
  Android-Build lokal oder via GitHub Actions; iOS via Cloud-Build.
  Google Play: 25 $ einmalig (+ Testphase bei neuen Konten), Apple: 99 €/Jahr.
