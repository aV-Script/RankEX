import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _salvaBia = httpsCallable(functions, 'salvaBia')

export async function saveBiaUseCase(orgId, client, _xpEarned, update) {
  // Estraiamo la misurazione (senza la data generata client-side).
  // Il BE rilegge il client da Firestore, ricalcola XP e persiste in batch atomico.
  const { date: _d, ...biaData } = update?.lastBia ?? {}
  await _salvaBia({ orgId, clientId: client.id, biaData })
}
