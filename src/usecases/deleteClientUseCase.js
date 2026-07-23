import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _eliminaCliente = httpsCallable(functions, 'eliminaCliente')

export async function deleteClientUseCase(orgId, clientId) {
  const { data } = await _eliminaCliente({ orgId, clientId })
  return data
}
