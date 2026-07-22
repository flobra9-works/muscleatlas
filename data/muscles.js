/* MuscleAtlas — muscle regions and main muscle groups
   Region IDs match data-region in the body SVGs (data/bodysvg.js).
   IDs are internal and must never change (saved workouts depend on them). */

const MUSKEL_REGIONEN = {
  'nacken':          { name: 'Trapezius descendens',                 en: 'Upper traps / neck', kurz: 'Trapezius desc.' },
  'schulter-vorne':  { name: 'Deltoideus anterior',                  en: 'Front delts',        kurz: 'Delt. anterior' },
  'schulter-seite':  { name: 'Deltoideus lateralis',                 en: 'Side delts',         kurz: 'Delt. lateralis' },
  'schulter-hinten': { name: 'Deltoideus posterior',                 en: 'Rear delts',         kurz: 'Delt. posterior' },
  'brust-oben':      { name: 'Pectoralis major, pars clavicularis',  en: 'Upper chest',        kurz: 'Pect. clavicularis' },
  'brust-mitte':     { name: 'Pectoralis major, pars sternalis',     en: 'Mid chest',          kurz: 'Pect. sternalis' },
  'brust-unten':     { name: 'Pectoralis major, pars abdominalis',   en: 'Lower chest',        kurz: 'Pect. abdominalis' },
  'bizeps':          { name: 'Biceps brachii',                       en: 'Biceps',             kurz: 'Biceps brachii' },
  'trizeps':         { name: 'Triceps brachii',                      en: 'Triceps',            kurz: 'Triceps brachii' },
  'unterarme':       { name: 'Antebrachium',                         en: 'Forearms',           kurz: 'Antebrachium' },
  'bauch':           { name: 'Rectus abdominis',                     en: 'Abs / six-pack',     kurz: 'Rectus abd.' },
  'bauch-seitlich':  { name: 'Obliquus externus & internus',         en: 'Obliques',           kurz: 'Obliqui' },
  'ruecken-oben':    { name: 'Trapezius & Rhomboidei',               en: 'Upper back',         kurz: 'Trapezius/Rhomb.' },
  'lat':             { name: 'Latissimus dorsi',                     en: 'Lats',               kurz: 'Latissimus' },
  'ruecken-unten':   { name: 'Erector spinae',                       en: 'Lower back',         kurz: 'Erector spinae' },
  'gesaess':         { name: 'Gluteus maximus & medius',             en: 'Glutes',             kurz: 'Gluteus' },
  'quadrizeps':      { name: 'Quadriceps femoris',                   en: 'Quads',              kurz: 'Quadriceps' },
  'beinbeuger':      { name: 'Ischiocrurales',                       en: 'Hamstrings',         kurz: 'Hamstrings' },
  'adduktoren':      { name: 'Adductores',                           en: 'Inner thighs',       kurz: 'Adductores' },
  'waden':           { name: 'Triceps surae',                        en: 'Calves',             kurz: 'Triceps surae' }
};

/* Main muscle groups for the list selection.
   Clicking an SVG region selects its group (+ region as sub-filter). */
const MUSKEL_GRUPPEN = [
  { id: 'brust',     name: 'Pectoralis',        en: 'Chest',        regionen: ['brust-oben', 'brust-mitte', 'brust-unten'] },
  { id: 'ruecken',   name: 'Musculi dorsi',     en: 'Back',         regionen: ['ruecken-oben', 'lat', 'ruecken-unten'] },
  { id: 'schultern', name: 'Deltoideus',        en: 'Shoulders',    regionen: ['schulter-vorne', 'schulter-seite', 'schulter-hinten'] },
  { id: 'nacken',    name: 'Trapezius',         en: 'Neck & traps', regionen: ['nacken'] },
  { id: 'bizeps',    name: 'Biceps brachii',    en: 'Biceps',       regionen: ['bizeps'] },
  { id: 'trizeps',   name: 'Triceps brachii',   en: 'Triceps',      regionen: ['trizeps'] },
  { id: 'unterarme', name: 'Antebrachium',      en: 'Forearms',     regionen: ['unterarme'] },
  { id: 'bauch',     name: 'Musculi abdominis', en: 'Core / abs',   regionen: ['bauch', 'bauch-seitlich'] },
  { id: 'gesaess',   name: 'Gluteus',           en: 'Glutes',       regionen: ['gesaess'] },
  { id: 'beine',     name: 'Musculi femoris',   en: 'Thighs',       regionen: ['quadrizeps', 'beinbeuger', 'adduktoren'] },
  { id: 'waden',     name: 'Triceps surae',     en: 'Calves',       regionen: ['waden'] }
];

function gruppeZuRegion(regionId) {
  return MUSKEL_GRUPPEN.find(g => g.regionen.includes(regionId)) || null;
}

function regionName(regionId) {
  return (MUSKEL_REGIONEN[regionId] || {}).name || regionId;
}

function regionKurz(regionId) {
  return (MUSKEL_REGIONEN[regionId] || {}).kurz || regionId;
}

function regionEn(regionId) {
  return (MUSKEL_REGIONEN[regionId] || {}).en || '';
}
