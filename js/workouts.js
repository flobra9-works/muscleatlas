/* MuscleAtlas — workout planner (create and manage routines) */

const Workouts = {
  offenesId: null,   // currently open editor

  render() {
    const wrap = document.getElementById('workoutsInhalt');
    const ws = Speicher.daten.workouts;

    let html =
      `<div class="karten-kopf">` +
      `<h2 class="seiten-titel">My Workouts</h2>` +
      `<div class="mini-btns">` +
      `<button class="btn klein" id="wExport" title="Save all workouts to a file">⬇ Backup</button>` +
      `<button class="btn klein" id="wImport" title="Load a backup">⬆ Restore</button>` +
      `</div></div>`;

    if (!ws.length) {
      html += `<div class="leer-hinweis">No workouts yet.<br>Create your first routine and add exercises from the Muscles tab (＋ button).</div>`;
    } else {
      html += ws.map(w => this.workoutKarteHtml(w)).join('');
    }

    html += `<div class="btn-zeile"><button class="btn primaer breit" id="wNeu">＋ New workout</button></div>` +
      `<input type="file" id="wImportDatei" accept=".json,application/json" style="display:none">`;

    wrap.innerHTML = html;

    wrap.querySelector('#wNeu').addEventListener('click', () => {
      const w = Speicher.neuesWorkout('Workout ' + (ws.length + 1));
      this.offenesId = w.id;
      this.render();
      App.toast('Workout created — give it a name!');
    });
    wrap.querySelector('#wExport').addEventListener('click', () => {
      Speicher.exportiere();
      App.toast('Backup downloading …');
    });
    const dateiInput = wrap.querySelector('#wImportDatei');
    wrap.querySelector('#wImport').addEventListener('click', () => dateiInput.click());
    dateiInput.addEventListener('change', () => {
      const datei = dateiInput.files[0];
      if (!datei) return;
      const leser = new FileReader();
      leser.onload = () => {
        const erg = Speicher.importiere(String(leser.result));
        if (erg.ok) { App.toast(`Import successful: ${erg.anzahl} workouts loaded.`); App.alleAnsichtenAktualisieren(); }
        else App.toast('⚠ ' + erg.fehler);
      };
      leser.readAsText(datei);
    });

    // Card interactions
    ws.forEach(w => this.bindeWorkoutKarte(wrap, w));
  },

  workoutKarteHtml(w) {
    const saetze = w.uebungen.reduce((s, e) => s + (e.saetze || 0), 0);
    const offen = this.offenesId === w.id;
    let html =
      `<div class="workout-karte" data-wid="${w.id}">` +
      `<div class="workout-kopf">` +
      `<div><h3>${App.escapeHtml(w.name)}</h3>` +
      `<div class="meta">${w.uebungen.length} exercises · ${saetze} sets</div></div>` +
      `<div class="mini-btns">` +
      `<button class="mini-btn" data-aktion="training" title="Train this workout">▶</button>` +
      `<button class="mini-btn" data-aktion="duplizieren" title="Duplicate">⧉</button>` +
      `<button class="mini-btn" data-aktion="loeschen" title="Delete">🗑</button>` +
      `<button class="mini-btn" data-aktion="auf" title="${offen ? 'Collapse' : 'Edit'}">${offen ? '▲' : '✎'}</button>` +
      `</div></div>`;

    if (offen) {
      html += `<div class="feld" style="margin-top:10px;">` +
        `<label>Name</label>` +
        `<input type="text" data-feld="name" value="${App.escapeHtml(w.name)}" maxlength="40">` +
        `</div>`;
      if (!w.uebungen.length) {
        html += `<div class="leer-hinweis" style="margin-top:10px; padding:18px;">No exercises yet — add some.</div>`;
      } else {
        html += w.uebungen.map((e, i) => this.eintragHtml(w, e, i)).join('');
      }
      html += `<div class="btn-zeile"><button class="btn breit" data-aktion="uebungHinzu">＋ Add exercise</button></div>`;
    }
    html += `</div>`;
    return html;
  },

  eintragHtml(w, e, i) {
    const u = uebungVonId(e.uebungId);
    if (!u) return '';
    return `<div class="uebung-eintrag" data-index="${i}">` +
      `<div class="eintrag-kopf">` +
      `<div class="eintrag-name">${i + 1}. ${u.name}</div>` +
      `<div class="mini-btns">` +
      `<button class="mini-btn" data-e="hoch" title="Move up">↑</button>` +
      `<button class="mini-btn" data-e="runter" title="Move down">↓</button>` +
      `<button class="mini-btn" data-e="weg" title="Remove">✕</button>` +
      `</div></div>` +
      `<div class="eintrag-werte">` +
      `<div class="feld"><label>Sets</label><input type="number" min="1" max="20" data-e="saetze" value="${e.saetze}"></div>` +
      `<div class="feld"><label>Reps</label><input type="number" min="1" max="100" data-e="wdh" value="${e.wdh}"></div>` +
      `<div class="feld"><label>Weight kg</label><input type="number" min="0" max="600" step="0.5" data-e="gewicht" value="${e.gewicht}"></div>` +
      `<div class="feld"><label>Rest s</label><input type="number" min="0" max="900" step="5" data-e="pause" value="${e.pause}"></div>` +
      `</div></div>`;
  },

  bindeWorkoutKarte(wrap, w) {
    const karte = wrap.querySelector(`.workout-karte[data-wid="${w.id}"]`);
    if (!karte) return;

    karte.querySelectorAll('.workout-kopf .mini-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const aktion = btn.getAttribute('data-aktion');
        if (aktion === 'auf') {
          this.offenesId = this.offenesId === w.id ? null : w.id;
          this.render();
        } else if (aktion === 'loeschen') {
          if (confirm(`Delete workout “${w.name}”?`)) {
            Speicher.loescheWorkout(w.id);
            if (this.offenesId === w.id) this.offenesId = null;
            this.render();
            App.toast('Workout deleted.');
          }
        } else if (aktion === 'duplizieren') {
          Speicher.dupliziereWorkout(w.id);
          this.render();
          App.toast('Workout duplicated.');
        } else if (aktion === 'training') {
          Speicher.daten.letztesWorkoutId = w.id;
          Speicher.speichere();
          App.zeigeTab('training');
        }
      });
    });

    // Name
    const nameInput = karte.querySelector('input[data-feld="name"]');
    if (nameInput) {
      nameInput.addEventListener('change', () => {
        w.name = nameInput.value.trim() || 'Workout';
        Speicher.speichere();
        const h3 = karte.querySelector('h3');
        if (h3) h3.textContent = w.name;
      });
    }

    // Exercise entries
    karte.querySelectorAll('.uebung-eintrag').forEach(zeile => {
      const idx = parseInt(zeile.getAttribute('data-index'), 10);
      zeile.querySelectorAll('input[type=number]').forEach(inp => {
        inp.addEventListener('change', () => {
          const feld = inp.getAttribute('data-e');
          let wert = feld === 'gewicht' ? parseFloat(inp.value) : parseInt(inp.value, 10);
          if (isNaN(wert) || wert < 0) wert = 0;
          if (feld === 'saetze' && wert < 1) wert = 1;
          if (feld === 'wdh' && wert < 1) wert = 1;
          w.uebungen[idx][feld] = wert;
          inp.value = wert;
          Speicher.speichere();
        });
      });
      zeile.querySelectorAll('.mini-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const art = btn.getAttribute('data-e');
          if (art === 'weg') {
            w.uebungen.splice(idx, 1);
          } else if (art === 'hoch' && idx > 0) {
            [w.uebungen[idx - 1], w.uebungen[idx]] = [w.uebungen[idx], w.uebungen[idx - 1]];
          } else if (art === 'runter' && idx < w.uebungen.length - 1) {
            [w.uebungen[idx + 1], w.uebungen[idx]] = [w.uebungen[idx], w.uebungen[idx + 1]];
          } else return;
          Speicher.speichere();
          this.render();
        });
      });
    });

    const hinzu = karte.querySelector('[data-aktion="uebungHinzu"]');
    if (hinzu) hinzu.addEventListener('click', () => this.zeigePicker(w.id));
  },

  /* ---------- “＋ add to workout” (from the exercise browser) ---------- */

  zeigeWorkoutWahl(uebungId) {
    const u = uebungVonId(uebungId);
    if (!u) return;
    const ws = Speicher.daten.workouts;
    const wrap = document.getElementById('workoutWahlInhalt');

    wrap.innerHTML = `<div class="overlay-griff"></div>` +
      `<div class="overlay-kopf"><h2>Add “${u.name}” to …</h2>` +
      `<button class="schliessen-btn" data-schliessen>✕</button></div>` +
      (ws.length
        ? ws.map(w => `<button class="btn breit" style="margin-bottom:8px; justify-content:space-between;" data-wid="${w.id}">` +
            `<span>${App.escapeHtml(w.name)}</span><span class="hinweis-klein">${w.uebungen.length} exercises</span></button>`).join('')
        : `<div class="leer-hinweis" style="margin-bottom:10px;">No workouts yet.</div>`) +
      `<div class="btn-zeile"><button class="btn primaer breit" id="wahlNeu">＋ Into a new workout</button></div>`;

    App.zeigeOverlay('workoutWahl');
    wrap.querySelector('[data-schliessen]').addEventListener('click', () => App.schliesseOverlay('workoutWahl'));

    wrap.querySelectorAll('button[data-wid]').forEach(btn => {
      btn.addEventListener('click', () => {
        const wid = btn.getAttribute('data-wid');
        Speicher.fuegeUebungHinzu(wid, uebungId);
        App.schliesseOverlay('workoutWahl');
        const w = Speicher.workoutVonId(wid);
        App.toast(`“${u.name}” → ${w.name} ✓`);
        this.render();
      });
    });
    wrap.querySelector('#wahlNeu').addEventListener('click', () => {
      const w = Speicher.neuesWorkout('Workout ' + (ws.length + 1));
      Speicher.fuegeUebungHinzu(w.id, uebungId);
      App.schliesseOverlay('workoutWahl');
      App.toast(`“${u.name}” → ${w.name} ✓`);
      this.offenesId = w.id;
      this.render();
    });
  },

  /* ---------- Exercise picker (search inside the editor) ---------- */

  zeigePicker(workoutId) {
    const wrap = document.getElementById('uebungsPickerInhalt');
    wrap.innerHTML = `<div class="overlay-griff"></div>` +
      `<div class="overlay-kopf"><h2>Add exercise</h2>` +
      `<button class="schliessen-btn" data-schliessen>✕</button></div>` +
      `<div class="feld"><input type="search" id="pickerSuche" placeholder="Search exercises … (e.g. row, squat, Bankdrücken)" autocomplete="off"></div>` +
      `<div id="pickerListe" style="margin-top:10px;"></div>`;

    App.zeigeOverlay('uebungsPicker');
    wrap.querySelector('[data-schliessen]').addEventListener('click', () => App.schliesseOverlay('uebungsPicker'));

    const liste = wrap.querySelector('#pickerListe');
    const suche = wrap.querySelector('#pickerSuche');

    const zeichne = () => {
      const q = suche.value.trim().toLowerCase();
      const treffer = UEBUNGEN.filter(u =>
        !q || u.name.toLowerCase().includes(q) || u.nameDe.toLowerCase().includes(q) ||
        u.primaer.some(r => (regionName(r) + ' ' + regionEn(r)).toLowerCase().includes(q))
      ).slice(0, 40);
      liste.innerHTML = treffer.map(u =>
        `<div class="uebungs-karte" data-id="${u.id}" style="padding:10px 12px;">` +
        `<div class="uebungs-kopf"><div class="uebungs-name" style="font-size:.92rem;">${u.name}` +
        `<small>${u.primaer.map(regionKurz).join(', ')} · ${u.geraet}</small></div>` +
        `<button class="plus-btn">＋</button></div></div>`
      ).join('') || `<div class="leer-hinweis">Nothing found.</div>`;

      liste.querySelectorAll('.uebungs-karte').forEach(k => {
        k.addEventListener('click', () => {
          Speicher.fuegeUebungHinzu(workoutId, k.getAttribute('data-id'));
          App.toast('Added ✓');
          this.render();
        });
      });
    };
    suche.addEventListener('input', zeichne);
    zeichne();
    setTimeout(() => suche.focus(), 150);
  }
};
