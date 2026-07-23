import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _salvaXP = httpsCallable(functions, 'salvaXP')

export async function saveXPUseCase(orgId, client, xpToAdd, note, _update) {
  await _salvaXP({ orgId, clientId: client.id, xpToAdd, note })
}
