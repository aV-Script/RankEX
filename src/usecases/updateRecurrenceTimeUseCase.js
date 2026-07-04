import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _aggiornaRicorrenzaOrario = httpsCallable(functions, 'aggiornaRicorrenzaOrario')

export async function updateRecurrenceTimeUseCase(orgId, recurrenceId, startTime, endTime) {
  const { data } = await _aggiornaRicorrenzaOrario({ orgId, recurrenceId, startTime, endTime })
  return data
}
