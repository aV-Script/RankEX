import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _salvaCampionamento = httpsCallable(functions, 'salvaCampionamento')

export async function saveCampionamentoUseCase(orgId, client, _update, testValues) {
  // Il BE calcola i percentili server-side dai valori grezzi (testValues).
  await _salvaCampionamento({ orgId, clientId: client.id, testValues: testValues ?? {} })
}
