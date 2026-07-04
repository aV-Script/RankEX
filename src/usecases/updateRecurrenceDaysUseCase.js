import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _aggiornaRicorrenzaGiorni = httpsCallable(functions, 'aggiornaRicorrenzaGiorni')

export async function updateRecurrenceDaysUseCase(orgId, recurrenceId, days) {
  const { data } = await _aggiornaRicorrenzaGiorni({ orgId, recurrenceId, days })
  return data
}
