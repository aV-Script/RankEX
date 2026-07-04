import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _rimuoviClienteRicorrenza = httpsCallable(functions, 'rimuoviClienteRicorrenza')

export async function removeClientFromRecurrenceUseCase(orgId, recurrenceId, clientId) {
  const { data } = await _rimuoviClienteRicorrenza({ orgId, recurrenceId, clientId })
  return data
}
