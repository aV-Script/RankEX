import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _aggiornaSchedaAllenamento = httpsCallable(functions, 'aggiornaSchedaAllenamento')

export async function updateWorkoutPlanUseCase(orgId, planId, data) {
  const { data: result } = await _aggiornaSchedaAllenamento({ orgId, planId, data })
  return result
}
