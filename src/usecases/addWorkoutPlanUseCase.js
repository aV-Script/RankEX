import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _aggiungiSchedaAllenamento = httpsCallable(functions, 'aggiungiSchedaAllenamento')

export async function addWorkoutPlanUseCase(orgId, clientId, title, description, days) {
  const { data } = await _aggiungiSchedaAllenamento({ orgId, clientId, title, description, days })
  return data.id
}
