import { TESTS }          from './tests.js'
import { applyFormula }   from './formulas.js'

// ── Test ──────────────────────────────────────────────────────────────────────
export const ALL_TESTS = TESTS

export function getTestsForCategoria(categoriaId) {
  return ALL_TESTS.filter(t => t.categories.includes(categoriaId))
}

export function getStatKeysForCategoria(categoriaId) {
  return getTestsForCategoria(categoriaId).map(t => t.stat)
}

export function getStatsConfig(categoria = 'health') {
  return getTestsForCategoria(categoria)
}

export { applyFormula }

// ── Rank ──────────────────────────────────────────────────────────────────────
export const RANKS = [
  { min: 95, label: 'EX',  color: '#ffd700' },  // oro
  { min: 90, label: 'SS+', color: '#ff4560' },  // rosso vivo
  { min: 85, label: 'SS',  color: '#ff7043' },  // arancio caldo
  { min: 80, label: 'S+',  color: '#1aff6e' },  // verde brillante RankEX
  { min: 75, label: 'S',   color: '#0fd65a' },  // verde logo RankEX
  { min: 70, label: 'A+',  color: '#00c8ff' },  // ciano logo RankEX
  { min: 65, label: 'A',   color: '#4db8ff' },  // ciano chiaro
  { min: 60, label: 'B+',  color: '#38bdf8' },  // azzurro
  { min: 55, label: 'B',   color: '#0066cc' },  // blu RankEX
  { min: 50, label: 'C+',  color: '#a3e635' },  // lime
  { min: 45, label: 'C',   color: '#facc15' },  // giallo
  { min: 40, label: 'D+',  color: '#fb923c' },  // arancio
  { min: 35, label: 'D',   color: '#f97316' },  // arancio scuro
  { min: 30, label: 'E+',  color: '#f87171' },  // rosso chiaro
  { min: 25, label: 'E',   color: '#ef4444' },  // rosso
  { min: 20, label: 'F+',  color: '#8a9bb0' },  // metallo chiaro
  { min: 0,  label: 'F',   color: '#4a5568' },  // metallo scuro
]

export function getRankFromMedia(media) {
  return RANKS.find(r => media >= r.min) ?? RANKS[RANKS.length - 1]
}

// ── Categorie ─────────────────────────────────────────────────────────────────
export const CATEGORIE = [
  {
    id:    'health',
    label: 'Health',
    color: '#34d399',
    desc:  'Soggetti sedentari o con bassa attività fisica. Focus su mobilità, equilibrio e resistenza di base.',
  },
  {
    id:    'active',
    label: 'Active',
    color: '#00c8ff',
    desc:  'Soggetti fisicamente attivi. Test orientati a performance funzionale e forza esplosiva.',
  },
  {
    id:    'athlete',
    label: 'Athlete',
    color: '#f59e0b',
    desc:  'Atleti agonisti o con alto livello prestativo. Test di performance avanzati.',
  },
]

export function getCategoriaById(id) {
  return CATEGORIE.find(c => c.id === id) ?? CATEGORIE[0]
}

// ── Defaults nuovo cliente ────────────────────────────────────────────────────
export const NEW_CLIENT_DEFAULTS = {
  level:           1,
  rank:            'F',
  rankColor:       '#6b7280',
  xp:              0,
  xpNext:          700,
  stats:           {},
  log:             [],
  campionamenti:   [],
  sessionsPerWeek: 3,
}

// ── Costanti gamification ─────────────────────────────────────────────────────
export const LOG_MAX_ENTRIES         = 20
export const XP_PER_LEVEL_MULTIPLIER = 1.3