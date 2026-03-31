import {
  getSlotsByGroup,
  getGroupRecurrences,
  addClientToSlot,
  removeClientFromSlot,
  addClientToRecurrence,
  removeClientFromRecurrence,
} from '../../firebase/services/calendar'

/**
 * Raccoglie tutti i dati necessari per mostrare
 * il dialog di conferma prima del toggle.
 *
 * @returns {{
 *   futureSlots: number,
 *   recurrences: Array,
 * }}
 */
export async function getGroupTogglePreview(trainerId, groupId) {
  const today = new Date().toISOString().slice(0, 10)

  const [slots, recurrences] = await Promise.all([
    getSlotsByGroup(trainerId, groupId, today),
    getGroupRecurrences(trainerId, groupId),
  ])

  return {
    futureSlots: slots.length,
    recurrences,
  }
}

/**
 * Aggiunge un cliente a un gruppo —
 * aggiorna slot futuri E ricorrenze attive.
 */
export async function addClientToGroupSlots(trainerId, groupId, clientId) {
  const today = new Date().toISOString().slice(0, 10)

  const [slots, recurrences] = await Promise.all([
    getSlotsByGroup(trainerId, groupId, today),
    getGroupRecurrences(trainerId, groupId),
  ])

  // Aggiunge agli slot futuri non ricorrenti
  // (quelli ricorrenti vengono gestiti via addClientToRecurrence)
  const nonRecurringSlots = slots.filter(
    s => !s.recurrenceId && !s.clientIds.includes(clientId)
  )

  await Promise.all([
    ...nonRecurringSlots.map(s => addClientToSlot(s.id, clientId)),
    ...recurrences.map(r =>
      !r.clientIds.includes(clientId)
        ? addClientToRecurrence(r.id, clientId)
        : Promise.resolve()
    ),
  ])
}

/**
 * Rimuove un cliente da un gruppo —
 * aggiorna slot futuri E ricorrenze attive.
 */
export async function removeClientFromGroupSlots(trainerId, groupId, clientId) {
  const today = new Date().toISOString().slice(0, 10)

  const [slots, recurrences] = await Promise.all([
    getSlotsByGroup(trainerId, groupId, today),
    getGroupRecurrences(trainerId, groupId),
  ])

  // Rimuove dagli slot futuri non ricorrenti
  const nonRecurringSlots = slots.filter(
    s => !s.recurrenceId && s.clientIds.includes(clientId)
  )

  await Promise.all([
    ...nonRecurringSlots.map(s => removeClientFromSlot(s.id, clientId)),
    ...recurrences.map(r =>
      r.clientIds.includes(clientId)
        ? removeClientFromRecurrence(r.id, clientId)
        : Promise.resolve()
    ),
  ])
}
