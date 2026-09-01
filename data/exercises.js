/* MuscleAtlas — exercise database (editorially curated)
   Fields per exercise:
     id (internal, never change), name (display, English),
     nameDe (German name — kept for search),
     kategorie ('frei' = free weights | 'gefuehrt' = machine/guided),
     geraet (equipment label), komplex (true = compound, false = isolation),
     primaer[] / sekundaer[] (region IDs from data/muscles.js),
     beschreibung (how-to), variationen? (interactive activation model)

   Variation model:
     parameter: list of parameters with values
     beanspruchung: key = value IDs joined with '|' in parameter order.
       Values 0–100 = relative activation (rules of thumb from common
       training practice — not lab measurements!).
       Keys prefixed with '#' (e.g. '#Caput longum (long head)') appear
       as detail bars only, not in the body heatmap.
     erklaerung: one-liner per combination. */

/* Shared model for lat pulldown and pull-ups */
const VAR_VERTIKALZUG = {
  parameter: [
    { id: 'griffart', name: 'Grip', werte: [
      { id: 'ober', name: 'Overhand' },
      { id: 'unter', name: 'Underhand' },
      { id: 'neutral', name: 'Neutral (hammer)' }
    ]},
    { id: 'breite', name: 'Grip width', werte: [
      { id: 'breit', name: 'Wide' },
      { id: 'schmal', name: 'Shoulder-width / close' }
    ]}
  ],
  beanspruchung: {
    'ober|breit':    { lat: 90, 'ruecken-oben': 60, 'schulter-hinten': 45, bizeps: 35, unterarme: 30 },
    'ober|schmal':   { lat: 82, 'ruecken-oben': 55, 'schulter-hinten': 35, bizeps: 50, unterarme: 30 },
    'unter|breit':   { lat: 80, 'ruecken-oben': 55, bizeps: 55, unterarme: 25 },
    'unter|schmal':  { lat: 85, 'ruecken-oben': 45, bizeps: 70, unterarme: 25 },
    'neutral|breit': { lat: 86, 'ruecken-oben': 58, 'schulter-hinten': 40, bizeps: 45, unterarme: 35 },
    'neutral|schmal':{ lat: 88, 'ruecken-oben': 45, bizeps: 55, unterarme: 35 }
  },
  erklaerung: {
    'ober|breit':    'The classic for back width: maximum lat stretch with little help from the biceps.',
    'ober|schmal':   'Longer range of motion, the biceps assist noticeably more.',
    'unter|breit':   'Unusual combo — strong biceps involvement, more strain on the wrists.',
    'unter|schmal':  'Chin-up style: strongest biceps contribution while the lats stay under high tension.',
    'neutral|breit': 'Joint-friendly middle ground with solid lat and upper-back activity.',
    'neutral|schmal':'Wrist-friendly with a long range of motion — the lat works through its full length.'
  }
};

const UEBUNGEN = [

  /* ================= CHEST ================= */
  {
    id: 'bankdruecken-lh', name: 'Barbell Bench Press', nameDe: 'Bankdrücken',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['brust-mitte'], sekundaer: ['trizeps', 'schulter-vorne'],
    beschreibung: 'Lie on the flat bench with shoulder blades pinched and feet planted. Lower the bar to your mid chest and press it back up under control.',
    variationen: {
      parameter: [
        { id: 'winkel', name: 'Bench angle', werte: [
          { id: 'negativ', name: 'Decline (−15°)' },
          { id: 'flach', name: 'Flat (0°)' },
          { id: 'schraeg30', name: 'Incline (+30°)' },
          { id: 'schraeg45', name: 'Incline (+45°)' }
        ]},
        { id: 'griff', name: 'Grip width', werte: [
          { id: 'breit', name: 'Wide' },
          { id: 'schmal', name: 'Close' }
        ]}
      ],
      beanspruchung: {
        'negativ|breit':   { 'brust-unten': 90, 'brust-mitte': 60, trizeps: 30, 'schulter-vorne': 20 },
        'negativ|schmal':  { 'brust-unten': 80, 'brust-mitte': 55, trizeps: 65, 'schulter-vorne': 25 },
        'flach|breit':     { 'brust-mitte': 90, 'brust-unten': 40, 'brust-oben': 30, 'schulter-vorne': 40, trizeps: 35 },
        'flach|schmal':    { 'brust-mitte': 80, 'brust-unten': 35, 'brust-oben': 30, 'schulter-vorne': 45, trizeps: 70 },
        'schraeg30|breit': { 'brust-oben': 85, 'brust-mitte': 55, 'schulter-vorne': 55, trizeps: 30 },
        'schraeg30|schmal':{ 'brust-oben': 80, 'brust-mitte': 50, 'schulter-vorne': 60, trizeps: 60 },
        'schraeg45|breit': { 'brust-oben': 80, 'brust-mitte': 35, 'schulter-vorne': 75, trizeps: 30 },
        'schraeg45|schmal':{ 'brust-oben': 75, 'brust-mitte': 30, 'schulter-vorne': 80, trizeps: 55 }
      },
      erklaerung: {
        'negativ|breit':   'Pressing forward-and-down: the lower chest takes over and the shoulders are unloaded.',
        'negativ|schmal':  'Lower chest plus strong triceps work from the close grip.',
        'flach|breit':     'The classic: mid chest in focus, the wide grip shortens the path for the triceps.',
        'flach|schmal':    'A close grip shifts a large share of the work onto the triceps.',
        'schraeg30|breit': 'Pressing forward-and-up: the upper chest works hardest — the most popular incline.',
        'schraeg30|schmal':'Upper chest and triceps share the load.',
        'schraeg45|breit': 'From ~45° the front delts increasingly take over from the chest.',
        'schraeg45|schmal':'Steep angle + close grip: almost a shoulder press with triceps emphasis.'
      }
    }
  },
  {
    id: 'kh-bankdruecken', name: 'Dumbbell Bench Press', nameDe: 'Kurzhantel-Bankdrücken',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: true,
    primaer: ['brust-mitte'], sekundaer: ['trizeps', 'schulter-vorne'],
    beschreibung: 'Like the barbell press but with dumbbells: longer range of motion and much more stabilizer work. Bring the bells together over your chest.',
    variationen: {
      parameter: [
        { id: 'winkel', name: 'Bench angle', werte: [
          { id: 'flach', name: 'Flat (0°)' },
          { id: 'schraeg30', name: 'Incline (+30°)' },
          { id: 'schraeg45', name: 'Incline (+45°)' }
        ]}
      ],
      beanspruchung: {
        'flach':     { 'brust-mitte': 90, 'brust-unten': 40, 'brust-oben': 35, 'schulter-vorne': 45, trizeps: 40 },
        'schraeg30': { 'brust-oben': 88, 'brust-mitte': 50, 'schulter-vorne': 55, trizeps: 35 },
        'schraeg45': { 'brust-oben': 78, 'brust-mitte': 32, 'schulter-vorne': 78, trizeps: 35 }
      },
      erklaerung: {
        'flach':     'Mid chest; the free bell path also demands plenty of stabilizing muscle.',
        'schraeg30': 'The best angle for the upper chest with dumbbells.',
        'schraeg45': 'Front delts increasingly take over — stay flatter for pure chest work.'
      }
    }
  },
  {
    id: 'schraegbank-lh', name: 'Incline Bench Press', nameDe: 'Schrägbankdrücken',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['brust-oben'], sekundaer: ['schulter-vorne', 'trizeps'],
    beschreibung: 'Bench press on a 30–45° incline. Lower the bar toward the upper chest/collarbone — emphasizes the clavicular head of the pecs.'
  },
  {
    id: 'negativbank-lh', name: 'Decline Bench Press', nameDe: 'Negativ-Bankdrücken',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['brust-unten'], sekundaer: ['trizeps', 'schulter-vorne'],
    beschreibung: 'Bench press on a slight decline (−10 to −20°). Emphasizes the lower chest and takes strain off the shoulders.'
  },
  {
    id: 'liegestuetze', name: 'Push-up', nameDe: 'Liegestütze',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: true,
    primaer: ['brust-mitte'], sekundaer: ['trizeps', 'schulter-vorne', 'bauch'],
    beschreibung: 'Body in one straight line, hands about shoulder-width. Lower your chest toward the floor and press back up, core braced the whole time.',
    variationen: {
      parameter: [
        { id: 'position', name: 'Body position', werte: [
          { id: 'haende-hoch', name: 'Hands elevated' },
          { id: 'normal', name: 'Flat on the floor' },
          { id: 'fuesse-hoch', name: 'Feet elevated' }
        ]},
        { id: 'griff', name: 'Hand spacing', werte: [
          { id: 'breit', name: 'Wide' },
          { id: 'eng', name: 'Close' }
        ]}
      ],
      beanspruchung: {
        'haende-hoch|breit': { 'brust-unten': 80, 'brust-mitte': 60, trizeps: 30, 'schulter-vorne': 30, bauch: 20 },
        'haende-hoch|eng':   { 'brust-unten': 70, 'brust-mitte': 55, trizeps: 60, 'schulter-vorne': 30, bauch: 20 },
        'normal|breit':      { 'brust-mitte': 88, 'brust-unten': 45, 'brust-oben': 35, trizeps: 40, 'schulter-vorne': 40, bauch: 30 },
        'normal|eng':        { 'brust-mitte': 75, trizeps: 75, 'schulter-vorne': 45, 'brust-oben': 30, bauch: 30 },
        'fuesse-hoch|breit': { 'brust-oben': 85, 'brust-mitte': 50, 'schulter-vorne': 60, trizeps: 40, bauch: 35 },
        'fuesse-hoch|eng':   { 'brust-oben': 75, 'brust-mitte': 45, 'schulter-vorne': 60, trizeps: 70, bauch: 35 }
      },
      erklaerung: {
        'haende-hoch|breit': 'Elevated hands = pressing forward-and-down: lower chest, and easier overall — great starting point.',
        'haende-hoch|eng':   'Easier variation with triceps emphasis.',
        'normal|breit':      'The standard: mid chest in focus while the core stabilizes.',
        'normal|eng':        'Close hands (toward diamond): the triceps work almost as hard as the chest.',
        'fuesse-hoch|breit': 'Elevated feet = pressing forward-and-up: upper chest and shoulders.',
        'fuesse-hoch|eng':   'The hardest variation: upper chest, shoulders and triceps.'
      }
    }
  },
  {
    id: 'dips-brust', name: 'Chest Dips', nameDe: 'Dips (vorgelehnt)',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: true,
    primaer: ['brust-unten'], sekundaer: ['trizeps', 'schulter-vorne'],
    beschreibung: 'On the bars, lean forward and let the elbows flare slightly as you lower — the more you lean, the more (lower) chest.'
  },
  {
    id: 'fliegende-kh', name: 'Dumbbell Flys', nameDe: 'Fliegende',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['brust-mitte'], sekundaer: ['schulter-vorne'],
    beschreibung: 'On the flat bench, open slightly bent arms wide and bring them together over the chest — a pure stretch-and-squeeze isolation for the pecs.'
  },
  {
    id: 'kabel-crossover', name: 'Cable Crossover', nameDe: 'Kabelzug über Kreuz',
    kategorie: 'gefuehrt', geraet: 'Cable', komplex: false,
    primaer: ['brust-mitte'], sekundaer: ['brust-unten', 'brust-oben', 'schulter-vorne'],
    beschreibung: 'Bring the handles together in front of your body. Pulley height shifts the focus: high-to-low = lower chest, low-to-high = upper chest, horizontal = mid chest.',
    variationen: {
      parameter: [
        { id: 'hoehe', name: 'Pulley height', werte: [
          { id: 'hoch', name: 'High (pulling down)' },
          { id: 'mitte', name: 'Chest height' },
          { id: 'tief', name: 'Low (pulling up)' }
        ]}
      ],
      beanspruchung: {
        'hoch':  { 'brust-unten': 88, 'brust-mitte': 60, 'schulter-vorne': 25, trizeps: 20 },
        'mitte': { 'brust-mitte': 88, 'brust-oben': 45, 'brust-unten': 45, 'schulter-vorne': 30 },
        'tief':  { 'brust-oben': 85, 'brust-mitte': 55, 'schulter-vorne': 42 }
      },
      erklaerung: {
        'hoch':  'Hands meeting below the sternum: the lower chest shortens the most — the classic crossover.',
        'mitte': 'The most even variant: the whole pectoralis works, with no part clearly leading.',
        'tief':  'Sweeping up to chin height loads the clavicular (upper) chest — the front delts help noticeably.'
      }
    }
  },
  {
    id: 'brustpresse-maschine', name: 'Chest Press Machine', nameDe: 'Brustpresse',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: true,
    primaer: ['brust-mitte'], sekundaer: ['trizeps', 'schulter-vorne'],
    beschreibung: 'Guided pressing from a seated position — safe and easy to learn, ideal for beginners or clean reps to failure.'
  },
  {
    id: 'schraege-brustpresse-maschine', name: 'Incline Chest Press Machine', nameDe: 'Schräge Brustpresse',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: true,
    primaer: ['brust-oben'], sekundaer: ['schulter-vorne', 'trizeps'],
    beschreibung: 'Chest press with an upward pressing line — the guided alternative to incline bench pressing.'
  },
  {
    id: 'butterfly-maschine', name: 'Pec Deck', nameDe: 'Butterfly',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['brust-mitte'], sekundaer: [],
    beschreibung: 'Bring the arms together in front of the chest. Isolates the pecs completely — no triceps or stabilizers to limit the set.'
  },
  {
    id: 'multipresse-bankdruecken', name: 'Smith Machine Bench Press', nameDe: 'Bankdrücken an der Multipresse',
    kategorie: 'gefuehrt', geraet: 'Smith machine', komplex: true,
    primaer: ['brust-mitte'], sekundaer: ['trizeps', 'schulter-vorne'],
    beschreibung: 'Bench press on a guided bar — great for training safely without a spotter; pick any bench angle as usual.'
  },
  {
    id: 'ueberzuege-kh', name: 'Dumbbell Pullover', nameDe: 'Überzüge',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['brust-mitte'], sekundaer: ['lat', 'trizeps'],
    beschreibung: 'Lying across a bench, lower one dumbbell behind your head with almost straight arms and pull it back over — stretches chest and lats.'
  },

  {
    id: 'schraegbank-kh', name: 'Incline Dumbbell Press', nameDe: 'Schrägbankdrücken mit Kurzhanteln',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: true,
    primaer: ['brust-oben'], sekundaer: ['schulter-vorne', 'trizeps'],
    beschreibung: 'Bench set to about 30–45°. Press the dumbbells up and slightly together — the free path lets you go deeper than with a barbell and hits the clavicular chest hard.'
  },
  {
    id: 'schraege-fliegende-kh', name: 'Incline Dumbbell Fly', nameDe: 'Schrägbank-Fliegende',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['brust-oben'], sekundaer: ['schulter-vorne'],
    beschreibung: 'On a 30° incline, open your arms wide with a slight elbow bend and hug them back together — isolation for the upper chest.'
  },
  {
    id: 'kabelzug-tief-hoch', name: 'Low-to-High Cable Fly', nameDe: 'Kabelzug von unten nach oben',
    kategorie: 'gefuehrt', geraet: 'Cable', komplex: false,
    primaer: ['brust-oben'], sekundaer: ['schulter-vorne'],
    beschreibung: 'Pulleys at the bottom, arms sweeping up and inwards to chin height — constant tension on the upper chest through the whole range.'
  },
  {
    id: 'liegestuetze-fuesse-hoch', name: 'Feet-Elevated Push-up', nameDe: 'Liegestütze mit erhöhten Füßen',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: true,
    primaer: ['brust-oben'], sekundaer: ['schulter-vorne', 'trizeps'],
    beschreibung: 'Push-up with your feet on a bench or box. The steeper the angle, the more the upper chest and front delts take over.'
  },

  /* ================= BACK ================= */
  {
    id: 'klimmzuege', name: 'Pull-up', nameDe: 'Klimmzüge',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: true,
    primaer: ['lat'], sekundaer: ['ruecken-oben', 'bizeps', 'unterarme', 'schulter-hinten'],
    beschreibung: 'From a dead hang, pull your chin over the bar while driving the shoulder blades down and back. The king of back-width exercises.',
    variationen: VAR_VERTIKALZUG
  },
  {
    id: 'latzug', name: 'Lat Pulldown', nameDe: 'Latzug',
    kategorie: 'gefuehrt', geraet: 'Cable', komplex: true,
    primaer: ['lat'], sekundaer: ['ruecken-oben', 'bizeps', 'schulter-hinten'],
    beschreibung: 'Pull the bar to your upper chest with a slight lean-back and proud chest. The guided pull-up alternative with adjustable load.',
    variationen: VAR_VERTIKALZUG
  },
  {
    id: 'rudern-kabel', name: 'Seated Cable Row', nameDe: 'Rudern am Kabel (sitzend)',
    kategorie: 'gefuehrt', geraet: 'Cable', komplex: true,
    primaer: ['ruecken-oben', 'lat'], sekundaer: ['schulter-hinten', 'bizeps', 'ruecken-unten'],
    beschreibung: 'Sit tall and pull the handle to your body, squeezing the shoulder blades together while the torso stays still. Pull height decides the focus.',
    variationen: {
      parameter: [
        { id: 'richtung', name: 'Pull direction', werte: [
          { id: 'hals', name: 'To the neck (high)' },
          { id: 'brust', name: 'To the chest (mid)' },
          { id: 'bauch', name: 'To the navel (low)' }
        ]}
      ],
      beanspruchung: {
        'hals':  { 'ruecken-oben': 85, 'schulter-hinten': 90, nacken: 45, lat: 25, bizeps: 35 },
        'brust': { 'ruecken-oben': 80, lat: 60, 'schulter-hinten': 60, bizeps: 40 },
        'bauch': { lat: 90, 'ruecken-oben': 60, 'schulter-hinten': 35, bizeps: 45, 'ruecken-unten': 20 }
      },
      erklaerung: {
        'hals':  'High pull with flared elbows: rear delts and upper back — excellent for posture.',
        'brust': 'Mid-height pull: balanced work between upper back and lats.',
        'bauch': 'Low pull with tucked elbows: the lats take over — this builds back width.'
      }
    }
  },
  {
    id: 'rudern-lh', name: 'Barbell Row', nameDe: 'Langhantelrudern',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['ruecken-oben', 'lat'], sekundaer: ['schulter-hinten', 'bizeps', 'ruecken-unten', 'beinbeuger'],
    beschreibung: 'Hinge forward with a flat back and row the bar into your body. Demanding, but one of the best mass builders for the back.',
    variationen: {
      parameter: [
        { id: 'winkel', name: 'Torso angle', werte: [
          { id: 'waagrecht', name: 'Nearly horizontal' },
          { id: 'aufrecht', name: 'More upright (~45°)' }
        ]},
        { id: 'griff', name: 'Grip', werte: [
          { id: 'ober', name: 'Overhand' },
          { id: 'unter', name: 'Underhand' }
        ]}
      ],
      beanspruchung: {
        'waagrecht|ober': { 'ruecken-oben': 85, lat: 70, 'schulter-hinten': 55, bizeps: 40, 'ruecken-unten': 45, beinbeuger: 25 },
        'waagrecht|unter':{ lat: 85, 'ruecken-oben': 65, bizeps: 55, 'ruecken-unten': 45, 'schulter-hinten': 40 },
        'aufrecht|ober':  { 'ruecken-oben': 78, nacken: 50, lat: 55, 'schulter-hinten': 45, 'ruecken-unten': 25 },
        'aufrecht|unter': { lat: 75, 'ruecken-oben': 60, bizeps: 60, nacken: 35, 'ruecken-unten': 25 }
      },
      erklaerung: {
        'waagrecht|ober': 'Low position, pulling to the stomach: maximum upper back, with the lower back holding hard against it.',
        'waagrecht|unter':'The underhand grip brings lats and biceps in much more strongly.',
        'aufrecht|ober':  'Upright style, pulling to the chest: more traps and upper back, less postural work.',
        'aufrecht|unter': 'Yates row: upright with underhand grip — lat-focused and very loadable.'
      }
    }
  },
  {
    id: 'rudern-kh-einarmig', name: 'One-Arm Dumbbell Row', nameDe: 'Einarmiges Kurzhantelrudern',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: true,
    primaer: ['lat', 'ruecken-oben'], sekundaer: ['schulter-hinten', 'bizeps'],
    beschreibung: 'With knee and hand braced on a bench, row the dumbbell to your hip — full range of motion with a well-protected lower back.'
  },
  {
    id: 'rudern-maschine', name: 'Chest-Supported Row', nameDe: 'Rudermaschine (Brustauflage)',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: true,
    primaer: ['ruecken-oben', 'lat'], sekundaer: ['schulter-hinten', 'bizeps'],
    beschreibung: 'Rowing with your torso braced on a pad — the lower back is taken out entirely, so clean technique comes easy.'
  },
  {
    id: 't-bar-rudern', name: 'T-Bar Row', nameDe: 'T-Bar-Rudern',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['ruecken-oben', 'lat'], sekundaer: ['schulter-hinten', 'bizeps', 'ruecken-unten'],
    beschreibung: 'Rowing on a landmine bar with a V-handle — allows heavy loads from a slightly more upright position.'
  },
  {
    id: 'kreuzheben', name: 'Deadlift', nameDe: 'Kreuzheben',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['ruecken-unten', 'gesaess', 'beinbeuger'], sekundaer: ['quadrizeps', 'ruecken-oben', 'nacken', 'unterarme', 'lat'],
    beschreibung: 'Stand the bar up from the floor with a flat back, extending hips and knees together. The foundational lift for the entire posterior chain.'
  },
  {
    id: 'assisted-pullup-maschine', name: 'Assisted Pull-up Machine', nameDe: 'Klimmzugmaschine (unterstützt)',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: true,
    primaer: ['lat'], sekundaer: ['ruecken-oben', 'bizeps'],
    beschreibung: 'Pull-ups with counterweight assistance — the perfect way to work up to free pull-ups.'
  },
  {
    id: 'hyperextensions', name: 'Back Extension', nameDe: 'Rückenstrecken',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: false,
    primaer: ['ruecken-unten'], sekundaer: ['gesaess', 'beinbeuger'],
    beschreibung: 'On the hyperextension bench, lower your torso under control and raise it back to a straight line — targeted strength for the lower back.'
  },
  {
    id: 'good-mornings', name: 'Good Morning', nameDe: 'Good Mornings',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['beinbeuger', 'ruecken-unten'], sekundaer: ['gesaess'],
    beschreibung: 'With the bar on your back, push the hips back and hinge the torso forward, back flat — a hip hinge with a deep stretch for the hamstrings.'
  },
  {
    id: 'superman', name: 'Superman Hold', nameDe: 'Superman',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: false,
    primaer: ['ruecken-unten'], sekundaer: ['gesaess', 'ruecken-oben'],
    beschreibung: 'Lying face down, lift arms and legs at the same time and hold briefly — a simple no-equipment move for the spinal erectors.'
  },
  {
    id: 'ueberzuege-kabel', name: 'Straight-Arm Pulldown', nameDe: 'Latzug mit gestreckten Armen',
    kategorie: 'gefuehrt', geraet: 'Cable', komplex: false,
    primaer: ['lat'], sekundaer: ['trizeps', 'bauch'],
    beschreibung: 'Standing, sweep the bar from overhead down to your hips with nearly straight arms — isolates the lats with zero biceps involvement.'
  },
  {
    id: 'pullover-maschine', name: 'Machine Pullover', nameDe: 'Pullover-Maschine',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['lat'], sekundaer: ['brust-mitte', 'trizeps'],
    beschreibung: 'A guided pullover arc — trains the lats through a huge range of motion with no balancing act.'
  },

  {
    id: 'rudern-pendlay', name: 'Pendlay Row', nameDe: 'Pendlay-Rudern',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['ruecken-oben', 'lat'], sekundaer: ['ruecken-unten', 'bizeps'],
    beschreibung: 'Torso parallel to the floor, the bar resting on the ground between reps. Every rep starts from a dead stop — explosive and strict, with no swing.'
  },
  {
    id: 'rudern-inverse', name: 'Inverted Row', nameDe: 'Umgekehrtes Rudern',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: true,
    primaer: ['ruecken-oben', 'lat'], sekundaer: ['bizeps', 'schulter-hinten'],
    beschreibung: 'Hang under a bar with your body straight and pull your chest to it. Raise or lower the bar to adjust the difficulty — the beginner-friendly way into rowing.'
  },
  {
    id: 'rack-pulls', name: 'Rack Pull', nameDe: 'Rack Pulls',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['ruecken-oben', 'ruecken-unten'], sekundaer: ['lat', 'unterarme', 'gesaess'],
    beschreibung: 'Deadlift from knee height out of the rack. The short range lets you handle heavy loads for the upper back and grip while sparing the lower back.'
  },
  {
    id: 'reverse-hyperextensions', name: 'Reverse Hyperextension', nameDe: 'Reverse Hyperextensions',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['ruecken-unten', 'gesaess'], sekundaer: ['beinbeuger'],
    beschreibung: 'Upper body fixed, legs swinging up from below. Trains the back extensors and glutes with almost no compression on the spine.'
  },

  /* ================= NECK / TRAPS ================= */
  {
    id: 'shrugs-lh', name: 'Barbell Shrug', nameDe: 'Shrugs',
    kategorie: 'frei', geraet: 'Barbell', komplex: false,
    primaer: ['nacken'], sekundaer: ['unterarme'],
    beschreibung: 'Arms hanging, pull your shoulders straight up toward your ears, hold briefly, lower slowly — no circling.',
    variationen: {
      parameter: [
        { id: 'koerper', name: 'Torso', werte: [
          { id: 'aufrecht', name: 'Upright' },
          { id: 'vorgebeugt', name: 'Bent over (~45°)' }
        ]},
        { id: 'hanteln', name: 'Load held', werte: [
          { id: 'seitlich', name: 'At the sides (dumbbells)' },
          { id: 'vorne', name: 'In front (barbell)' }
        ]}
      ],
      beanspruchung: {
        'aufrecht|seitlich':   { nacken: 90, unterarme: 35, '#Trapezius descendens (upper)': 90, '#Trapezius transversus (middle)': 30 },
        'aufrecht|vorne':      { nacken: 88, unterarme: 40, '#Trapezius descendens (upper)': 88, '#Trapezius transversus (middle)': 25 },
        'vorgebeugt|seitlich': { 'ruecken-oben': 78, nacken: 55, 'schulter-hinten': 40, '#Trapezius descendens (upper)': 50, '#Trapezius transversus (middle)': 82 },
        'vorgebeugt|vorne':    { 'ruecken-oben': 75, nacken: 55, 'schulter-hinten': 40, '#Trapezius descendens (upper)': 50, '#Trapezius transversus (middle)': 80 }
      },
      erklaerung: {
        'aufrecht|seitlich':   'Classic shrugs: upper traps, with dumbbells at the sides allowing the most natural path.',
        'aufrecht|vorne':      'With the barbell in front — heavy loading, slightly restricted path.',
        'vorgebeugt|seitlich': 'Bent over, the pull moves into the middle traps between the shoulder blades.',
        'vorgebeugt|vorne':    'Bent-over barbell shrugs: middle traps, great for posture.'
      }
    }
  },
  {
    id: 'shrugs-kh', name: 'Dumbbell Shrug', nameDe: 'Shrugs mit Kurzhanteln',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['nacken'], sekundaer: ['unterarme'],
    beschreibung: 'Shrugs with dumbbells at your sides — natural shoulder path, can also be done one side at a time.'
  },
  {
    id: 'face-pulls', name: 'Face Pull', nameDe: 'Face Pulls',
    kategorie: 'gefuehrt', geraet: 'Cable', komplex: false,
    primaer: ['schulter-hinten'], sekundaer: ['ruecken-oben', 'nacken'],
    beschreibung: 'Pull the rope toward your face at eye level, driving the elbows wide and back — a must-do for healthy shoulders and upright posture.'
  },

  {
    id: 'shrugs-maschine', name: 'Machine Shrug', nameDe: 'Nackenziehen an der Maschine',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['nacken'], sekundaer: ['unterarme'],
    beschreibung: 'Shrugs on a guided machine — the fixed path lets you focus on the squeeze at the top instead of on balancing the weight.'
  },

  /* ================= SHOULDERS ================= */
  {
    id: 'schulterdruecken-kh', name: 'Dumbbell Shoulder Press', nameDe: 'Schulterdrücken',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: true,
    primaer: ['schulter-vorne', 'schulter-seite'], sekundaer: ['trizeps', 'nacken'],
    beschreibung: 'Seated or standing, press the dumbbells from shoulder height overhead with a braced core — the fundamental shoulder builder.',
    variationen: {
      parameter: [
        { id: 'ausfuehrung', name: 'Style', werte: [
          { id: 'klassisch', name: 'Classic' },
          { id: 'arnold', name: 'Arnold press' }
        ]},
        { id: 'ellbogen', name: 'Elbow path', werte: [
          { id: 'seitlich', name: 'Flared out' },
          { id: 'vorne', name: 'Slightly forward' }
        ]}
      ],
      beanspruchung: {
        'klassisch|seitlich': { 'schulter-vorne': 78, 'schulter-seite': 68, trizeps: 55, nacken: 30 },
        'klassisch|vorne':    { 'schulter-vorne': 88, 'schulter-seite': 45, trizeps: 55, nacken: 28, 'brust-oben': 22 },
        'arnold|seitlich':    { 'schulter-vorne': 85, 'schulter-seite': 60, trizeps: 50, nacken: 30 },
        'arnold|vorne':       { 'schulter-vorne': 88, 'schulter-seite': 55, trizeps: 50, nacken: 30 }
      },
      erklaerung: {
        'klassisch|seitlich': 'Flared elbows: the side delts contribute strongly — for rounder shoulders.',
        'klassisch|vorne':    'Elbows slightly forward is easier on the joints but emphasizes the front delts.',
        'arnold|seitlich':    'Arnold press: the rotation keeps the front delts loaded through the full path.',
        'arnold|vorne':       'Arnold press with a tight path — maximum time under tension for the front delts.'
      }
    }
  },
  {
    id: 'schulterdruecken-lh', name: 'Overhead Press', nameDe: 'Military Press',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['schulter-vorne'], sekundaer: ['schulter-seite', 'trizeps', 'nacken', 'bauch'],
    beschreibung: 'Standing, press the barbell from your collarbone to overhead with glutes and abs locked tight — full-body tension included.'
  },
  {
    id: 'schulterdruecken-maschine', name: 'Shoulder Press Machine', nameDe: 'Schulterpresse',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: true,
    primaer: ['schulter-vorne', 'schulter-seite'], sekundaer: ['trizeps'],
    beschreibung: 'Guided overhead pressing — safe without a spotter and great for fatiguing the delts precisely.'
  },
  {
    id: 'seitheben', name: 'Lateral Raise', nameDe: 'Seitheben',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['schulter-seite'], sekundaer: ['nacken', 'schulter-vorne'],
    beschreibung: 'Raise slightly bent arms out to shoulder height, thumbs tilted a touch down — THE exercise for shoulder width.',
    variationen: {
      parameter: [
        { id: 'hand', name: 'Hand position', werte: [
          { id: 'neutral', name: 'Neutral (thumb forward)' },
          { id: 'runter', name: 'Thumb down (pouring)' },
          { id: 'hoch', name: 'Thumb up' }
        ]},
        { id: 'rumpf', name: 'Torso', werte: [
          { id: 'aufrecht', name: 'Upright' },
          { id: 'vorgebeugt', name: 'Bent forward' }
        ]}
      ],
      beanspruchung: {
        'neutral|aufrecht':   { 'schulter-seite': 85, 'schulter-vorne': 30, nacken: 28 },
        'neutral|vorgebeugt': { 'schulter-seite': 68, 'schulter-hinten': 60, 'ruecken-oben': 38 },
        'runter|aufrecht':    { 'schulter-seite': 90, 'schulter-hinten': 30, nacken: 25 },
        'runter|vorgebeugt':  { 'schulter-seite': 70, 'schulter-hinten': 65, 'ruecken-oben': 40 },
        'hoch|aufrecht':      { 'schulter-seite': 75, 'schulter-vorne': 45, nacken: 30 },
        'hoch|vorgebeugt':    { 'schulter-seite': 62, 'schulter-hinten': 55, 'ruecken-oben': 35 }
      },
      erklaerung: {
        'neutral|aufrecht':   'The safe default: side delt clearly in front, shoulder joint in a neutral position.',
        'neutral|vorgebeugt': 'Leaning forward turns the raise into a rear-delt movement — the upper back joins in.',
        'runter|aufrecht':    'Maximum side-delt tension. Some shoulders find this internally rotated position irritating — back off if it pinches.',
        'runter|vorgebeugt':  'Strongest rear-delt version of the raise; the side delt still works hard.',
        'hoch|aufrecht':      'Thumbs up shifts part of the load to the front delt — easier on the shoulder, less side-delt focus.',
        'hoch|vorgebeugt':    'Gentle mix: rear and side delt share the work, load stays moderate.'
      }
    }
  },
  {
    id: 'seitheben-kabel', name: 'Cable Lateral Raise', nameDe: 'Seitheben am Kabel',
    kategorie: 'gefuehrt', geraet: 'Cable', komplex: false,
    primaer: ['schulter-seite'], sekundaer: ['nacken'],
    beschreibung: 'One-arm lateral raises on the low pulley — constant tension through the whole range, even at the bottom.'
  },
  {
    id: 'seitheben-maschine', name: 'Lateral Raise Machine', nameDe: 'Seitheben-Maschine',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['schulter-seite'], sekundaer: ['nacken'],
    beschreibung: 'Guided lateral raises with pads at the upper arms — no momentum possible, clean side-delt isolation.'
  },
  {
    id: 'frontheben', name: 'Front Raise', nameDe: 'Frontheben',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['schulter-vorne'], sekundaer: ['brust-oben'],
    beschreibung: 'Raise straight arms alternately to shoulder height in front of you — targets the front delts (often unnecessary if you press a lot).'
  },
  {
    id: 'butterfly-reverse', name: 'Reverse Pec Deck', nameDe: 'Reverse Butterfly',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['schulter-hinten'], sekundaer: ['ruecken-oben'],
    beschreibung: 'Sitting reversed on the pec deck, open the arms backward — isolates the rear delts, key for balanced shoulders.'
  },
  {
    id: 'reverse-flys', name: 'Bent-Over Reverse Fly', nameDe: 'Reverse Flys',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['schulter-hinten'], sekundaer: ['ruecken-oben', 'nacken'],
    beschreibung: 'Bent over, raise slightly bent arms out to the sides like spreading wings — rear delts and upper back.'
  },
  {
    id: 'rudern-aufrecht', name: 'Upright Row', nameDe: 'Aufrechtes Rudern',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['schulter-seite', 'nacken'], sekundaer: ['bizeps', 'schulter-vorne'],
    beschreibung: 'Pull the bar up close to your body to chest height, elbows leading. A wider grip and not pulling too high keeps the shoulder joints happy.'
  },
  {
    id: 'landmine-press', name: 'Landmine Press', nameDe: 'Landmine-Press',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['schulter-vorne'], sekundaer: ['brust-oben', 'trizeps', 'bauch'],
    beschreibung: 'Press one end of the bar up and forward (other end anchored on the floor) — a shoulder-friendly angle between bench and overhead pressing.'
  },

  {
    id: 'arnold-press', name: 'Arnold Press', nameDe: 'Arnold-Drücken',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: true,
    primaer: ['schulter-vorne', 'schulter-seite'], sekundaer: ['trizeps', 'nacken'],
    beschreibung: 'Start with palms facing you, rotate the dumbbells outwards as you press overhead. The rotation adds range and brings the side delts in far more than a plain press.'
  },
  {
    id: 'reverse-flys-kabel', name: 'Cable Reverse Fly', nameDe: 'Reverse Flys am Kabel',
    kategorie: 'gefuehrt', geraet: 'Cable', komplex: false,
    primaer: ['schulter-hinten'], sekundaer: ['ruecken-oben'],
    beschreibung: 'Cross the cables in front of you and pull them apart in a wide arc. Unlike dumbbells the tension stays on the rear delts even at the start of the rep.'
  },
  {
    id: 'reverse-flys-schraegbank', name: 'Prone Incline Reverse Fly', nameDe: 'Reverse Flys auf der Schrägbank',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['schulter-hinten'], sekundaer: ['ruecken-oben'],
    beschreibung: 'Lie chest-down on an incline bench and raise the dumbbells out to the sides. The bench kills the swing, so the rear delts do all the work.'
  },
  {
    id: 'pike-liegestuetze', name: 'Pike Push-up', nameDe: 'Pike-Liegestütze',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: true,
    primaer: ['schulter-vorne'], sekundaer: ['trizeps', 'schulter-seite'],
    beschreibung: 'Hips high in an upside-down V, lower the crown of your head towards the floor — the bodyweight route to overhead pressing.'
  },

  /* ================= BICEPS ================= */
  {
    id: 'kh-curls', name: 'Dumbbell Curl', nameDe: 'Kurzhantelcurls',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['bizeps'], sekundaer: ['unterarme'],
    beschreibung: 'Curl the dumbbells up with quiet upper arms and no swing. Grip style and bench position shift the focus between the elbow flexors.',
    variationen: {
      parameter: [
        { id: 'griff', name: 'Grip', werte: [
          { id: 'unter', name: 'Underhand (supinated)' },
          { id: 'hammer', name: 'Hammer (neutral)' },
          { id: 'ober', name: 'Overhand (reverse)' }
        ]},
        { id: 'position', name: 'Position', werte: [
          { id: 'stehend', name: 'Standing' },
          { id: 'schraegbank', name: 'On an incline bench' }
        ]}
      ],
      beanspruchung: {
        'unter|stehend':     { bizeps: 90, unterarme: 30, '#Caput breve (short head)': 80, '#Caput longum (long head)': 70, '#Brachialis': 40 },
        'unter|schraegbank': { bizeps: 92, unterarme: 25, '#Caput breve (short head)': 60, '#Caput longum (long head)': 92, '#Brachialis': 35 },
        'hammer|stehend':    { bizeps: 70, unterarme: 60, '#Caput breve (short head)': 40, '#Caput longum (long head)': 55, '#Brachialis': 85 },
        'hammer|schraegbank':{ bizeps: 72, unterarme: 55, '#Caput breve (short head)': 35, '#Caput longum (long head)': 65, '#Brachialis': 85 },
        'ober|stehend':      { unterarme: 85, bizeps: 45, '#Caput breve (short head)': 25, '#Caput longum (long head)': 35, '#Brachialis': 70 },
        'ober|schraegbank':  { unterarme: 80, bizeps: 48, '#Caput breve (short head)': 25, '#Caput longum (long head)': 40, '#Brachialis': 70 }
      },
      erklaerung: {
        'unter|stehend':     'The classic curl: the full biceps, both heads working hard.',
        'unter|schraegbank': 'Arms hanging behind the body stretch the long head — its strongest stimulus.',
        'hammer|stehend':    'The neutral grip shifts work to brachialis and forearms — for thicker arms.',
        'hammer|schraegbank':'Hammer curls under stretch: brachialis plus the long head.',
        'ober|stehend':      'Overhand (reverse curls): forearms and brachialis take over, the biceps just assist.',
        'ober|schraegbank':  'A rare variation — forearm focus with an extra stretch component.'
      }
    }
  },
  {
    id: 'lh-curls', name: 'Barbell Curl', nameDe: 'Langhantelcurls',
    kategorie: 'frei', geraet: 'Barbell', komplex: false,
    primaer: ['bizeps'], sekundaer: ['unterarme'],
    beschreibung: 'Curls with a straight or EZ bar — allows the most weight; elbows stay pinned to your sides.'
  },
  {
    id: 'hammercurls', name: 'Hammer Curl', nameDe: 'Hammercurls',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['bizeps'], sekundaer: ['unterarme'],
    beschreibung: 'Curls with a neutral grip (thumbs up) — emphasizes brachialis and forearms, adding visual arm thickness.'
  },
  {
    id: 'schraegbankcurls', name: 'Incline Dumbbell Curl', nameDe: 'Schrägbankcurls',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['bizeps'], sekundaer: ['unterarme'],
    beschreibung: 'On an incline bench the arms hang behind the body — maximum stretch for the long head of the biceps.'
  },
  {
    id: 'scottcurls', name: 'Preacher Curl', nameDe: 'Scottcurls',
    kategorie: 'frei', geraet: 'EZ bar', komplex: false,
    primaer: ['bizeps'], sekundaer: ['unterarme'],
    beschreibung: 'Curls with the upper arms braced on the preacher pad — zero momentum and a strong stimulus in the stretched position.'
  },
  {
    id: 'kabelcurls', name: 'Cable Curl', nameDe: 'Bizepscurls am Kabel',
    kategorie: 'gefuehrt', geraet: 'Cable', komplex: false,
    primaer: ['bizeps'], sekundaer: ['unterarme'],
    beschreibung: 'Curls on the low pulley — constant tension over the entire range, ideal as a finisher.'
  },
  {
    id: 'curlmaschine', name: 'Machine Curl', nameDe: 'Bizepsmaschine',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['bizeps'], sekundaer: [],
    beschreibung: 'Guided curls with the arms braced on pads — complete isolation, perfect for clean reps to failure.'
  },
  {
    id: 'zottman-curls', name: 'Zottman Curl', nameDe: 'Zottman-Curls',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['bizeps', 'unterarme'], sekundaer: [],
    beschreibung: 'Curl up with an underhand grip, rotate to overhand at the top and lower slowly — biceps on the way up, forearms on the way down.'
  },

  {
    id: 'konzentrationscurls', name: 'Concentration Curl', nameDe: 'Konzentrationscurls',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['bizeps'], sekundaer: ['unterarme'],
    beschreibung: 'Seated, elbow braced against the inner thigh. The arm cannot move, so nothing helps the biceps — the classic peak-contraction exercise.'
  },
  {
    id: 'spider-curls', name: 'Spider Curl', nameDe: 'Spider Curls',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['bizeps'], sekundaer: [],
    beschreibung: 'Chest against a steep incline bench, arms hanging straight down. The shoulder is out of the movement entirely and the tension peaks at the top.'
  },

  /* ================= TRICEPS ================= */
  {
    id: 'trizepsdruecken-kabel', name: 'Triceps Pushdown', nameDe: 'Trizepsdrücken am Kabel',
    kategorie: 'gefuehrt', geraet: 'Cable', komplex: false,
    primaer: ['trizeps'], sekundaer: [],
    beschreibung: 'Elbows pinned to your sides, extend the forearms down against the cable. Attachment and arm position shift focus between the three heads.',
    variationen: {
      parameter: [
        { id: 'griff', name: 'Attachment', werte: [
          { id: 'stange', name: 'Straight bar' },
          { id: 'seil', name: 'Rope' }
        ]},
        { id: 'position', name: 'Arm position', werte: [
          { id: 'unten', name: 'Standing, arms down' },
          { id: 'ueberkopf', name: 'Overhead (stretched)' }
        ]}
      ],
      beanspruchung: {
        'stange|unten':    { trizeps: 85, '#Caput laterale (lateral head)': 80, '#Caput mediale (medial head)': 70, '#Caput longum (long head)': 50 },
        'seil|unten':      { trizeps: 88, '#Caput laterale (lateral head)': 85, '#Caput mediale (medial head)': 75, '#Caput longum (long head)': 55 },
        'stange|ueberkopf':{ trizeps: 86, '#Caput longum (long head)': 90, '#Caput laterale (lateral head)': 55, '#Caput mediale (medial head)': 60 },
        'seil|ueberkopf':  { trizeps: 90, '#Caput longum (long head)': 92, '#Caput laterale (lateral head)': 60, '#Caput mediale (medial head)': 60 }
      },
      erklaerung: {
        'stange|unten':    'Standard pushdown: the lateral head dominates — the visible “horseshoe” part.',
        'seil|unten':      'Spreading the rope at the bottom gives the strongest peak contraction.',
        'stange|ueberkopf':'Overhead, the long head is stretched and takes over the main work.',
        'seil|ueberkopf':  'Overhead rope extensions: the best stimulus for the long head — the bulk of the triceps.'
      }
    }
  },
  {
    id: 'enges-bankdruecken', name: 'Close-Grip Bench Press', nameDe: 'Enges Bankdrücken',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['trizeps'], sekundaer: ['brust-mitte', 'schulter-vorne'],
    beschreibung: 'Bench press with a shoulder-width grip and tucked elbows — the heaviest triceps builder there is.'
  },
  {
    id: 'dips-trizeps', name: 'Triceps Dips', nameDe: 'Dips (aufrecht)',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: true,
    primaer: ['trizeps'], sekundaer: ['brust-unten', 'schulter-vorne'],
    beschreibung: 'Dips with an upright torso and tucked elbows — the more upright you stay, the more triceps instead of chest.'
  },
  {
    id: 'french-press', name: 'Skull Crusher', nameDe: 'French Press',
    kategorie: 'frei', geraet: 'EZ bar', komplex: false,
    primaer: ['trizeps'], sekundaer: [],
    beschreibung: 'Lying down, lower the bar toward your forehead by bending only at the elbows, then extend — upper arms stay vertical.'
  },
  {
    id: 'ueberkopf-trizeps-kh', name: 'Overhead Triceps Extension', nameDe: 'Überkopf-Trizepsstrecken',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['trizeps'], sekundaer: [],
    beschreibung: 'Hold one dumbbell with both hands, lower it behind your head and extend — stretches and hits the long head in particular.'
  },
  {
    id: 'kickbacks', name: 'Triceps Kickback', nameDe: 'Kickbacks',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['trizeps'], sekundaer: ['schulter-hinten'],
    beschreibung: 'Bent over with the upper arm parallel to the floor, extend the forearm straight back — light weight, maximum peak contraction.'
  },
  {
    id: 'dip-maschine', name: 'Machine Dip', nameDe: 'Dip-Maschine',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: true,
    primaer: ['trizeps'], sekundaer: ['brust-unten', 'schulter-vorne'],
    beschreibung: 'A guided dip movement from a seated position with selectable weight — the safely dosed alternative to free dips.'
  },
  {
    id: 'liegestuetze-eng', name: 'Diamond Push-up', nameDe: 'Enge Liegestütze',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: true,
    primaer: ['trizeps'], sekundaer: ['brust-mitte', 'schulter-vorne', 'bauch'],
    beschreibung: 'Push-ups with hands close together (thumbs and index fingers forming a diamond) — the no-equipment triceps variation.'
  },

  {
    id: 'bankdips-bank', name: 'Bench Dip', nameDe: 'Bankdips',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: true,
    primaer: ['trizeps'], sekundaer: ['schulter-vorne', 'brust-unten'],
    beschreibung: 'Hands behind you on a bench, legs out front, lower and press back up. Easy to load by putting a plate on your lap — but hard on the shoulders if you go too deep.'
  },
  {
    id: 'ueberkopf-trizeps-seil', name: 'Overhead Rope Extension', nameDe: 'Überkopf-Trizepsdrücken am Seil',
    kategorie: 'gefuehrt', geraet: 'Cable', komplex: false,
    primaer: ['trizeps'], sekundaer: [],
    beschreibung: 'Facing away from a low pulley, rope behind your head, extend your arms forward and up. The overhead position stretches the long head under load.'
  },

  /* ================= FOREARMS ================= */
  {
    id: 'handgelenkcurls', name: 'Wrist Curl', nameDe: 'Handgelenkcurls',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['unterarme'], sekundaer: [],
    beschreibung: 'Forearms resting on a bench, curl only at the wrists — underhand for the flexor side, overhand for the extensor side.'
  },
  {
    id: 'reverse-curls', name: 'Reverse Curl', nameDe: 'Reverse Curls',
    kategorie: 'frei', geraet: 'Barbell', komplex: false,
    primaer: ['unterarme'], sekundaer: ['bizeps'],
    beschreibung: 'Curls with an overhand grip — strengthens the wrist extensors and brachialis, great for balanced forearms.'
  },
  {
    id: 'farmers-walk', name: 'Farmer’s Carry', nameDe: 'Farmers Walk',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: true,
    primaer: ['unterarme'], sekundaer: ['nacken', 'bauch', 'bauch-seitlich', 'quadrizeps', 'waden'],
    beschreibung: 'Carry heavy dumbbells while walking tall — grip strength, traps and core in one single exercise.'
  },
  {
    id: 'unterarm-roller', name: 'Wrist Roller', nameDe: 'Unterarm-Roller',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: false,
    primaer: ['unterarme'], sekundaer: ['schulter-vorne'],
    beschreibung: 'Roll a weight hanging from a cord up and down with outstretched arms — the burn is guaranteed.'
  },

  /* ================= CORE ================= */
  {
    id: 'crunches', name: 'Crunch', nameDe: 'Crunches',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: false,
    primaer: ['bauch'], sekundaer: [],
    beschreibung: 'On your back with knees bent: curl the shoulder blades up and in, lower back stays down — a small, controlled movement.'
  },
  {
    id: 'beinheben-haengend', name: 'Hanging Leg Raise', nameDe: 'Hängendes Beinheben',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: true,
    primaer: ['bauch'], sekundaer: ['bauch-seitlich', 'unterarme', 'lat'],
    beschreibung: 'Hanging from the bar, raise your legs (or knees) and curl the pelvis up — the toughest ab exercise, hitting the lower region hard.'
  },
  {
    id: 'beinheben-liegend', name: 'Lying Leg Raise', nameDe: 'Liegendes Beinheben',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: false,
    primaer: ['bauch'], sekundaer: [],
    beschreibung: 'On your back, raise straight legs and lower them slowly without arching the lower back — emphasizes the lower abs.'
  },
  {
    id: 'beinheben-captains-chair', name: 'Captain’s Chair Leg Raise', nameDe: 'Beinheben am Gerät',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['bauch'], sekundaer: ['bauch-seitlich'],
    beschreibung: 'Leg raises with your forearms braced on the captain’s chair — ab training without grip strength as the limit.'
  },
  {
    id: 'planke', name: 'Plank', nameDe: 'Unterarmstütz',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: false,
    primaer: ['bauch'], sekundaer: ['bauch-seitlich', 'ruecken-unten', 'gesaess'],
    beschreibung: 'On forearms and toes, hold your body as one straight line with abs and glutes tight — the fundamental static core exercise.'
  },
  {
    id: 'seitstuetz', name: 'Side Plank', nameDe: 'Seitstütz',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: false,
    primaer: ['bauch-seitlich'], sekundaer: ['bauch', 'gesaess'],
    beschreibung: 'Braced on one forearm, keep the hips high — strengthens the lateral core chain.'
  },
  {
    id: 'russian-twist', name: 'Russian Twist', nameDe: 'Russian Twist',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: false,
    primaer: ['bauch-seitlich'], sekundaer: ['bauch'],
    beschreibung: 'Seated, lean back slightly and rotate the torso (with or without weight) from side to side under control.'
  },
  {
    id: 'kabel-crunch', name: 'Cable Crunch', nameDe: 'Kabel-Crunches',
    kategorie: 'gefuehrt', geraet: 'Cable', komplex: false,
    primaer: ['bauch'], sekundaer: [],
    beschreibung: 'Kneeling, hold the rope behind your head and crunch the torso down — ab training with progressive loading.'
  },
  {
    id: 'bauchmaschine', name: 'Ab Crunch Machine', nameDe: 'Bauchmaschine',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['bauch'], sekundaer: [],
    beschreibung: 'A guided crunch against resistance — easy to dose and to progress.'
  },
  {
    id: 'holzhacker-kabel', name: 'Cable Woodchopper', nameDe: 'Holzfäller am Kabel',
    kategorie: 'gefuehrt', geraet: 'Cable', komplex: true,
    primaer: ['bauch-seitlich'], sekundaer: ['bauch', 'schulter-vorne'],
    beschreibung: 'Pull the handle diagonally across your body (high-to-low or low-to-high) with straight arms — rotational power for the core.'
  },
  {
    id: 'ab-rollout', name: 'Ab Wheel Rollout', nameDe: 'Ab-Wheel Rollout',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: true,
    primaer: ['bauch'], sekundaer: ['bauch-seitlich', 'lat', 'schulter-vorne', 'ruecken-unten'],
    beschreibung: 'Roll the wheel slowly forward as far as your core tension holds, then pull back — brutally effective, progress slowly.'
  },
  {
    id: 'bergsteiger', name: 'Mountain Climbers', nameDe: 'Bergsteiger',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: true,
    primaer: ['bauch'], sekundaer: ['bauch-seitlich', 'schulter-vorne', 'quadrizeps'],
    beschreibung: 'From a push-up position, drive the knees to the chest in quick alternation — core work and cardio in one.'
  },

  {
    id: 'pallof-press', name: 'Pallof Press', nameDe: 'Pallof Press',
    kategorie: 'gefuehrt', geraet: 'Cable', komplex: false,
    primaer: ['bauch-seitlich'], sekundaer: ['bauch', 'gesaess'],
    beschreibung: 'Stand side-on to a cable and press the handle straight out from your chest. The cable wants to rotate you — the obliques work by refusing to let it.'
  },
  {
    id: 'fahrrad-crunch', name: 'Bicycle Crunch', nameDe: 'Fahrrad-Crunch',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: false,
    primaer: ['bauch-seitlich', 'bauch'], sekundaer: [],
    beschreibung: 'Alternate elbow to opposite knee while the other leg extends. Slow beats fast here — the rotation is what trains the obliques.'
  },
  {
    id: 'seitbeugen-kh', name: 'Dumbbell Side Bend', nameDe: 'Seitbeugen mit Kurzhantel',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: false,
    primaer: ['bauch-seitlich'], sekundaer: ['ruecken-unten'],
    beschreibung: 'One dumbbell in one hand, bend sideways and come back up under control. Keep the load moderate — heavy side bends thicken the waist more than they define it.'
  },

  /* ================= GLUTES ================= */
  {
    id: 'hip-thrust', name: 'Barbell Hip Thrust', nameDe: 'Hip Thrust',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['gesaess'], sekundaer: ['beinbeuger', 'quadrizeps', 'ruecken-unten'],
    beschreibung: 'Upper back on a bench, bar across the hips: drive the pelvis up powerfully and squeeze hard at the top — the most effective glute builder.'
  },
  {
    id: 'glute-bridge', name: 'Glute Bridge', nameDe: 'Beckenheben',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: false,
    primaer: ['gesaess'], sekundaer: ['beinbeuger', 'ruecken-unten'],
    beschreibung: 'On your back with feet planted, lift the pelvis until knees–hips–shoulders form a line, squeezing the glutes at the top.'
  },
  {
    id: 'kickbacks-kabel-gesaess', name: 'Cable Glute Kickback', nameDe: 'Kickbacks am Kabel',
    kategorie: 'gefuehrt', geraet: 'Cable', komplex: false,
    primaer: ['gesaess'], sekundaer: ['beinbeuger'],
    beschreibung: 'With an ankle strap, sweep the straight leg back and up under control — isolates each glute one side at a time.'
  },
  {
    id: 'abduktoren-maschine', name: 'Hip Abduction Machine', nameDe: 'Abduktoren-Maschine',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['gesaess'], sekundaer: [],
    beschreibung: 'Seated, press the legs apart against resistance — trains the gluteus medius, your hip stabilizer.'
  },
  {
    id: 'ausfallschritte', name: 'Lunges', nameDe: 'Ausfallschritte',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: true,
    primaer: ['quadrizeps', 'gesaess'], sekundaer: ['beinbeuger', 'adduktoren', 'waden'],
    beschreibung: 'Big step forward, lower the back knee toward the floor, push back up — longer steps hit more glutes, shorter steps more quads.',
    variationen: {
      parameter: [
        { id: 'richtung', name: 'Direction', werte: [
          { id: 'vorwaerts', name: 'Forward' },
          { id: 'rueckwaerts', name: 'Reverse' },
          { id: 'gehend', name: 'Walking' }
        ]},
        { id: 'schritt', name: 'Step length', werte: [
          { id: 'kurz', name: 'Short' },
          { id: 'lang', name: 'Long' }
        ]}
      ],
      beanspruchung: {
        'vorwaerts|kurz':   { quadrizeps: 90, gesaess: 45, waden: 25 },
        'vorwaerts|lang':   { quadrizeps: 70, gesaess: 70, beinbeuger: 40 },
        'rueckwaerts|kurz': { quadrizeps: 78, gesaess: 60, beinbeuger: 30 },
        'rueckwaerts|lang': { quadrizeps: 58, gesaess: 82, beinbeuger: 50 },
        'gehend|kurz':      { quadrizeps: 82, gesaess: 55, waden: 30, bauch: 25 },
        'gehend|lang':      { quadrizeps: 65, gesaess: 78, beinbeuger: 45, bauch: 28 }
      },
      erklaerung: {
        'vorwaerts|kurz':   'Short step, upright torso: the front knee travels far forward — the most quad-dominant lunge.',
        'vorwaerts|lang':   'The long step turns it into a hip movement: glutes and hamstrings take over.',
        'rueckwaerts|kurz': 'Stepping back is gentler on the knee than stepping forward, at similar quad involvement.',
        'rueckwaerts|lang': 'The most glute-heavy variant — and the friendliest one for cranky knees.',
        'gehend|kurz':      'Walking adds a balance demand: the core stabilises every step.',
        'gehend|lang':      'Long walking lunges: glute-dominant with a constant balance challenge — tiring in a good way.'
      }
    }
  },
  {
    id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', nameDe: 'Bulgarische Kniebeuge',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: true,
    primaer: ['quadrizeps', 'gesaess'], sekundaer: ['beinbeuger', 'adduktoren'],
    beschreibung: 'A single-leg squat with the rear foot elevated — brutally effective for legs and glutes, and it evens out side-to-side gaps.'
  },
  {
    id: 'step-ups', name: 'Step-Up', nameDe: 'Step-Ups',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: true,
    primaer: ['quadrizeps', 'gesaess'], sekundaer: ['beinbeuger', 'waden'],
    beschreibung: 'Step onto a knee-high platform and step down under control — the higher the box, the more glute involvement.'
  },

  {
    id: 'kettlebell-swing', name: 'Kettlebell Swing', nameDe: 'Kettlebell-Swing',
    kategorie: 'frei', geraet: 'Kettlebell', komplex: true,
    primaer: ['gesaess', 'beinbeuger'], sekundaer: ['ruecken-unten', 'bauch'],
    beschreibung: 'A hip hinge, not a squat: snap the hips forward and let the bell float to chest height. Power comes from the glutes, never from the arms.'
  },

  /* ================= THIGHS ================= */
  {
    id: 'kniebeuge', name: 'Barbell Squat', nameDe: 'Kniebeugen',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['quadrizeps', 'gesaess'], sekundaer: ['beinbeuger', 'adduktoren', 'ruecken-unten', 'bauch'],
    beschreibung: 'Bar on the upper back, sit the hips back and down with knees tracking the toes and a flat back — the fundamental lower-body lift.',
    variationen: {
      parameter: [
        { id: 'stand', name: 'Stance width', werte: [
          { id: 'schulter', name: 'Shoulder-width' },
          { id: 'breit', name: 'Wide (sumo)' }
        ]},
        { id: 'tiefe', name: 'Depth', werte: [
          { id: 'parallel', name: 'To parallel' },
          { id: 'tief', name: 'Deep (below parallel)' }
        ]}
      ],
      beanspruchung: {
        'schulter|parallel': { quadrizeps: 85, gesaess: 60, adduktoren: 30, 'ruecken-unten': 30, beinbeuger: 25, bauch: 25 },
        'schulter|tief':     { quadrizeps: 90, gesaess: 82, adduktoren: 42, beinbeuger: 30, 'ruecken-unten': 35, bauch: 28 },
        'breit|parallel':    { gesaess: 72, adduktoren: 68, quadrizeps: 70, beinbeuger: 30, 'ruecken-unten': 30, bauch: 25 },
        'breit|tief':        { gesaess: 90, adduktoren: 82, quadrizeps: 75, beinbeuger: 35, 'ruecken-unten': 35, bauch: 28 }
      },
      erklaerung: {
        'schulter|parallel': 'The standard squat: quads lead, glutes contribute strongly.',
        'schulter|tief':     'Full depth activates the glutes far more — mobility permitting.',
        'breit|parallel':    'A wide stance brings adductors and glutes into play much more.',
        'breit|tief':        'The deep sumo squat: maximum glute and adductor work.'
      }
    }
  },
  {
    id: 'frontkniebeuge', name: 'Front Squat', nameDe: 'Frontkniebeugen',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['quadrizeps'], sekundaer: ['gesaess', 'bauch', 'ruecken-oben'],
    beschreibung: 'Bar racked on the front of the shoulders — the more upright torso shifts the work strongly onto the quads.'
  },
  {
    id: 'goblet-kniebeuge', name: 'Goblet Squat', nameDe: 'Goblet Squat',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: true,
    primaer: ['quadrizeps', 'gesaess'], sekundaer: ['adduktoren', 'bauch'],
    beschreibung: 'A squat holding one dumbbell at your chest — the best variation for learning solid squat technique.'
  },
  {
    id: 'beinpresse', name: 'Leg Press', nameDe: 'Beinpresse',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: true,
    primaer: ['quadrizeps', 'gesaess'], sekundaer: ['beinbeuger', 'adduktoren'],
    beschreibung: 'Lower the sled under control and press away, lower back staying on the pad. Feet low = more quads, feet high = more glutes/hamstrings.',
    variationen: {
      parameter: [
        { id: 'fuss', name: 'Foot position', werte: [
          { id: 'tief', name: 'Low on the plate' },
          { id: 'mitte', name: 'Middle' },
          { id: 'hoch', name: 'High on the plate' }
        ]},
        { id: 'stand', name: 'Stance', werte: [
          { id: 'eng', name: 'Narrow' },
          { id: 'breit', name: 'Wide' }
        ]}
      ],
      beanspruchung: {
        'tief|eng':   { quadrizeps: 92, gesaess: 35, waden: 22 },
        'tief|breit': { quadrizeps: 85, gesaess: 45, adduktoren: 40 },
        'mitte|eng':  { quadrizeps: 85, gesaess: 50, beinbeuger: 25 },
        'mitte|breit':{ quadrizeps: 75, gesaess: 60, adduktoren: 45, beinbeuger: 30 },
        'hoch|eng':   { quadrizeps: 65, gesaess: 70, beinbeuger: 45 },
        'hoch|breit': { quadrizeps: 55, gesaess: 80, beinbeuger: 50, adduktoren: 45 }
      },
      erklaerung: {
        'tief|eng':   'Feet low and close: the knee bends the most — the strongest quad emphasis on this machine.',
        'tief|breit': 'Still quad-led, but the wide stance pulls the inner thighs into the work.',
        'mitte|eng':  'The neutral default: quads lead, glutes assist, joints stay in a comfortable range.',
        'mitte|breit':'Balanced across the whole leg — a good all-round setting.',
        'hoch|eng':   'Feet high means more hip and less knee: glutes and hamstrings take over.',
        'hoch|breit': 'The most posterior-chain version — watch that your lower back stays flat on the pad.'
      }
    }
  },
  {
    id: 'hackenschmidt', name: 'Hack Squat', nameDe: 'Hackenschmidt-Kniebeuge',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: true,
    primaer: ['quadrizeps'], sekundaer: ['gesaess', 'adduktoren'],
    beschreibung: 'A guided squat in the sled with back support — quad focus without any balance demands.'
  },
  {
    id: 'beinstrecker', name: 'Leg Extension', nameDe: 'Beinstrecker',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['quadrizeps'], sekundaer: [],
    beschreibung: 'Seated, extend the lower legs against the pad — complete quad isolation.'
  },
  {
    id: 'beinbeuger-liegend', name: 'Lying Leg Curl', nameDe: 'Beinbeuger liegend',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['beinbeuger'], sekundaer: ['waden'],
    beschreibung: 'Face down, curl your heels toward the glutes — isolates the hamstrings.'
  },
  {
    id: 'beinbeuger-sitzend', name: 'Seated Leg Curl', nameDe: 'Beinbeuger sitzend',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['beinbeuger'], sekundaer: ['waden'],
    beschreibung: 'The seated curl variation starts from a stretched position — many people feel the hamstrings much better here than lying down.'
  },
  {
    id: 'rumaenisches-kreuzheben', name: 'Romanian Deadlift', nameDe: 'Rumänisches Kreuzheben',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['beinbeuger', 'gesaess'], sekundaer: ['ruecken-unten', 'unterarme', 'nacken'],
    beschreibung: 'From standing, push the hips back and lower the bar close along your legs to mid-shin, knees almost straight — deep stretch tension in the hamstrings.'
  },
  {
    id: 'sumo-kreuzheben', name: 'Sumo Deadlift', nameDe: 'Sumo-Kreuzheben',
    kategorie: 'frei', geraet: 'Barbell', komplex: true,
    primaer: ['gesaess', 'adduktoren', 'quadrizeps'], sekundaer: ['beinbeuger', 'ruecken-unten', 'unterarme'],
    beschreibung: 'Deadlifting from a wide stance with the grip inside the legs — a more upright back, more adductors and glutes.'
  },
  {
    id: 'adduktoren-maschine', name: 'Hip Adduction Machine', nameDe: 'Adduktoren-Maschine',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['adduktoren'], sekundaer: [],
    beschreibung: 'Seated, press the legs together against resistance — isolates the inner thighs.'
  },
  {
    id: 'wandsitzen', name: 'Wall Sit', nameDe: 'Wandsitzen',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: false,
    primaer: ['quadrizeps'], sekundaer: ['gesaess'],
    beschreibung: 'Hold a 90° seat against the wall — a static quad burner you can do anywhere.'
  },

  {
    id: 'nordic-curls', name: 'Nordic Hamstring Curl', nameDe: 'Nordic Curls',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: false,
    primaer: ['beinbeuger'], sekundaer: ['gesaess'],
    beschreibung: 'Kneel with your ankles anchored and lower your straight body forward as slowly as you can. Brutally hard — and one of the best-studied ways to protect the hamstrings.'
  },
  {
    id: 'kreuzheben-einbeinig', name: 'Single-Leg Romanian Deadlift', nameDe: 'Einbeiniges Kreuzheben',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: true,
    primaer: ['beinbeuger', 'gesaess'], sekundaer: ['ruecken-unten', 'bauch'],
    beschreibung: 'Hinge over one leg while the other extends behind you. Balance forces the glute to stabilise as well as extend — great against left/right imbalances.'
  },
  {
    id: 'beinbeuger-stehend', name: 'Standing Leg Curl', nameDe: 'Beinbeuger stehend',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['beinbeuger'], sekundaer: ['waden'],
    beschreibung: 'One leg at a time against the pad. With the hip extended the emphasis differs from the seated version — worth having both in the plan.'
  },
  {
    id: 'kossacken-kniebeuge', name: 'Cossack Squat', nameDe: 'Kosakenkniebeuge',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: true,
    primaer: ['adduktoren', 'quadrizeps'], sekundaer: ['gesaess', 'beinbeuger'],
    beschreibung: 'Wide stance, sink onto one leg while the other stays straight. Loads the inner thigh through a deep stretch and opens the hips.'
  },
  {
    id: 'seitausfallschritt', name: 'Lateral Lunge', nameDe: 'Seitlicher Ausfallschritt',
    kategorie: 'frei', geraet: 'Dumbbell', komplex: true,
    primaer: ['adduktoren', 'gesaess'], sekundaer: ['quadrizeps'],
    beschreibung: 'Step out to the side and sit back into that hip while the trailing leg stays straight. Trains the frontal plane that squats and lunges leave out.'
  },

  /* ================= CALVES ================= */
  {
    id: 'wadenheben-maschine', name: 'Calf Raise', nameDe: 'Wadenheben',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['waden'], sekundaer: [],
    beschreibung: 'Press up as high as possible onto the balls of your feet, pause at the top, stretch deep at the bottom — full range beats heavy weight.',
    variationen: {
      parameter: [
        { id: 'position', name: 'Position', werte: [
          { id: 'stehend', name: 'Standing (knee straight)' },
          { id: 'sitzend', name: 'Seated (knee bent)' }
        ]},
        { id: 'fuss', name: 'Foot angle', werte: [
          { id: 'innen', name: 'Toes in' },
          { id: 'neutral', name: 'Parallel' },
          { id: 'aussen', name: 'Toes out' }
        ]}
      ],
      beanspruchung: {
        'stehend|neutral': { waden: 90, '#Gastrocnemius': 90, '#Soleus': 45 },
        'stehend|innen':   { waden: 88, '#Gastrocnemius': 88, '#Soleus': 45, '#Caput laterale (outer calf)': 75, '#Caput mediale (inner calf)': 55 },
        'stehend|aussen':  { waden: 88, '#Gastrocnemius': 88, '#Soleus': 45, '#Caput mediale (inner calf)': 75, '#Caput laterale (outer calf)': 55 },
        'sitzend|neutral': { waden: 75, '#Soleus': 90, '#Gastrocnemius': 30 },
        'sitzend|innen':   { waden: 72, '#Soleus': 88, '#Gastrocnemius': 28 },
        'sitzend|aussen':  { waden: 72, '#Soleus': 88, '#Gastrocnemius': 28 }
      },
      erklaerung: {
        'stehend|neutral': 'Straight knee: the visible gastrocnemius works at full capacity.',
        'stehend|innen':   'Toes in slightly emphasizes the outer calf head (the effect is small).',
        'stehend|aussen':  'Toes out slightly emphasizes the inner calf head (the effect is small).',
        'sitzend|neutral': 'A bent knee switches the gastrocnemius off — the deep soleus takes over.',
        'sitzend|innen':   'Seated, it’s mostly about the soleus; foot angle changes little.',
        'sitzend|aussen':  'Seated, it’s mostly about the soleus; foot angle changes little.'
      }
    }
  },
  {
    id: 'wadenheben-sitzend', name: 'Seated Calf Raise', nameDe: 'Wadenheben sitzend',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['waden'], sekundaer: [],
    beschreibung: 'Raise against the pad with bent knees — targets the deep soleus muscle specifically.'
  },
  {
    id: 'wadenheben-einbeinig', name: 'Single-Leg Calf Raise', nameDe: 'Einbeiniges Wadenheben',
    kategorie: 'frei', geraet: 'Bodyweight', komplex: false,
    primaer: ['waden'], sekundaer: [],
    beschreibung: 'One-legged on a step: drop the heel deep and press up high — add a dumbbell in one hand to progress.'
  },
  {
    id: 'wadenheben-beinpresse', name: 'Leg Press Calf Raise', nameDe: 'Wadendrücken an der Beinpresse',
    kategorie: 'gefuehrt', geraet: 'Machine', komplex: false,
    primaer: ['waden'], sekundaer: [],
    beschreibung: 'Balls of the feet on the bottom edge of the leg-press plate, press with the calves only — heavy loading, easy on the back.'
  }
];

/* Index and helpers */
const UEBUNGEN_INDEX = {};
UEBUNGEN.forEach(u => { UEBUNGEN_INDEX[u.id] = u; });

function uebungVonId(id) { return UEBUNGEN_INDEX[id] || null; }

/* Exercises for a selection; regionen = active region IDs.
   Returns { direkt: [...], mitwirkend: [...] } (primary vs. secondary only). */
function uebungenFuerRegionen(regionen) {
  const direkt = [], mitwirkend = [];
  UEBUNGEN.forEach(u => {
    if (u.primaer.some(r => regionen.includes(r))) direkt.push(u);
    else if (u.sekundaer.some(r => regionen.includes(r))) mitwirkend.push(u);
  });
  return { direkt, mitwirkend };
}
