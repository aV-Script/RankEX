// ─── Rank ────────────────────────────────────────────────────────────────
export const RANKS = [
  { min: 95,  label: 'EX',  color: '#ffd700' },
  { min: 90,  label: 'SS+', color: '#ff6b6b' },
  { min: 85,  label: 'SS',  color: '#ff8e53' },
  { min: 80,  label: 'S+',  color: '#ff6fd8' },
  { min: 75,  label: 'S',   color: '#c77dff' },
  { min: 70,  label: 'A+',  color: '#a78bfa' },
  { min: 65,  label: 'A',   color: '#60a5fa' },
  { min: 60,  label: 'B+',  color: '#38bdf8' },
  { min: 55,  label: 'B',   color: '#34d399' },
  { min: 50,  label: 'C+',  color: '#6ee7b7' },
  { min: 45,  label: 'C',   color: '#a3e635' },
  { min: 40,  label: 'D+',  color: '#facc15' },
  { min: 35,  label: 'D',   color: '#fb923c' },
  { min: 30,  label: 'E+',  color: '#f87171' },
  { min: 25,  label: 'E',   color: '#f43f5e' },
  { min: 20,  label: 'F+',  color: '#9ca3af' },
  { min: 0,   label: 'F',   color: '#6b7280' },
];

export function getRankFromMedia(media) {
  return RANKS.find(r => media >= r.min) ?? RANKS[RANKS.length - 1];
}

// ─── Categorie cliente ─────────────────────────────────────────────────────
export const CATEGORIE = [
  { id: 'health', label: 'Health', color: '#34d399', desc: 'Soggetti sedentari o con bassa attività fisica. Focus su mobilità, equilibrio e resistenza di base.' },
  { id: 'active', label: 'Active', color: '#60a5fa', desc: 'Soggetti fisicamente attivi. Test orientati a performance funzionale e forza esplosiva.' },
  { id: 'athlete', label: 'Athlete', color: '#f59e0b', desc: 'Atleti agonisti o con alto livello prestativo. Test di performance avanzati.' },
];

export const getCategoriaById = (id) => CATEGORIE.find(c => c.id === id) ?? CATEGORIE[0];

// ─── Test per categoria ─────────────────────────────────────────────────────
export const CATEGORY_TESTS = {
  health: [
    { key: 'sit_and_reach', stat: 'mobilita', label: 'Mobilità', unit: 'cm', direction: 'direct', test: 'Sit and Reach' },
    { key: 'flamingo_test', stat: 'equilibrio', label: 'Equilibrio', unit: 'cadute', direction: 'inverse', test: 'Flamingo Test' },
    { key: 'ymca_step_test', stat: 'resistenza', label: 'Resistenza', unit: 'bpm', direction: 'inverse', test: 'YMCA Step Test' },
    { key: 'dinamometro_hand_grip', stat: 'forza', label: 'Forza', unit: 'kg', direction: 'direct', test: 'Dinamometro Hand Grip' },
    { key: 'sit_to_stand', stat: 'esplosivita', label: 'Esplosività', unit: 'secondi', direction: 'inverse', test: '5 Sit to Stand' },
  ],
  active: [
    { key: 'y_balance', stat: 'stabilita', label: 'Stabilità', unit: '%', direction: 'direct', test: 'Y Balance Test' ,   variables: [
        { key: 'ANT', label: 'Anterior', unit: 'cm' },
        { key: 'PM', label: 'Postero-mediale', unit: 'cm' },
        { key: 'PL', label: 'Postero-laterale', unit: 'cm' },
        { key: 'lunghezzaArto', label: 'Lunghezza arto', unit: 'cm' },
      ], formula: (vars) => ((vars.ANT + vars.PM + vars.PL) / (3 * vars.lunghezzaArto)) * 100},
    { key: 'dinamometro_hand_grip', stat: 'forza', label: 'Forza', unit: 'kg', direction: 'direct', test: 'Dinamometro Hand Grip' },
    { key: 'ymca_step_test', stat: 'resistenza', label: 'Resistenza', unit: 'bpm', direction: 'inverse', test: 'YMCA Step Test' },
    { key: 'standing_long_jump', stat: 'esplosivita', label: 'Esplosività', unit: 'cm', direction: 'direct', test: 'Standing Long Jump' },
    { key: 'sprint_10m', stat: 'velocita', label: 'Velocità', unit: 'secondi', direction: 'inverse', test: '10m Sprint' },
  ],
  athlete: [
    { key: 'drop_jump_rsi', stat: 'reattivita', label: 'Reattività', unit: 'RSI', direction: 'direct', test: 'Drop Jump RSI' },
    { key: 't_test_agility', stat: 'agilita', label: 'Agilità', unit: 'secondi', direction: 'inverse', test: 'T-Test Agility' },
    { key: 'yo_yo_ir1', stat: 'resistenza', label: 'Resistenza', unit: 'metri', direction: 'direct', test: 'Yo-Yo IR1' },
    { key: 'sprint_20m', stat: 'velocita', label: 'Velocità', unit: 'secondi', direction: 'inverse', test: 'Sprint 20m' },
    { key: 'cmj', stat: 'esplosivita', label: 'Esplosività', unit: 'cm', direction: 'direct', test: 'CMJ Avanzato' },
  ],
}

// Helper: ritorna i test della categoria del cliente
export function getTestsForCategoria(categoriaId) {
  return CATEGORY_TESTS[categoriaId] ?? CATEGORY_TESTS.health;
}

// STAT_KEYS dinamici in base alla categoria
export function getStatKeysForCategoria(categoriaId) {
  return getTestsForCategoria(categoriaId).map(t => t.stat);
}

export function getStatsConfig(categoria = 'health') {
  return CATEGORY_TESTS[categoria] || CATEGORY_TESTS.health
}

export function getStatKeys(categoria = 'health') {
  return getStatsConfig(categoria).map(s => s.stat)
}
// ─── Defaults nuovo cliente ─────────────────────────────────────────────────
export const NEW_CLIENT_DEFAULTS = {
  level: 1,
  rank: 'F',
  rankColor: '#6b7280',
  xp: 0,
  xpNext: 700,
  stats: {},
  log: [],
  campionamenti: [],
  sessionsPerWeek: 3,
};

export const XP_PER_LEVEL_MULTIPLIER = 1.3;
export const LOG_MAX_ENTRIES = 20;
export const LEVEL_PER_RANK = 4;