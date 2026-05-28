import { writeBatch, doc, collection }              from 'firebase/firestore'
import { db }                                        from '../firebase/services/db'
import { clientsPath, notificationsPath }            from '../firebase/paths'

/**
 * Aggiorna il profilo di un cliente e invia la notifica in un unico batch atomico.
 *
 * @param {string} orgId
 * @param {object} client  — cliente completo (deve avere id, clientAuthUid)
 * @param {object} update  — oggetto già calcolato da buildProfileUpgrade
 */
export async function upgradeProfileUseCase(orgId, client, update) {
  const batch = writeBatch(db)

  batch.update(doc(db, clientsPath(orgId), client.id), update)

  if (client.clientAuthUid) {
    batch.set(doc(collection(db, notificationsPath(orgId))), {
      clientId:  client.id,
      message:   'Il tuo profilo è stato aggiornato dal trainer.',
      date:      new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
      type:      'upgrade',
      read:      false,
      createdAt: new Date().toISOString(),
    })
  }

  await batch.commit()
}
