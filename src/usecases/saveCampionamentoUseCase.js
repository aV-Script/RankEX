import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _salvaCampionamento = httpsCallable(functions, 'salvaCampionamento')

export async function saveCampionamentoUseCase(orgId, client, update) {
  // Estraiamo i dati grezzi dall'update ottimistico per passarli al BE.
  // Il BE rilegge il client da Firestore e ricalcola in modo atomico.
  const newStats   = update.stats ?? {}
  const testValues = update.campionamenti?.[0]?.tests ?? {}
  await _salvaCampionamento({ orgId, clientId: client.id, newStats, testValues })
}
