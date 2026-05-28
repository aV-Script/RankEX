import { writeBatch, doc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db }                                       from '../../firebase/services/db'
import { slotsPath }                                from '../../firebase/paths'
import {
  getSlotsByGroup,
  getGroupRecurrences,
  addClientToRecurrence,
  removeClientFromRecurrence,
} from '../../firebase/services/calendar'

/**
 * Raccoglie tutti i dati necessari per mostrare
 * il dialog di conferma prima del toggle.
 *
 * @returns {{ futureSlots: number, recurrences: Array }}
 */
export async function getGroupTogglePreview(orgId, groupId) {
  const today = new Date().toISOString().slice(0, 10)

  const [slots, recurrences] = await Promise.all([
    getSlotsByGroup(orgId, groupId, today),
    getGroupRecurrences(orgId, groupId),
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
export async function addClientToGroupSlots(orgId, groupId, clientId) {
  const today = new Date().toISOString().slice(0, 10)

  const [slots, recurrences] = await Promise.all([
    getSlotsByGroup(orgId, groupId, today),
    getGroupRecurrences(orgId, groupId),
  ])

  const nonRecurringSlots = slots.filter(
    s => !s.recurrenceId && !s.clientIds.includes(clientId)
  )

  if (nonRecurringSlots.length > 0) {
    const batch = writeBatch(db)
    nonRecurringSlots.forEach(s => {
      batch.update(doc(db, slotsPath(orgId), s.id), { clientIds: arrayUnion(clientId) })
    })
    await batch.commit()
  }

  await Promise.all(
    recurrences
      .filter(r => !r.clientIds.includes(clientId))
      .map(r => addClientToRecurrence(orgId, r.id, clientId))
  )
}

/**
 * Rimuove un cliente da un gruppo —
 * aggiorna slot futuri E ricorrenze attive.
 */
export async function removeClientFromGroupSlots(orgId, groupId, clientId) {
  const today = new Date().toISOString().slice(0, 10)

  const [slots, recurrences] = await Promise.all([
    getSlotsByGroup(orgId, groupId, today),
    getGroupRecurrences(orgId, groupId),
  ])

  const nonRecurringSlots = slots.filter(
    s => !s.recurrenceId && s.clientIds.includes(clientId)
  )

  if (nonRecurringSlots.length > 0) {
    const batch = writeBatch(db)
    nonRecurringSlots.forEach(s => {
      batch.update(doc(db, slotsPath(orgId), s.id), { clientIds: arrayRemove(clientId) })
    })
    await batch.commit()
  }

  await Promise.all(
    recurrences
      .filter(r => r.clientIds.includes(clientId))
      .map(r => removeClientFromRecurrence(orgId, r.id, clientId))
  )
}
