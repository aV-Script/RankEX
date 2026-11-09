// Formattazione a schermo delle valutazioni (it-IT). Solo presentazione: i
// valori salvati e i delta li decidono utils/lipedema.js e il server.
import { COMPARISON, isValidAssessment } from '../../utils/lipedema'
import { SIDE_LABELS, COMPARABILITY_REASON_LABELS } from '../../config/lipedemaTests.config'

// Esiti senza delta (buildTestHistory → deltaUnavailable), come li si legge
const UNAVAILABLE_OUTCOME_TEXT = {
  stopped_early: 'interrotta',
  invalidated:   'invalidata (protocollo non valido)',
}

const NO_SAME_DAY_DATES = new Set()
const DAY_LENGTH = 10 // 'YYYY-MM-DD'

export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/** Lunghezza inserita con passo 0,1 m: mostrata con il decimale solo se c'è */
export function formatLength(value) {
  return formatNumber(value, Number.isInteger(value) ? 0 : 1)
}

/** 'YYYY-MM-DDTHH:mm' → '30/10/2026 · 10:30' */
export function formatDateTime(performedAt) {
  if (typeof performedAt !== 'string') return '—'
  const [date, time] = performedAt.split('T')
  return `${formatDate(date)}${time ? ` · ${time}` : ''}`
}

/** 'YYYY-MM-DD' (o una data ISO) → '30/10/2026' */
export function formatDate(value) {
  if (typeof value !== 'string' || value.length < 10) return '—'
  const [year, month, day] = value.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

/**
 * Giorni ('YYYY-MM-DD') presenti più di una volta tra gli istanti 'YYYY-MM-DDTHH:mm':
 * dove la sola data breve non distinguerebbe due valutazioni.
 */
export function getSameDayDates(performedAts) {
  const seen     = new Set()
  const repeated = new Set()
  for (const performedAt of performedAts) {
    if (typeof performedAt !== 'string') continue
    const day = performedAt.slice(0, DAY_LENGTH)
    if (seen.has(day)) repeated.add(day)
    seen.add(day)
  }
  return repeated
}

/** Giorni con più valutazioni valide (quelle che lo storico mostra come tali) dello stesso test */
export function getSameDayDatesForTest(assessments, testId) {
  return getSameDayDates(
    assessments
      .filter(assessment => assessment.testId === testId && isValidAssessment(assessment))
      .map(assessment => assessment.performedAt),
  )
}

/**
 * 'YYYY-MM-DD…' → '30/10'; con l'ora ('30/10 10:30') solo se il giorno è in
 * `sameDayDates` e il valore ha l'ora.
 */
export function formatShortDate(value, sameDayDates = NO_SAME_DAY_DATES) {
  const short = formatDate(value).slice(0, 5)
  if (typeof value !== 'string' || !sameDayDates.has(value.slice(0, DAY_LENGTH))) return short
  const time = value.split('T')[1]
  return time ? `${short} ${time}` : short
}

/** Numero con segno senza giudizio, "−" tipografico: "+8", "−3", "0" */
export function formatSignedNumber(delta, decimals = 0) {
  if (delta > 0) return `+${formatNumber(delta, decimals)}`
  if (delta < 0) return `−${formatNumber(Math.abs(delta), decimals)}`
  return formatNumber(0, decimals)
}

/**
 * Delta di un test monolaterale rispetto alla precedente confrontabile:
 * "+8 m rispetto al 03/09", o "— rispetto al 03/09: questa valutazione è
 * interrotta". null se non c'è un riferimento.
 * @param {object} entry — buildTestHistory
 */
export function formatMonoDelta(entry, unitLabel, decimals = 0, sameDayDates = NO_SAME_DAY_DATES) {
  const { assessment, reference, delta, deltaUnavailable } = entry
  if (!reference) return null
  const since = `rispetto al ${formatShortDate(reference.performedAt, sameDayDates)}`
  if (deltaUnavailable) {
    const which = UNAVAILABLE_OUTCOME_TEXT[assessment.outcome]
      ? `questa valutazione è ${UNAVAILABLE_OUTCOME_TEXT[assessment.outcome]}`
      : `quella precedente è ${UNAVAILABLE_OUTCOME_TEXT[reference.outcome] ?? deltaUnavailable}`
    return `— ${since}: ${which}`
  }
  // Unità numerabile ({ singular, plural }): "+1 ripetizione", "+2 ripetizioni"
  const unit = typeof unitLabel === 'string' ? unitLabel : (Math.abs(delta) === 1 ? unitLabel.singular : unitLabel.plural)
  return `${formatSignedNumber(delta, decimals)} ${unit} ${since}`
}

/**
 * Delta per lato di un test bilaterale (sul best): "D +12 N · S −4 N rispetto
 * al 03/09"; con riferimenti diversi per lato, la data accanto a ciascuno.
 * null se nessun lato ha un delta.
 */
export function formatBilateralDelta(entry, unit, decimals = 0, sameDayDates = NO_SAME_DAY_DATES) {
  const sides = Object.keys(entry.deltaBySide ?? {}).filter(side => entry.deltaBySide[side] !== null)
  if (sides.length === 0) return null
  const part  = side => `${SIDE_LABELS[side].short} ${formatSignedNumber(entry.deltaBySide[side], decimals)} ${unit}`
  const since = side => `rispetto al ${formatShortDate(entry.referenceBySide[side].performedAt, sameDayDates)}`
  const dates = new Set(sides.map(side => entry.referenceBySide[side].performedAt))
  if (dates.size === 1) return `${sides.map(part).join(' · ')} ${since(sides[0])}`
  return sides.map(side => `${part(side)} ${since(side)}`).join(' · ')
}

/**
 * Etichette unite con ", " e " e " prima dell'ultima, la prima maiuscola:
 * "Calzature diverse e superficie diversa".
 */
export function joinReasons(reasons) {
  const labels = reasons.map(reason => COMPARABILITY_REASON_LABELS[reason] ?? reason)
  const text   = labels.length > 1 ? `${labels.slice(0, -1).join(', ')} e ${labels[labels.length - 1]}` : (labels[0] ?? '')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Note di comparabilità di una riga di storico (ADR-019 §5), una per frase: la
 * differenza di protocollo rispetto alla precedente (con la data del delta) e le
 * differenze informative (seriale). [] se non c'è niente da dire.
 * @param {object} entry — buildTestHistory
 */
export function formatComparisonNote(entry, sameDayDates = NO_SAME_DAY_DATES) {
  const notes = []
  const { comparison, previous, nonComparable } = entry
  if (previous && nonComparable) {
    const lead = `${joinReasons(nonComparable)} dalla valutazione del ${formatShortDate(previous.performedAt, sameDayDates)}`
    if (comparison === COMPARISON.NONE_COMPARABLE) {
      notes.push(`${lead}: non confrontabile con nessuna valutazione precedente, delta non calcolato.`)
    } else if (comparison === COMPARISON.DIFFERS) {
      const since = formatDeltaSince(entry, sameDayDates)
      notes.push(since ? `${lead}: delta ${since}.` : `${lead}: delta non calcolato.`)
    }
  }
  for (const item of entry.info ?? []) {
    const date = formatShortDate(item.reference.performedAt, sameDayDates)
    if (item.reason === 'serial') {
      notes.push(`Stesso modello di dinamometro, seriale diverso dalla valutazione del ${date}: il delta resta valido.`)
    } else if (item.missingOn === 'current') {
      notes.push(`Seriale del dinamometro non registrato in questa valutazione (presente in quella del ${date}): il delta resta valido.`)
    } else {
      notes.push(`Seriale del dinamometro non registrato nella valutazione del ${date}: il delta resta valido.`)
    }
  }
  return notes
}

/**
 * "rispetto al 05/11", con riferimenti diversi per lato "rispetto al 05/11 (D) e
 * al 20/10 (S)". null se la riga non ha delta (estremo interrotto/invalidato o
 * nessun lato completo in comune).
 */
function formatDeltaSince(entry, sameDayDates) {
  if (entry.deltaBySide) {
    const sides = Object.keys(entry.deltaBySide).filter(side => entry.deltaBySide[side] !== null)
    if (sides.length === 0) return null
    const dates = new Set(sides.map(side => entry.referenceBySide[side].performedAt))
    if (dates.size === 1) return `rispetto al ${formatShortDate(entry.referenceBySide[sides[0]].performedAt, sameDayDates)}`
    const parts = sides.map(side => `al ${formatShortDate(entry.referenceBySide[side].performedAt, sameDayDates)} (${SIDE_LABELS[side].short})`)
    return `rispetto ${parts.join(' e ')}`
  }
  if (entry.delta === null) return null
  return `rispetto al ${formatShortDate(entry.reference.performedAt, sameDayDates)}`
}

/** Best per lato: "D 245 · S 231 N" ("—" sul lato senza best) */
export function formatBilateralPrimary(assessment, unit, decimals = 0) {
  const bestBySide = assessment?.result?.bestBySide ?? {}
  const sides = Object.keys(SIDE_LABELS).filter(side => Object.hasOwn(bestBySide, side))
  if (sides.length === 0) return '—'
  return `${sides.map(side => `${SIDE_LABELS[side].short} ${formatNumber(bestBySide[side], decimals)}`).join(' · ')} ${unit}`
}

/** Data/ora ISO del server → '30/10/2026 · 10:30' nell'ora locale */
export function formatTimestamp(iso) {
  if (typeof iso !== 'string') return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const time = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  return `${date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })} · ${time}`
}
