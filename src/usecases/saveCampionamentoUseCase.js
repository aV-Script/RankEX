import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _salvaCampionamento = httpsCallable(functions, 'salvaCampionamento')

export async function saveCampionamentoUseCase(orgId, client, update, testValues) {
  // Il BE calcola i percentili server-side dai valori grezzi (testValues). Il testo
  // descrittivo del log ("Campionamento — Sprint 20m 3.2s · ...") invece arriva da qui,
  // perché richiede label/unit dei test (constants/tests.js) che il BE non ha.
  const logAction = update?.log?.[0]?.action
  await _salvaCampionamento({ orgId, clientId: client.id, testValues: testValues ?? {}, logAction })
}
