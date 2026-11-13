const timeOf = notification => {
  const time = new Date(notification.createdAt).getTime()
  return Number.isNaN(time) ? 0 : time
}

/**
 * Dalla più recente alla meno recente. Una notifica senza data valida (createdAt
 * assente o illeggibile) va in fondo invece di rendere l'ordine indefinito.
 * Non modifica l'array ricevuto.
 */
export function sortNotificationsNewestFirst(notifications) {
  return [...notifications].sort((a, b) => timeOf(b) - timeOf(a))
}

const MS_PER_MINUTE = 60000
const MS_PER_HOUR   = 3600000
const MS_PER_DAY    = 86400000
const JUST_NOW_MINUTES = 2
const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY    = 24
const DAYS_PER_WEEK    = 7

/** Data relativa di una notifica ("Adesso", "5 min fa", "Ieri", "12 nov"); vuota senza data. */
export function formatNotificationDate(raw, now = new Date()) {
  if (!raw) return ''
  try {
    const date = new Date(raw)
    const diffMs   = now - date
    const diffMins = Math.floor(diffMs / MS_PER_MINUTE)
    const diffHrs  = Math.floor(diffMs / MS_PER_HOUR)
    const diffDays = Math.floor(diffMs / MS_PER_DAY)
    if (diffMins < JUST_NOW_MINUTES) return 'Adesso'
    if (diffMins < MINUTES_PER_HOUR) return `${diffMins} min fa`
    if (diffHrs  < HOURS_PER_DAY)    return `${diffHrs} ore fa`
    if (diffDays === 1) return 'Ieri'
    if (diffDays < DAYS_PER_WEEK) return `${diffDays} giorni fa`
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  } catch {
    return raw
  }
}
