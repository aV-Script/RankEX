// Terminologia del modulo per i testi scritti dalle callable (ADR-021).
// Sottoinsieme speculare di TERMINOLOGIES (src/config/modules.config.js): solo
// session / sessionGender. Il test di parità in src/__tests__/parity/ confronta le
// due copie. File con la sola dipendenza ./timezone.js: il test di parità lo importa
// anche in CI, dove functions/node_modules non è installato.
import { LOCAL_TIME_ZONE } from './timezone.js'

export const SESSION_TERMS = {
  personal_training: { session: 'Sessione',    sessionGender: 'f' },
  gym:               { session: 'Allenamento', sessionGender: 'm' },
  soccer_academy:    { session: 'Allenamento', sessionGender: 'm' },
  lipedema:          { session: 'Appuntamento', sessionGender: 'm' },
}

const DEFAULT_SESSION_TERM = SESSION_TERMS.personal_training
const ISO_DATE_PATTERN     = /^(\d{4})-(\d{2})-(\d{2})$/
// Mezzogiorno UTC: lo stesso giorno di calendario in Europe/Rome e in ogni fuso entro ±11 h
const NOON_UTC_HOUR        = 12

/**
 * Stessa precedenza di getTerminology: la variante nota vince sul modulo, poi il
 * modulo, poi PT (org legacy senza moduleType, o modulo sconosciuto).
 * @returns {{ session: string, sessionGender: 'm'|'f' }}
 */
export function resolveSessionTerm(moduleType, variant) {
  if (variant && SESSION_TERMS[variant]) return SESSION_TERMS[variant]
  return SESSION_TERMS[moduleType] ?? DEFAULT_SESSION_TERM
}

/**
 * Data di calendario 'YYYY-MM-DD' → '10 nov'. Non è un istante: niente
 * `new Date('YYYY-MM-DD')` (mezzanotte UTC). Input non valido → restituito invariato.
 */
export function formatSlotDateIt(isoDate) {
  const match = ISO_DATE_PATTERN.exec(String(isoDate ?? ''))
  if (!match) return String(isoDate ?? '')
  const [, year, month, day] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, NOON_UTC_HOUR))
  if (Number.isNaN(date.getTime())) return String(isoDate)
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', timeZone: LOCAL_TIME_ZONE })
}

/** "Allenamento del 10 nov completato[ e scheda "X" finita]! +N XP (streak S)" */
export function sessionCompletedMessage(term, isoDate, { xpGain, streak, planTitle }) {
  const completed = term.sessionGender === 'f' ? 'completata' : 'completato'
  const plan      = planTitle ? ` e scheda "${planTitle}" finita` : ''
  return `${term.session} del ${formatSlotDateIt(isoDate)} ${completed}${plan}! +${xpGain} XP (streak ${streak})`
}

/** "Allenamento del 10 nov — assenza registrata. Streak azzerata." */
export function sessionAbsenceMessage(term, isoDate) {
  return `${term.session} del ${formatSlotDateIt(isoDate)} — assenza registrata. Streak azzerata.`
}
