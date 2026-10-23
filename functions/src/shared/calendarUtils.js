/**
 * Genera tutte le date (YYYY-MM-DD) tra startDate e endDate
 * che corrispondono ai giorni della settimana specificati.
 *
 * @param {string}   startDate — 'YYYY-MM-DD'
 * @param {string}   endDate   — 'YYYY-MM-DD'
 * @param {number[]} days      — [0..6] dove 0=Dom, 1=Lun, ... 6=Sab
 * @returns {string[]}
 */
export function generateRecurrenceDates(startDate, endDate, days) {
  const dates  = []
  const cursor = new Date(startDate + 'T12:00')
  const end    = new Date(endDate   + 'T12:00')
  while (cursor <= end) {
    if (days.includes(cursor.getDay())) {
      dates.push(cursor.toISOString().slice(0, 10))
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

/**
 * Data di oggi 'YYYY-MM-DD' nel fuso dell'app. Le Cloud Functions girano in UTC:
 * con toISOString(), tra mezzanotte e le 1-2 italiane "oggi" era ieri, e le
 * operazioni sugli slot futuri di una ricorrenza toccavano anche quelli di ieri.
 */
export function todayInRome() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' })
}
