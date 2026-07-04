import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _segnaNotificaLetta = httpsCallable(functions, 'segnaNotificaLetta')

export async function markNotificationReadUseCase(orgId, notificationId) {
  const { data } = await _segnaNotificaLetta({ orgId, notificationId })
  return data
}
