import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _aggiungiRicorrenza = httpsCallable(functions, 'aggiungiRicorrenza')

export async function addRecurrenceUseCase({ orgId, clientIds, groupIds, days, startDate, endDate, startTime, endTime }) {
  const { data } = await _aggiungiRicorrenza({ orgId, clientIds, groupIds, days, startDate, endDate, startTime, endTime })
  return data
}
