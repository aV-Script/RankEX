// Formattazione a schermo delle valutazioni (it-IT). Solo presentazione: i
// valori salvati e i delta li decidono utils/lipedema.js e il server.

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

/** Delta in metri senza giudizio: "+8 m", "−3 m", "0 m" */
export function formatSignedMeters(delta) {
  if (delta > 0) return `+${formatNumber(delta)} m`
  if (delta < 0) return `−${formatNumber(Math.abs(delta))} m`
  return '0 m'
}

/** Data/ora ISO del server → '30/10/2026 · 10:30' nell'ora locale */
export function formatTimestamp(iso) {
  if (typeof iso !== 'string') return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const time = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  return `${date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })} · ${time}`
}
