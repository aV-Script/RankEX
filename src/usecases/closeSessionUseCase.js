import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _chiudiSessione = httpsCallable(functions, 'chiudiSessione')

/**
 * Chiude una sessione delegando tutta la logica alla Cloud Function.
 * Il BE carica i client, applica XP/streak e invia le notifiche in batch atomico.
 *
 * @param {string}   orgId
 * @param {object}   slot        — slot da chiudere (deve avere id)
 * @param {string[]} attendeeIds — clientIds presenti
 */
export async function closeSessionUseCase(orgId, slot, attendeeIds) {
  await _chiudiSessione({ orgId, slotId: slot.id, attendeeIds })
}
