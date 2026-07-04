import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _eliminaSlot = httpsCallable(functions, 'eliminaSlot')

export async function deleteSlotUseCase(orgId, slotId) {
  const { data } = await _eliminaSlot({ orgId, slotId })
  return data
}
