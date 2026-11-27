// ── Badge system — fonte di verità ────────────────────────────────────────────
// Le icone sono identificatori stringa — il rendering SVG sta in BadgeMedal.jsx
//
// `label` e `description` sono una stringa o una funzione `(terminology) => string`:
// i testi che nominano sessione/trainer si risolvono sulla terminologia del modulo
// (BUG-038). Leggerli sempre con getBadgeLabel / getBadgeDescription.
import { bySessionGender, resolveTerminology } from './modules.config'

// "della sessione" / "dell'allenamento": preposizione articolata ricavata dall'articolo
// determinativo già giusto di `theSession` (la / l' / il)
function ofTheSession(terminology) {
  return terminology.theSession.replace(/^l'/, "dell'").replace(/^la /, 'della ').replace(/^il /, 'del ')
}

// "Hai completato 5 sessioni." / "Hai completato 5 allenamenti."
const completedSessions = count => terminology => `Hai completato ${count} ${terminology.sessions.toLowerCase()}.`

// Platino: bianco-argento ad alta luminosità con glow ciano residuo (non più
// ciano pieno) — per una progressione bronzo→argento→oro→platino monotona in
// luminosità, dove prima il ciano leggeva meno "premium" dell'oro (P3.2).
export const BADGE_TIERS = {
  bronze:   { label: 'Bronzo',  color: '#cd7f32',           glow: 'rgba(205,127,50,0.35)' },
  silver:   { label: 'Argento', color: 'var(--rx-silver)',  glow: 'rgba(192,192,192,0.35)' },
  gold:     { label: 'Oro',     color: 'var(--rx-gold)',    glow: 'rgba(255,215,0,0.35)' },
  platinum: { label: 'Platino', color: '#f5fbff',           glow: 'rgba(93,212,255,0.4)' },
}

export const BADGES = [
  // ── Automatici ───────────────────────────────────────────────────────────────
  {
    id:          'prima_sessione',
    label:       terminology => `${bySessionGender(terminology, 'Primo', 'Prima')} ${terminology.session}`,
    description: terminology => `Hai completato ${bySessionGender(terminology, 'il tuo primo', 'la tua prima')} ${terminology.session.toLowerCase()}.`,
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
    description: completedSessions(5),
    tier:        'silver',
    type:        'auto',
    icon:        'flame',
  },
  {
    id:          'striscia_10',
    label:       'Striscia x10',
    description: completedSessions(10),
    tier:        'gold',
    type:        'auto',
    icon:        'flame',
  },
  {
    id:          'striscia_25',
    label:       'Striscia x25',
    description: completedSessions(25),
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
    description: terminology => `Riconoscimento speciale del ${terminology.trainer.toLowerCase()}.`,
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
    description: terminology => `Most Valuable Player — il migliore ${ofTheSession(terminology)}.`,
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

const resolveText = (text, terminology) =>
  typeof text === 'function' ? text(resolveTerminology(terminology)) : text

/** Nome del trofeo nella terminologia del modulo (assente → PT). */
export function getBadgeLabel(badge, terminology) {
  return resolveText(badge.label, terminology)
}

/** Descrizione del trofeo nella terminologia del modulo (assente → PT). */
export function getBadgeDescription(badge, terminology) {
  return resolveText(badge.description, terminology)
}
