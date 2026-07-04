import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _estendirRicorrenza = httpsCallable(functions, 'estendirRicorrenza')

export async function extendRecurrenceUseCase(orgId, recurrenceId, newEndDate) {
  const { data } = await _estendirRicorrenza({ orgId, recurrenceId, newEndDate })
  return data
}
