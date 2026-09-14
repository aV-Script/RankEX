import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _aggiungiObiettivo = httpsCallable(functions, 'aggiungiObiettivo')

/**
 * Crea un obiettivo (target percentile su un test specifico, con scadenza).
 * testLabel viene passato dal client perché il BE non ha label/unit dei test
 * (vedi functions/src/shared/testsMeta.js) — stesso motivo di saveCampionamentoUseCase.
 */
export async function addGoalUseCase(orgId, clientId, { testKey, testLabel, targetPercentile, deadline, note }) {
  const { data } = await _aggiungiObiettivo({ orgId, clientId, testKey, testLabel, targetPercentile, deadline, note })
  return data
}
