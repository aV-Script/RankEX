import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _saltaSlot = httpsCallable(functions, 'saltaSlot')

export async function skipSlotUseCase(orgId, slotId) {
  const { data } = await _saltaSlot({ orgId, slotId })
  return data
}
