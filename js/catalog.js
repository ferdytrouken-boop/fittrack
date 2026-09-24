// Catálogos: tipos de actividad, grupos musculares y ejercicios.

export const TYPES = {
  gym:      { label: 'Gimnasio', short: 'Gym',      color: 'var(--c-gym)' },
  running:  { label: 'Running',  short: 'Running',  color: 'var(--c-run)' },
  football: { label: 'Fútbol',   short: 'Fútbol',   color: 'var(--c-foot)' },
  spinning: { label: 'Spinning', short: 'Spinning', color: 'var(--c-spin)' },
  other:    { label: 'Otra',     short: 'Otra',     color: 'var(--c-other)' },
};
export const TYPE_ORDER = ['gym', 'running', 'football', 'spinning', 'other'];

export const REGIONS = [
  { id: 'upper', label: 'Tren superior' },
  { id: 'core',  label: 'Core' },
  { id: 'lower', label: 'Tren inferior' },
];

export const MUSCLES = [
  { id: 'pecho',     label: 'Pecho',          region: 'upper', exercises: ['Press banca', 'Press inclinado', 'Press con mancuernas', 'Aperturas', 'Cruce de poleas', 'Fondos', 'Flexiones'] },
  { id: 'espalda',   label: 'Espalda',        region: 'upper', exercises: ['Dominadas', 'Jalón al pecho', 'Remo con barra', 'Remo con mancuerna', 'Remo en polea baja', 'Pullover'] },
  { id: 'hombro',    label: 'Hombro',         region: 'upper', exercises: ['Press militar', 'Press Arnold', 'Elevaciones laterales', 'Elevaciones frontales', 'Pájaros', 'Face pull'] },
  { id: 'biceps',    label: 'Bíceps',         region: 'upper', exercises: ['Curl con barra', 'Curl con mancuernas', 'Curl martillo', 'Curl predicador', 'Curl en polea'] },
  { id: 'triceps',   label: 'Tríceps',        region: 'upper', exercises: ['Press francés', 'Extensión en polea', 'Fondos en banco', 'Patada de tríceps', 'Press cerrado'] },
  { id: 'antebrazo', label: 'Antebrazo',      region: 'upper', exercises: ['Curl de muñeca', 'Curl invertido', 'Paseo del granjero'] },
  { id: 'trapecio',  label: 'Trapecio',       region: 'upper', exercises: ['Encogimientos', 'Remo al mentón'] },
  { id: 'core',      label: 'Abdomen',        region: 'core',  exercises: ['Plancha', 'Crunch', 'Elevación de piernas', 'Rueda abdominal', 'Russian twist', 'Pallof press'] },
  { id: 'lumbar',    label: 'Lumbar',         region: 'core',  exercises: ['Hiperextensiones', 'Superman', 'Buenos días'] },
  { id: 'cuadriceps',label: 'Cuádriceps',     region: 'lower', exercises: ['Sentadilla', 'Prensa', 'Extensión de cuádriceps', 'Zancadas', 'Sentadilla búlgara', 'Hack squat'] },
  { id: 'isquios',   label: 'Isquiotibiales', region: 'lower', exercises: ['Peso muerto rumano', 'Curl femoral tumbado', 'Curl femoral sentado', 'Nordic curl'] },
  { id: 'gluteo',    label: 'Glúteo',         region: 'lower', exercises: ['Hip thrust', 'Puente de glúteo', 'Patada de glúteo', 'Abducción en máquina'] },
  { id: 'gemelo',    label: 'Gemelo',         region: 'lower', exercises: ['Elevación de talones de pie', 'Elevación de talones sentado'] },
  { id: 'aductor',   label: 'Aductores',      region: 'lower', exercises: ['Máquina de aductores', 'Sentadilla sumo', 'Plancha Copenhague'] },
];
export const MUSCLE_BY_ID = Object.fromEntries(MUSCLES.map(m => [m.id, m]));

export const RUN_KINDS = ['Rodaje', 'Series', 'Tirada larga', 'Fartlek', 'Tempo', 'Recuperación', 'Competición'];
export const FOOT_FORMATS = ['Fútbol 7', 'Fútbol 11', 'Fútbol sala', 'Fútbol 5'];
export const RESULTS = ['Victoria', 'Empate', 'Derrota'];
export const STATUS = {
  planned: 'Planificada',
  done: 'Realizada',
  skipped: 'No realizada',
};
