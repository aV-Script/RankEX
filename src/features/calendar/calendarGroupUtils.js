import {
  getSlotsByGroup,
  addClientToSlot,
  removeClientFromSlot,
} from '../../firebase/services/calendar'

/**
 * Aggiunge un cliente a tutti gli slot futuri di un gruppo.
 * Chiamato quando un cliente viene aggiunto a un gruppo.
 */
export async function addClientToGroupSlots(trainerId, groupId, clientId, fromDate) {
  const slots = await getSlotsByGroup(trainerId, groupId, fromDate)
  await Promise.all(
    slots
      .filter(s => !s.clientIds.includes(clientId))
      .map(s => addClientToSlot(s.id, clientId))
  )
}

/**
 * Rimuove un cliente da tutti gli slot futuri di un gruppo.
 * Chiamato quando un cliente viene rimosso da un gruppo.
 */
export async function removeClientFromGroupSlots(trainerId, groupId, clientId, fromDate) {
  const slots = await getSlotsByGroup(trainerId, groupId, fromDate)
  await Promise.all(
    slots
      .filter(s => s.clientIds.includes(clientId))
      .map(s => removeClientFromSlot(s.id, clientId))
  )
}