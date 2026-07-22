/* MuskelAtlas — Körperkarte: Klick-Auswahl und Heatmap-Einfärbung */

const BodyMap = {

  render() {
    const g = (Speicher.daten && Speicher.daten.geschlecht) || 'm';
    document.getElementById('svgVorne').innerHTML = BodySVG.erstelle(g, 'vorne');
    document.getElementById('svgHinten').innerHTML = BodySVG.erstelle(g, 'hinten');
    this.bindeKlicks(document.getElementById('koerperkarte'));
    this.markiereAuswahl();
  },

  bindeKlicks(container) {
    container.querySelectorAll('.muskel').forEach(el => {
      const region = el.getAttribute('data-region');
      el.addEventListener('click', () => Uebungen.waehleRegion(region));
      el.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); Uebungen.waehleRegion(region); }
      });
    });
  },

  markiereAuswahl() {
    const aktiv = Uebungen.aktiveRegionen || [];
    document.querySelectorAll('#koerperkarte .muskel').forEach(el => {
      el.classList.toggle('gewaehlt', aktiv.includes(el.getAttribute('data-region')));
    });
  },

  /* Intensität 0–100 → Farbe (grau → gelb → orange → rot) */
  heatFarbe(intensitaet) {
    const t = Math.max(0, Math.min(100, intensitaet)) / 100;
    if (t <= 0.02) return '';
    const hue = 52 - 52 * t;          // 52 (gelb) → 0 (rot)
    const satt = 78 + 14 * t;
    const hell = 58 - 12 * t;
    return `hsl(${Math.round(hue)}, ${Math.round(satt)}%, ${Math.round(hell)}%)`;
  },

  /* Färbt alle .muskel-Gruppen unterhalb von wurzelEl nach map { regionId: 0–100 } */
  heatmap(wurzelEl, map) {
    wurzelEl.querySelectorAll('.muskel').forEach(el => {
      const region = el.getAttribute('data-region');
      const wert = map && map[region] ? map[region] : 0;
      const farbe = this.heatFarbe(wert);
      if (farbe) el.style.setProperty('--mf', farbe);
      else el.style.removeProperty('--mf');
    });
  },

  /* Kleine Doppel-Körperansicht (vorne+hinten) für die Detail-Heatmap.
     Muss direktes Flex-Kind von .heat-bereich sein (Breitenbegrenzung). */
  miniKoerper(id) {
    const g = (Speicher.daten && Speicher.daten.geschlecht) || 'm';
    return `<div class="heat-koerper"${id ? ` id="${id}"` : ''}>` +
      `<div>${BodySVG.erstelle(g, 'vorne')}</div>` +
      `<div>${BodySVG.erstelle(g, 'hinten')}</div>` +
      `</div>`;
  }
};
