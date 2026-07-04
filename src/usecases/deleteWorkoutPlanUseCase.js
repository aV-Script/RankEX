import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _eliminaSchedaAllenamento = httpsCallable(functions, 'eliminaSchedaAllenamento')

export async function deleteWorkoutPlanUseCase(orgId, planId) {
  const { data } = await _eliminaSchedaAllenamento({ orgId, planId })
  return data
}
