/**
 * Scelta della data dello slot E2E e della settimana in cui lo spec lo cerca (Sprint #19 voce 3d).
 * Modulo puro: nessun import di firebase-admin né della config qa-dev, così lo prova Vitest.
 * La settimana è quella dell'app (lunedì-domenica, getWeekRange): condivisa, non reimplementata.
 */
import { getWeekRange } from '../../src/utils/calendarUtils.js'

const ROME_TIME_ZONE = 'Europe/Rome'
const MIDDAY_SUFFIX  = 'T12:00:00Z'

/** Data 'YYYY-MM-DD' di un istante nel fuso di Roma. */
export function romeDateStr(date) {
  return date.toLocaleDateString('sv-SE', { timeZone: ROME_TIME_ZONE })
}

/** Data 'YYYY-MM-DD' di ieri (fuso di Roma) rispetto a `now`: è passata, quindi lo slot è chiudibile/saltabile. */
export function e2eSlotDate(now) {
  const yesterday = new Date(`${romeDateStr(now)}${MIDDAY_SUFFIX}`)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  return yesterday.toISOString().slice(0, 10)
}

/** true se `slotDate` cade nella settimana (lun-dom, come l'app) precedente a quella di `todayDate`. */
export function isSlotInPreviousAppWeek(slotDate, todayDate) {
  const previousWeekDay = new Date(`${getWeekRange(todayDate).from}${MIDDAY_SUFFIX}`)
  previousWeekDay.setUTCDate(previousWeekDay.getUTCDate() - 1)
  const previousWeek = getWeekRange(previousWeekDay.toISOString().slice(0, 10))
  return slotDate >= previousWeek.from && slotDate <= previousWeek.to
}
