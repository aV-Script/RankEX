import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _segnaAllLette = httpsCallable(functions, 'segnaAllLette')

export async function markAllNotificationsReadUseCase(orgId, clientId) {
  const { data } = await _segnaAllLette({ orgId, clientId })
  return data
}
