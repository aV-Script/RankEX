// ─── Rank basato sulla media delle 5 statistiche ──────────────────────────────
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
]

export function getRankFromMedia(media) {
  return RANKS.find(r => media >= r.min) ?? RANKS[RANKS.length - 1]
}

export const STATS = [
  { key: 'forza',       icon: '⚡', label: 'Forza',       unit: 'kg',      test: 'Dinamometro Hand Grip',  desc: 'Misura la forza massima di presa della mano dominante.' },
  { key: 'mobilita',    icon: '🤸', label: 'Mobilità',    unit: 'cm',      test: 'Sit and Reach',          desc: 'Misura la flessibilità della catena posteriore.' },
  { key: 'equilibrio',  icon: '🧘', label: 'Equilibrio',  unit: 'cadute',  test: 'Flamingo Test',          desc: 'Numero di volte in cui si perde l\'equilibrio in 60 secondi.' },
  { key: 'esplosivita', icon: '💨', label: 'Esplosività', unit: 'secondi', test: '5 Time Sit to Stand',    desc: 'Tempo per alzarsi e sedersi 5 volte dalla sedia.' },
  { key: 'resistenza',  icon: '🫀', label: 'Resistenza',  unit: 'bpm',     test: 'YMCA Step Test',         desc: 'Frequenza cardiaca al termine del test a gradino YMCA.' },
]

export const STAT_KEYS = STATS.map(s => s.key)

export const CATEGORIE = ['Agonista', 'Amatoriale', 'Fragile']

export const NEW_CLIENT_DEFAULTS = {
  level:    1,
  rank:     'F',
  rankColor: '#6b7280',
  xp:       0,
  xpNext:   700,
  stats:    { forza: 0, mobilita: 0, equilibrio: 0, esplosivita: 0, resistenza: 0 },
  badges:   ['🌱 New Challenger'],
  log:      [],
  campionamenti: [],
}

export const XP_PER_LEVEL_MULTIPLIER = 1.3
export const LOG_MAX_ENTRIES         = 20
export const LEVEL_PER_RANK          = 4
