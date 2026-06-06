// ── Badge system — fonte di verità ────────────────────────────────────────────
// Le icone sono identificatori stringa — il rendering SVG sta in BadgeMedal.jsx

export const BADGE_TIERS = {
  bronze:   { label: 'Bronzo',  color: '#cd7f32', glow: 'rgba(205,127,50,0.35)' },
  silver:   { label: 'Argento', color: '#9ca3af', glow: 'rgba(156,163,175,0.35)' },
  gold:     { label: 'Oro',     color: '#ffd700', glow: 'rgba(255,215,0,0.35)' },
  platinum: { label: 'Platino', color: '#2ecfff', glow: 'rgba(46,207,255,0.35)' },
}

export const BADGES = [
  // ── Automatici ───────────────────────────────────────────────────────────────
  {
    id:          'prima_sessione',
    label:       'Prima Sessione',
    description: 'Hai completato la tua prima sessione di allenamento.',
    tier:        'bronze',
    type:        'auto',
    icon:        'lightning',
  },
  {
    id:          'primo_campionamento',
    label:       'Primo Test',
    description: 'Hai completato il tuo primo campionamento atletico.',
    tier:        'bronze',
    type:        'auto',
    icon:        'clipboard',
  },
  {
    id:          'striscia_5',
    label:       'Striscia x5',
    description: 'Hai completato 5 sessioni di allenamento.',
    tier:        'silver',
    type:        'auto',
    icon:        'flame',
  },
  {
    id:          'striscia_10',
    label:       'Striscia x10',
    description: 'Hai completato 10 sessioni di allenamento.',
    tier:        'gold',
    type:        'auto',
    icon:        'flame',
  },
  {
    id:          'striscia_25',
    label:       'Striscia x25',
    description: 'Hai completato 25 sessioni di allenamento.',
    tier:        'gold',
    type:        'auto',
    icon:        'star',
  },
  {
    id:          'primo_rank_up',
    label:       'Primo Rank-Up',
    description: 'Hai ottenuto il tuo primo avanzamento di rank.',
    tier:        'silver',
    type:        'auto',
    icon:        'arrow_up',
  },
  {
    id:          'top_performer',
    label:       'Top Performer',
    description: 'Hai raggiunto il 90° percentile su almeno un test.',
    tier:        'gold',
    type:        'auto',
    icon:        'target',
  },
  {
    id:          'rank_massimo',
    label:       'Rank EX',
    description: 'Hai raggiunto il rank massimo: EX.',
    tier:        'platinum',
    type:        'auto',
    icon:        'crown',
  },

  // ── Manuali (assegnati dal trainer) ──────────────────────────────────────────
  {
    id:          'campione',
    label:       'Campione',
    description: 'Riconoscimento speciale del trainer.',
    tier:        'gold',
    type:        'manual',
    icon:        'trophy',
  },
  {
    id:          'perseveranza',
    label:       'Perseveranza',
    description: 'Hai dimostrato costanza e dedizione.',
    tier:        'silver',
    type:        'manual',
    icon:        'shield',
  },
  {
    id:          'spirito',
    label:       'Spirito di Squadra',
    description: 'Esempio di collaborazione e spirito di gruppo.',
    tier:        'silver',
    type:        'manual',
    icon:        'users',
  },
  {
    id:          'talento',
    label:       'Talento',
    description: 'Hai mostrato un talento naturale eccezionale.',
    tier:        'gold',
    type:        'manual',
    icon:        'star',
  },
  {
    id:          'mvp',
    label:       'MVP',
    description: 'Most Valuable Player — il migliore della sessione.',
    tier:        'platinum',
    type:        'manual',
    icon:        'medal',
  },
  {
    id:          'progressione',
    label:       'Progressione',
    description: 'Miglioramento costante e misurabile nel tempo.',
    tier:        'bronze',
    type:        'manual',
    icon:        'lightning',
  },
]

export const BADGES_MAP    = Object.fromEntries(BADGES.map(b => [b.id, b]))
export const AUTO_BADGES   = BADGES.filter(b => b.type === 'auto')
export const MANUAL_BADGES = BADGES.filter(b => b.type === 'manual')
