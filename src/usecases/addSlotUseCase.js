import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _aggiungiSlot = httpsCallable(functions, 'aggiungiSlot')

export async function addSlotUseCase(orgId, date, startTime, endTime, clientIds, groupIds) {
  const { data } = await _aggiungiSlot({ orgId, date, startTime, endTime, clientIds, groupIds })
  return data
}
