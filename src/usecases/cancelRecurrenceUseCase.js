import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _cancellaRicorrenza = httpsCallable(functions, 'cancellaRicorrenza')

export async function cancelRecurrenceUseCase(orgId, recurrenceId) {
  const { data } = await _cancellaRicorrenza({ orgId, recurrenceId })
  return data
}
