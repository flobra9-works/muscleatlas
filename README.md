# MuscleAtlas 💪

Fitness-App für die Übungsauswahl im Gym — **App-Sprache: Englisch**, Muskeln
und Muskelgruppen mit **anatomisch-lateinischen Namen** (z. B. Latissimus dorsi,
Deltoideus posterior), Design: dunkler **„Neon Athletic"**-Look (Orange→Magenta).

Funktionen: Muskelgruppe am **anatomischen 3D-Render** (Vorder-/Rückansicht) oder per
Liste wählen → passende Übungen mit Filtern (Free weights / Machine,
Compound / Isolation) → bei 17 Übungen **interaktive Beanspruchungs-Ansicht**
(Heatmap + Balken je nach Ausführung). Dazu Workout-Planer, Trainingsmodus mit
gesprochenem Countdown (englisch), **Trainingshistorie mit Fortschritt**,
Puls-Kopplung und Spotify-Player.

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
2. **Echte Android-App (APK):** fertig eingerichtet — siehe „Android-App (APK)“
   weiter unten. Gebaut wird in der Cloud (GitHub Actions), auf dem PC braucht
   es dafür weder Android Studio noch das ~10 GB große Android-SDK.

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

## Android-App (APK)

Die App ist mit **Capacitor** als native Android-App verpackt.
Gebaut wird sie **in der Cloud**, damit auf dem PC kein JDK und kein
Android-SDK installiert werden muss.

**APK bauen und aufs Handy holen:**

1. Änderungen auf `main` pushen (oder auf GitHub → **Actions** →
   **„Android APK“** → **„Run workflow“** klicken).
2. Den fertigen Lauf öffnen → unten bei **Artifacts** liegt
   **`muscleatlas-debug-apk`**.
3. ZIP herunterladen, `app-debug.apk` aufs Handy kopieren und antippen.
   Android fragt einmal nach „Installation aus unbekannten Quellen erlauben“.

Es ist ein **Debug-Build** — zum Selbst-Installieren gedacht, nicht für den
Play Store. Für den Store braucht es zusätzlich einen signierten Release-Build
(Keystore als GitHub-Secret) und das Entwicklerkonto (25 $ einmalig).

**Beteiligte Dateien:**

| Datei | Zweck |
|---|---|
| `capacitor.config.json` | App-ID `io.github.flobra9works.muscleatlas`, Name, dunkler Hintergrund |
| `scripts/build-www.js` | kopiert die statischen Dateien nach `www/` (ohne `sw.js`) |
| `android/` | das native Projekt — wird mitversioniert, die CI baut daraus |
| `assets/icon.png`, `assets/splash.png` | Quellbilder für App-Icon und Splash |
| `.github/workflows/android.yml` | der Cloud-Build |

`npm run sync` baut `www/` neu und schiebt es ins Android-Projekt.
App-Icons neu erzeugen: `npx @capacitor/assets generate --android --iconBackgroundColor "#0c0e1a" --splashBackgroundColor "#0c0e1a"`.

Der Service Worker wird **absichtlich nicht** mit ins APK gepackt: in der
nativen WebView liegen die Dateien ohnehin lokal, und sein Cache würde nach
einem App-Update den alten Stand festhalten.

## Anatomie-Grafik (gerendert)

Die Körperkarte ist kein SVG mehr, sondern ein **Render des Z-Anatomy-Modells**
— echte Muskelfasern statt schematischer Flächen.

**Wie es funktioniert:** Neben der sichtbaren Platte rendert Blender eine
**ID-Map**, in der der Rotkanal jedes Pixels die Muskelregion kodiert
(Index × 12). Damit macht ein einziges Bild beide Jobs:

- **Klicken** → Pixel unter dem Finger auslesen → Region
- **Einfärben** → genau die Pixel dieser Region auf ein Overlay-Canvas malen

Klickflächen und Grafik können also nicht auseinanderlaufen — es gibt keine
handgezeichneten Umrisse, die nachgeführt werden müssten.

| Datei | Zweck |
|---|---|
| `assets/body/{front,back}.webp` | was man sieht (244 + 204 KB) |
| `assets/body/{front,back}-id.png` | was man klickt (je 11 KB) |
| `data/bodyregions.js` | **generiert** — Reihenfolge = Region-Index |
| `scripts/za-regions.py` | Zuordnung Muskelname → Region-ID (Quelle der Wahrheit) |
| `scripts/za-render.py` | Blender-Skript, rendert alle vier Bilder |
| `scripts/build-bodyplates.js` | WebP/PNG-Aufbereitung + `bodyregions.js` |

**Neu rendern** (braucht Blender und `vendor/Z-Anatomy/Startup.blend`):

```
"C:Program FilesBlender FoundationBlender 5.2lender.exe" -b vendor/Z-Anatomy/Startup.blend -P scripts/za-render.py
node scripts/build-bodyplates.js
```

`--test` rendert in halber Auflösung, `--idonly` nur die ID-Maps.

**Zwei Kniffe, die im Skript stehen und wichtig sind:**

1. Die `.blend` hat einen **aktiven Compositor**. Der überschreibt sonst alle
   Render-Einstellungen — das Ergebnis war viermal in Folge graue Strichgrafik.
   `sc.use_nodes = False`.
2. Zwei Regionen liegen anatomisch *unter* einer anderen: `rectus abdominis`
   unter der Aponeurose der Obliques, der untere Rücken unter dem Latissimus.
   Im **ID-Pass** (nicht in der Grafik!) werden sie 12 mm zur jeweiligen Kamera
   geschoben, sonst wählt ein Tipp auf das Sixpack die schrägen Bauchmuskeln.

**Warn-Ringe („vernachlässigte Muskeln"):** Gelbe Ringe markieren Muskeln, die
du länger nicht trainiert hast; die Zahl im Abzeichen sind **Tage seit dem
letzten Mal**. Antippen springt direkt zu den passenden Übungen.

- Zählt auch **sekundäre** Beanspruchung — Unterarme und Rumpf sind selten das
  Hauptziel, bekommen bei Rudern und Kniebeugen aber reichlich Reiz. Sonst
  würden sie dauerhaft gemeldet, ohne dass es stimmt.
- **Nie trainiert** zählt so alt wie das Log selbst. „Nie" in einem zwei Wochen
  alten Log ist schwächer als eine echte 30-Tage-Lücke — beides landet damit
  auf derselben Skala und die echten Lücken werden nicht verdrängt.
- Erst ab **3 Einheiten** überhaupt sichtbar, Schwelle **10 Tage**, „nie" erst
  ab **14 Tagen** Log-Alter, maximal **6 Ringe**. Sonst wäre der Körper bei
  neuen Nutzern komplett zugepflastert — Nörgeln statt Information.
- Sich überlappende Ringe werden auseinandergeschoben (benachbarte Muskeln wie
  obere Brust, vorderer Delta und Bizeps liegen dicht beieinander).

Stellschrauben: `MIN_SESSIONS`, `STALE_TAGE`, `NIE_AB_TAGEN`, `MAX_MARKER`
in `js/bodymap.js`.

**Lizenz/Attribution (Pflicht):** Die Grafik ist abgeleitet von
**Z-Anatomy** (CC BY-SA 4.0), das wiederum auf **BodyParts3D**
(CC BY-SA 2.1 Japan) beruht. Damit stehen **die gerenderten Bilder unter
CC BY-SA 4.0** — der Code bleibt davon unberührt. Der Hinweis steht in den
Settings ⚙ und muss dort bleiben.

**Nur männlich:** Z-Anatomy gibt es ausschließlich als männliches Modell. Die
frühere Umschaltung männlich/weiblich in der Kopfzeile ist deshalb entfallen;
das Geschlecht steht jetzt in den Settings und wird nur noch für die
Kalorienformeln (Keytel, Mifflin-St-Jeor) verwendet.

## Trainingshistorie (History-Tab)

Im Trainingsmodus stehen über dem „Set done“-Knopf zwei Regler: **Weight kg**
und **Reps** — das, was du wirklich gemacht hast. Sie sind mit den Werten der
**letzten Einheit** vorbelegt (nicht mit dem Plan), damit die Zahlen über
Wochen von selbst nach oben wandern. Jeder abgeschlossene Satz wird protokolliert.

Nach dem Workout wird die Einheit gespeichert und der History-Tab zeigt:

- **Kennzahlen** — Einheiten diese Woche, Wochen-Volumen, 30 Tage, Gesamt.
  *Volumen = Gewicht × Wiederholungen*, über alle Sätze summiert.
- **Wochen-Balken** der letzten 8 Wochen.
- **Liste aller Einheiten**; Antippen zeigt jeden einzelnen Satz, Dauer,
  Volumen, Puls und Kalorien. Dort lässt sich eine Einheit auch löschen.
- **🏆 Persönliche Bestleistung** direkt in der Workout-Zusammenfassung, wenn
  ein Satz schwerer war als alles bisher.
- In der **Übungs-Detailansicht**: „Your progress“ mit bester Leistung,
  letzter Einheit und einer Kurve über die letzten 12 Einheiten.

Es werden maximal 500 Einheiten gespeichert (danach fallen die ältesten weg).
Alles bleibt lokal im Browser.

## Datensicherung

Settings ⚙ → **Create backup** lädt eine JSON-Datei mit allen Workouts, der
Trainingshistorie und dem Profil herunter. Auf einem anderen Gerät: **Load backup** (akzeptiert auch
Sicherungen der alten deutschen Version).

---

## Technik (für später)

- Reines HTML/CSS/JS ohne Build-Schritt (`index.html` + `js/` + `data/`).
- **Bei Änderungen an CSS/JS/Grafik: `npm run bump`.** Das zählt die `?v=`-Nummer
  an allen drei Stellen gleichzeitig hoch — `index.html`, `sw.js` (inkl.
  Cache-Name) und `V` in `js/bodymap.js`. Von Hand geht das regelmäßig schief,
  und der Fehler ist unsichtbar: Der Browser liefert einfach weiter die alte
  Datei, bei der ID-Map landen Klicks dann auf den Regionen des letzten Builds.
- **`npm run check`** prüft das (läuft auch in der CI) und findet zusätzlich
  zwei Dinge, die den Offline-Betrieb ebenso lautlos zerlegen:
  eine in `index.html` geladene Datei, die im Service Worker fehlt (offline
  kaputt), und eine im Service Worker gelistete Datei, die es nicht mehr gibt —
  `cache.addAll` bricht bei einem einzigen 404 komplett ab, dann wird
  **gar nichts** gecached.
  Aktuell: `v=14`, Cache-Name `muscleatlas-v14`.
- Beim lokalen Entwickeln den Service Worker abmelden, sonst siehst du trotz
  Reload hartnäckig den alten Stand.
- Deep-Links: `index.html?gruppe=ruecken&region=lat`, `?uebung=rudern-kabel`, `?tab=training`, `?tab=historie`.
- Übungsdatenbank: `data/exercises.js` (122 Übungen, englisch, `nameDe` für die
  Suche; 17 interaktive Modelle — redaktionelle Richtwerte).
- Muskelnamen: `data/muscles.js` (Latein + englischer Alltagsname).
- Körpergrafiken: gerenderte Platten, siehe „Anatomie-Grafik“ unten.
- Puls: `js/heartrate.js` kapselt Web Bluetooth als austauschbare Quelle
  (vorbereitet für Capacitor-BLE / Health Connect / HealthKit).
- Historie: `js/history.js` (Ansichten) + `verlauf`-Array in `js/state.js`
  (Speicherung, Bestleistungen, Vorbelegung der nächsten Einheit).
- **Android:** Capacitor ist eingerichtet, der APK-Build läuft über GitHub
  Actions — siehe „Android-App (APK)“ oben.
- **Weg in die Stores:** Google Play braucht zusätzlich einen signierten
  Release-Build (25 $ einmalig, bei neuen Konten + Testphase). iOS würde
  `npx cap add ios` und einen Cloud-Build brauchen (Apple: 99 €/Jahr).
