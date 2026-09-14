import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _annullaObiettivo = httpsCallable(functions, 'annullaObiettivo')

/** Annulla un obiettivo attivo (status → 'cancelled'). */
export async function cancelGoalUseCase(orgId, clientId, goalId) {
  await _annullaObiettivo({ orgId, clientId, goalId })
}
