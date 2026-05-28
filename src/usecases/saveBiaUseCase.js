import { writeBatch, doc, collection }              from 'firebase/firestore'
import { db }                                        from '../firebase/services/db'
import { clientsPath, notificationsPath }            from '../firebase/paths'

/**
 * Persiste una misurazione BIA e invia la notifica in un unico batch atomico.
 *
 * @param {string} orgId
 * @param {object} client    — cliente completo (deve avere id, clientAuthUid)
 * @param {number} xpEarned  — XP guadagnati (per il testo e la condizione notifica)
 * @param {object} update    — oggetto già calcolato da buildBiaUpdate
 */
export async function saveBiaUseCase(orgId, client, xpEarned, update, isFirstMeasurement = false) {
  const batch = writeBatch(db)

  batch.update(doc(db, clientsPath(orgId), client.id), update)

  if (client.clientAuthUid && xpEarned > 0) {
    batch.set(doc(collection(db, notificationsPath(orgId))), {
      clientId:  client.id,
      message:   isFirstMeasurement
        ? `Prima misurazione BIA completata! +${xpEarned} XP`
        : `BIA aggiornata — +${xpEarned} XP guadagnati!`,
      date:      new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
      type:      'bia',
      read:      false,
      createdAt: new Date().toISOString(),
    })
  }

  await batch.commit()
}
