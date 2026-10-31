import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _annullaValutazione = httpsCallable(functions, 'annullaValutazione')

/** Annulla una valutazione (resta nello storico, esclusa dai confronti). */
export async function voidAssessmentUseCase(orgId, clientId, assessmentId, voidReason) {
  await _annullaValutazione({ orgId, clientId, assessmentId, voidReason })
}
