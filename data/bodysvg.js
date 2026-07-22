/* MuskelAtlas — schematische Körpergrafiken (SVG)
   Parametrischer Builder: erzeugt männlich/weiblich × Vorder-/Rückansicht
   aus einem Parametersatz, damit alle Varianten dieselben klickbaren
   Regionen (data-region) besitzen.

   Koordinatensystem: viewBox 0 0 200 470, Körpermitte bei x = 100.
   Gespiegelte (rechte) Formen werden aus dem linken Pfad per mirrorD()
   erzeugt — Pfade dürfen deshalb nur die Befehle M, L, Q, C, Z nutzen. */

(function () {
  'use strict';

  const PARAMS = {
    m: {
      kopfR: 20, halsHalb: 9,
      schulterHalb: 56, deltCx: 50, deltRx: 10.5, deltRy: 11,
      brustHalb: 43, tailleHalb: 34, hueftHalb: 42,
      armCx: 53, armRx: 8, beinCx: 22,
      weiblich: false
    },
    w: {
      kopfR: 18.5, halsHalb: 7.5,
      schulterHalb: 46, deltCx: 41.5, deltRx: 8.5, deltRy: 10,
      brustHalb: 37.5, tailleHalb: 26.5, hueftHalb: 45,
      armCx: 44.5, armRx: 6.5, beinCx: 21,
      weiblich: true
    }
  };

  function r(n) { return Math.round(n * 10) / 10; }

  /* Spiegelt einen absoluten Pfad (M/L/Q/C/Z) an x = 100. */
  function mirrorD(d) {
    const tokens = d.match(/[MLQCZ]|-?\d+(?:\.\d+)?/g) || [];
    let istX = true;
    const out = tokens.map(t => {
      if (/[MLQCZ]/.test(t)) { istX = true; return t; }
      const wert = istX ? r(200 - parseFloat(t)) : parseFloat(t);
      istX = !istX;
      return wert;
    });
    return out.join(' ');
  }

  function pfad(d, cls) {
    return `<path d="${d}"${cls ? ` class="${cls}"` : ''}/>`;
  }
  function paar(d, cls) { return pfad(d, cls) + pfad(mirrorD(d), cls); }
  function ell(cx, cy, rx, ry, cls) {
    return `<ellipse cx="${r(cx)}" cy="${r(cy)}" rx="${r(rx)}" ry="${r(ry)}"${cls ? ` class="${cls}"` : ''}/>`;
  }
  function ellPaar(abstand, cy, rx, ry, cls) {
    return ell(100 - abstand, cy, rx, ry, cls) + ell(100 + abstand, cy, rx, ry, cls);
  }
  function region(id, inhalt) {
    const r = (typeof MUSKEL_REGIONEN !== 'undefined' && MUSKEL_REGIONEN[id]) ? MUSKEL_REGIONEN[id] : null;
    const label = r ? `${r.name} — ${r.en}` : id;
    return `<g class="muskel" data-region="${id}" role="button" tabindex="0" aria-label="${label}"><title>${label}</title>${inhalt}</g>`;
  }

  /* ---------- Silhouette (nicht klickbar) ---------- */

  function silhouette(p, ansicht) {
    const s = [];
    // Kopf
    s.push(ell(100, 30, p.kopfR, p.kopfR + 1.5, 'basis'));
    // Hals
    s.push(`<rect class="basis" x="${100 - p.halsHalb}" y="42" width="${p.halsHalb * 2}" height="24" rx="4"/>`);
    // Torso
    s.push(pfad(
      `M ${100 - p.halsHalb - 1} 58 ` +
      `Q ${100 - p.schulterHalb + 8} 64 ${100 - p.schulterHalb + 3} 76 ` +
      `L ${100 - p.brustHalb} 96 ` +
      `Q ${100 - p.brustHalb - 1} 122 ${100 - p.tailleHalb} 158 ` +
      `Q ${100 - p.hueftHalb - 2} 180 ${100 - p.hueftHalb} 198 ` +
      `L ${100 - p.hueftHalb + 8} 208 ` +
      `Q 100 216 ${100 + p.hueftHalb - 8} 208 ` +
      `L ${100 + p.hueftHalb} 198 ` +
      `Q ${100 + p.hueftHalb + 2} 180 ${100 + p.tailleHalb} 158 ` +
      `Q ${100 + p.brustHalb + 1} 122 ${100 + p.brustHalb} 96 ` +
      `L ${100 + p.schulterHalb - 3} 76 ` +
      `Q ${100 + p.schulterHalb - 8} 64 ${100 + p.halsHalb + 1} 58 Z`, 'basis'));
    // Schulter-/Arm-Basis (Deltakappe + Arm + Hand), links & rechts
    s.push(ellPaar(p.deltCx, 82, p.deltRx + 1.5, p.deltRy + 2, 'basis'));
    const a = p.armCx, aw = p.armRx + 1.5;
    s.push(paar(
      `M ${100 - a - aw} 84 ` +
      `Q ${100 - a - aw - 1} 120 ${100 - a - aw + 2} 150 ` +
      `Q ${100 - a - aw + 3} 185 ${100 - a - 5.5} 214 ` +
      `L ${100 - a + 5.5} 214 ` +
      `Q ${100 - a + aw - 2} 185 ${100 - a + aw - 1} 150 ` +
      `Q ${100 - a + aw} 120 ${100 - a + aw - 1} 84 Z`, 'basis'));
    s.push(ellPaar(a + 1, 224, 6, 11, 'basis')); // Hände
    // Beine
    const b = 100 - p.beinCx; // Mittellinie linkes Bein
    s.push(paar(
      `M ${b - 19} 202 ` +
      `Q ${b - 20} 255 ${b - 13} 305 ` +
      `L ${b - 11.5} 332 ` +
      `Q ${b - 14} 365 ${b - 9} 400 ` +
      `L ${b - 7} 432 ` +
      `L ${b + 7} 432 ` +
      `Q ${b + 9.5} 395 ${b + 8.5} 345 ` +
      `L ${b + 10} 330 ` +
      `Q ${b + 13} 280 ${b + 17} 214 ` +
      `L ${b + 18} 206 Z`, 'basis'));
    // Füße
    if (ansicht === 'vorne') {
      s.push(paar(`M ${b - 8} 432 L ${b - 10} 446 Q ${b - 4} 450 ${b + 6} 447 L ${b + 7} 432 Z`, 'basis'));
    } else {
      s.push(paar(`M ${b - 7} 432 L ${b - 7} 444 Q ${b} 448 ${b + 6} 444 L ${b + 6} 432 Z`, 'basis'));
    }
    // Frisur zur Unterscheidung m/w
    if (p.weiblich) {
      if (ansicht === 'vorne') {
        s.push(pfad(
          `M ${100 - p.kopfR - 4} 36 Q ${100 - p.kopfR - 2} 8 100 6 ` +
          `Q ${100 + p.kopfR + 2} 8 ${100 + p.kopfR + 4} 36 ` +
          `L ${100 + p.kopfR + 2} 58 Q ${100 + p.kopfR - 4} 50 ${100 + p.kopfR - 5} 30 ` +
          `Q 100 22 ${100 - p.kopfR + 5} 30 Q ${100 - p.kopfR + 4} 50 ${100 - p.kopfR - 2} 58 Z`, 'basis haar'));
      } else {
        s.push(ell(100, 12, 8, 7, 'basis haar')); // Haarknoten
        s.push(pfad(
          `M ${100 - p.kopfR - 3} 30 Q 100 4 ${100 + p.kopfR + 3} 30 ` +
          `Q ${100 + p.kopfR} 48 ${100 + p.halsHalb + 3} 54 ` +
          `L ${100 - p.halsHalb - 3} 54 Q ${100 - p.kopfR} 48 ${100 - p.kopfR - 3} 30 Z`, 'basis haar'));
      }
    } else if (ansicht === 'hinten') {
      s.push(pfad(
        `M ${100 - p.kopfR + 1} 22 Q 100 8 ${100 + p.kopfR - 1} 22 ` +
        `Q ${100 + p.kopfR - 2} 34 ${100 + p.kopfR - 4} 40 ` +
        `Q 100 34 ${100 - p.kopfR + 4} 40 Q ${100 - p.kopfR + 2} 34 ${100 - p.kopfR + 1} 22 Z`, 'basis haar'));
    }
    return `<g class="koerper-basis">${s.join('')}</g>`;
  }

  /* ---------- Muskelregionen Vorderansicht ---------- */

  function muskelnVorne(p) {
    const m = [];
    const bh = p.brustHalb, hh = p.halsHalb, a = p.armCx, b = 100 - p.beinCx;

    // Nacken (sichtbarer oberer Trapez neben dem Hals)
    m.push(region('nacken', paar(
      `M ${100 - hh - 1} 58 L ${100 - p.deltCx + 7} 72 Q ${100 - hh - 4} 66 ${100 - hh - 2} 60 Z`)));

    // Schultern
    m.push(region('schulter-vorne', ellPaar(p.deltCx - 3.5, 80, 6, 8.5)));
    m.push(region('schulter-seite', ellPaar(p.deltCx + 4, 84, 5.2, 9.5)));

    // Brust in drei Zonen (Lücke am Brustbein: x = 100 ± 2.5)
    const x0 = 100 - bh;                         // äußere Brustkante
    const uY = p.weiblich ? 104 : 107;           // Beginn untere Zone
    const uTief = p.weiblich ? 131 : 124;        // untere Wölbung
    m.push(region('brust-oben', paar(
      `M 97.5 75 L ${x0 + 5} 78 Q ${x0 + 1} 82 ${x0 + 1.5} 88 L 97.5 89 Z`)));
    m.push(region('brust-mitte', paar(
      `M 97.5 91 L ${x0 + 1.5} 90 L ${x0 + 0.5} ${uY - 3} L 97.5 ${uY - 2} Z`)));
    m.push(region('brust-unten', paar(
      `M 97.5 ${uY} L ${x0 + 0.5} ${uY - 1} Q ${x0 + 2} ${uTief - 7} ${x0 + 11} ${uTief} ` +
      `Q ${r((97.5 + x0) / 2)} ${uTief + 4} 97.5 ${uTief - 2} Z`)));

    // Arme
    m.push(region('bizeps', ellPaar(a, 119, p.armRx - 0.5, 23)));
    m.push(region('unterarme', paar(
      `M ${100 - a - p.armRx + 1} 152 Q ${100 - a - p.armRx - 1} 182 ${100 - a - 4} 210 ` +
      `L ${100 - a + 3.5} 210 Q ${100 - a + p.armRx - 1} 182 ${100 - a + p.armRx - 1.5} 150 ` +
      `Q ${100 - a} 146 ${100 - a - p.armRx + 1} 152 Z`)));

    // Bauch
    const bauchY1 = p.weiblich ? 132 : 130, bauchY2 = 190;
    m.push(region('bauch',
      `<rect x="87" y="${bauchY1}" width="26" height="${bauchY2 - bauchY1}" rx="7"/>`));
    m.push(region('bauch-seitlich', paar(
      `M 85 ${bauchY1} L ${x0 + 9} ${bauchY1 + 2} Q ${100 - p.tailleHalb - 1} 154 ${100 - p.tailleHalb + 3} 172 ` +
      `Q ${100 - 17} 184 ${100 - 14} 186 L 85 186 Z`)));

    // Beine
    m.push(region('quadrizeps', ellPaar(p.beinCx + 3.5, 264, 14.5, 52)));
    m.push(region('adduktoren', ellPaar(p.beinCx - 11, 238, 6.5, 29)));

    // Deko: Bauchlinien
    const deko =
      `<g class="deko">` +
      `<line x1="100" y1="${bauchY1 + 3}" x2="100" y2="${bauchY2 - 4}"/>` +
      `<line x1="89" y1="${bauchY1 + 15}" x2="111" y2="${bauchY1 + 15}"/>` +
      `<line x1="89" y1="${bauchY1 + 30}" x2="111" y2="${bauchY1 + 30}"/>` +
      `<line x1="89" y1="${bauchY1 + 45}" x2="111" y2="${bauchY1 + 45}"/>` +
      `</g>`;

    return m.join('') + deko;
  }

  /* ---------- Muskelregionen Rückansicht ---------- */

  function muskelnHinten(p) {
    const m = [];
    const bh = p.brustHalb, a = p.armCx, b = 100 - p.beinCx;

    // Nacken / oberer Trapez (Drachenform)
    m.push(region('nacken', pfad(
      `M 100 55 L ${100 - p.schulterHalb + 13} 75 L 100 86 L ${100 + p.schulterHalb - 13} 75 Z`)));

    // Hintere Schulter
    m.push(region('schulter-hinten', ellPaar(p.deltCx, 82, 8.5, 10)));

    // Oberer Rücken (mittlerer Trapez / Rhomboiden)
    const ro = r(bh * 0.56);
    m.push(region('ruecken-oben', pfad(
      `M 100 88 L ${100 - ro} 94 Q ${100 - ro + 3} 114 ${100 - ro + 9} 123 L 100 131 ` +
      `L ${100 + ro - 9} 123 Q ${100 + ro - 3} 114 ${100 + ro} 94 Z`)));

    // Latissimus (Flügel)
    m.push(region('lat', paar(
      `M ${100 - bh + 1} 97 Q ${100 - bh - 3} 120 ${100 - bh + 9} 140 ` +
      `Q ${100 - p.tailleHalb + 5} 153 ${100 - 10} 158 L ${100 - 9} 155 L ${100 - 9} 131 ` +
      `Q ${100 - 15} 113 ${100 - 21} 99 Z`)));

    // Unterer Rücken
    m.push(region('ruecken-unten',
      `<rect x="89" y="150" width="22" height="38" rx="6"/>`));

    // Arme
    m.push(region('trizeps', ellPaar(a, 119, p.armRx - 0.5, 23)));
    m.push(region('unterarme', paar(
      `M ${100 - a - p.armRx + 1} 152 Q ${100 - a - p.armRx - 1} 182 ${100 - a - 4} 210 ` +
      `L ${100 - a + 3.5} 210 Q ${100 - a + p.armRx - 1} 182 ${100 - a + p.armRx - 1.5} 150 ` +
      `Q ${100 - a} 146 ${100 - a - p.armRx + 1} 152 Z`)));

    // Gesäß
    const g = p.weiblich ? { cx: p.hueftHalb - 22, cy: 211, rx: 20, ry: 23 } : { cx: p.hueftHalb - 21, cy: 209, rx: 18, ry: 21 };
    m.push(region('gesaess', ellPaar(g.cx, g.cy, g.rx, g.ry)));

    // Beine
    m.push(region('beinbeuger', ellPaar(p.beinCx + 1, 274, 14, 41)));
    m.push(region('waden', ellPaar(p.beinCx + 1, 366, 11.5, 31)));

    // Deko: Wirbelsäule
    const deko = `<g class="deko"><line x1="100" y1="88" x2="100" y2="186"/></g>`;

    return m.join('') + deko;
  }

  /* ---------- Öffentliche API ---------- */

  window.BodySVG = {
    /* geschlecht: 'm' | 'w' — ansicht: 'vorne' | 'hinten' */
    erstelle(geschlecht, ansicht) {
      const p = PARAMS[geschlecht] || PARAMS.m;
      const muskeln = ansicht === 'hinten' ? muskelnHinten(p) : muskelnVorne(p);
      return `<svg class="koerper-svg" viewBox="0 0 200 470" data-geschlecht="${geschlecht}" data-ansicht="${ansicht}" ` +
        `xmlns="http://www.w3.org/2000/svg" aria-label="Körperansicht ${ansicht === 'hinten' ? 'Rückseite' : 'Vorderseite'}">` +
        silhouette(p, ansicht) + muskeln + `</svg>`;
    }
  };
})();
