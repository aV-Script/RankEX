import { updateClient }    from '../firebase/services/clients'
import { addNotification } from '../firebase/services/notifications'

/**
 * Persiste il campionamento su Firestore e invia la notifica al cliente.
 *
 * @param {string} orgId
 * @param {object} client — cliente completo (deve avere id, clientAuthUid, rank)
 * @param {object} update — oggetto già calcolato da buildCampionamentoUpdate
 */
export async function saveCampionamentoUseCase(orgId, client, update) {
  await updateClient(orgId, client.id, update)
  if (client.clientAuthUid) {
    await addNotification(orgId, {
      clientId: client.id,
      message:  `Il tuo trainer ha aggiornato i tuoi parametri — nuovo rank: ${update.rank}`,
      date:     new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
      type:     'campionamento',
    })
  }
}
