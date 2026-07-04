import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _creaCliente = httpsCallable(functions, 'creaCliente')

export async function createClientUseCase(orgId, trainerId, formData) {
  const { data } = await _creaCliente({ orgId, trainerId, formData })
  return data
}
