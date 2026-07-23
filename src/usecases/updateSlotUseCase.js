import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _aggiornaSlot = httpsCallable(functions, 'aggiornaSlot')

export async function updateSlotUseCase(orgId, slotId, data) {
  const { data: result } = await _aggiornaSlot({ orgId, slotId, data })
  return result
}
