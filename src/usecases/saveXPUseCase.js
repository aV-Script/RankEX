import { writeBatch, doc, collection }              from 'firebase/firestore'
import { db }                                        from '../firebase/services/db'
import { clientsPath, notificationsPath }            from '../firebase/paths'

/**
 * Aggiunge XP a un cliente e invia la notifica in un unico batch atomico.
 *
 * @param {string} orgId
 * @param {object} client   — cliente completo (deve avere id, clientAuthUid)
 * @param {number} xpToAdd  — XP da aggiungere (per il testo notifica)
 * @param {string} note     — motivazione (per il testo notifica)
 * @param {object} update   — oggetto già calcolato da buildXPUpdate
 */
export async function saveXPUseCase(orgId, client, xpToAdd, note, update) {
  const batch = writeBatch(db)

  batch.update(doc(db, clientsPath(orgId), client.id), update)

  if (client.clientAuthUid) {
    batch.set(doc(collection(db, notificationsPath(orgId))), {
      clientId:  client.id,
      message:   `Hai guadagnato ${xpToAdd} XP — ${note || 'aggiunto dal trainer'}!`,
      date:      new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
      type:      'xp',
      read:      false,
      createdAt: new Date().toISOString(),
    })
  }

  await batch.commit()
}
