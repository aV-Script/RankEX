import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _aggiungiClienteRicorrenza = httpsCallable(functions, 'aggiungiClienteRicorrenza')

export async function addClientToRecurrenceUseCase(orgId, recurrenceId, clientId) {
  const { data } = await _aggiungiClienteRicorrenza({ orgId, recurrenceId, clientId })
  return data
}
