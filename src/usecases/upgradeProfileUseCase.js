import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _aggiornaProfiloCliente = httpsCallable(functions, 'aggiornaProfiloCliente')

export async function upgradeProfileUseCase(orgId, client, _update) {
  await _aggiornaProfiloCliente({ orgId, clientId: client.id, newProfileType: _update.profileType })
}
