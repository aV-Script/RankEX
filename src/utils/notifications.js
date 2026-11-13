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
