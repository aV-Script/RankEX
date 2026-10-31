// Formattazione a schermo delle valutazioni (it-IT). Solo presentazione: i
// valori salvati e i delta li decidono utils/lipedema.js e il server.
import { SIDE_LABELS } from '../../config/lipedemaTests.config'

// Esiti senza delta (buildTestHistory → deltaUnavailable), come li si legge
const UNAVAILABLE_OUTCOME_TEXT = {
  stopped_early: 'interrotta',
  invalidated:   'invalidata (protocollo non valido)',
}

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

/** 'YYYY-MM-DD…' → '30/10' */
export function formatShortDate(value) {
  return formatDate(value).slice(0, 5)
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
export function formatMonoDelta(entry, unitLabel, decimals = 0) {
  const { assessment, reference, delta, deltaUnavailable } = entry
  if (!reference) return null
  const since = `rispetto al ${formatShortDate(reference.performedAt)}`
  if (deltaUnavailable) {
    const which = UNAVAILABLE_OUTCOME_TEXT[assessment.outcome]
      ? `questa valutazione è ${UNAVAILABLE_OUTCOME_TEXT[assessment.outcome]}`
      : `quella precedente è ${UNAVAILABLE_OUTCOME_TEXT[reference.outcome] ?? deltaUnavailable}`
    return `— ${since}: ${which}`
  }
  return `${formatSignedNumber(delta, decimals)} ${unitLabel} ${since}`
}

/**
 * Delta per lato di un test bilaterale (sul best): "D +12 N · S −4 N rispetto
 * al 03/09"; con riferimenti diversi per lato, la data accanto a ciascuno.
 * null se nessun lato ha un delta.
 */
export function formatBilateralDelta(entry, unit, decimals = 0) {
  const sides = Object.keys(entry.deltaBySide ?? {}).filter(side => entry.deltaBySide[side] !== null)
  if (sides.length === 0) return null
  const part  = side => `${SIDE_LABELS[side].short} ${formatSignedNumber(entry.deltaBySide[side], decimals)} ${unit}`
  const since = side => `rispetto al ${formatShortDate(entry.referenceBySide[side].performedAt)}`
  const dates = new Set(sides.map(side => entry.referenceBySide[side].performedAt))
  if (dates.size === 1) return `${sides.map(part).join(' · ')} ${since(sides[0])}`
  return sides.map(side => `${part(side)} ${since(side)}`).join(' · ')
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
