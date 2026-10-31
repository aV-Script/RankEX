import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _aggiungiValutazione = httpsCallable(functions, 'aggiungiValutazione')

/**
 * Salva i test di una visita. Risultato, esaminatore e date li calcola il server.
 * Con `supersedes` + `voidReason` annulla la valutazione indicata e salva la nuova
 * nella stessa transazione (correzione, ADR-011).
 * @returns {Promise<object[]>} valutazioni salvate
 */
export async function addAssessmentUseCase(orgId, clientId, tests, { supersedes = null, voidReason = null } = {}) {
  const { data } = await _aggiungiValutazione({ orgId, clientId, tests, supersedes, voidReason })
  return data.assessments
}
