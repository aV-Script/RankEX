import { getClientSlotState } from './calendarUtils'

const byStartTime = (a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? '')

/**
 * Dalle prossime slot del cliente tiene solo le sessioni ancora pianificate
 * (non completate, saltate o con assenza), in ordine di data e ora.
 * @param {object[]} slots
 * @param {string} clientId
 */
export function pickUpcomingPlanned(slots, clientId) {
  return slots
    .filter(slot => getClientSlotState(slot, clientId) === 'planned')
    .sort((a, b) => a.date.localeCompare(b.date) || byStartTime(a, b))
}
