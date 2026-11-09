/**
 * Pulizia dei dati creati dagli spec QA (STORY-041): solo clienti/pazienti delle org
 * qa-* il cui nome inizia con E2E_PREFIX, con quanto li riguarda. Admin SDK, perché
 * le valutazioni sono immutabili dal client. Mai fuori da rankex-dev: il service
 * account è verificato da loadDevServiceAccount prima di arrivare qui.
 */
import { FieldValue } from 'firebase-admin/firestore'
import { E2E_PREFIX, QA_ORGS, assertDevFirestore } from './qaDev.config.js'

// '\uf8ff' (ultimo code point BMP d'uso comune): name >= 'E2E-' && name < 'E2E-\uf8ff'
// equivale a "inizia con E2E-". Scritto come escape: il carattere è invisibile
const PREFIX_END = `${E2E_PREFIX}\uf8ff`

/** @returns {Promise<number>} clienti cancellati */
export async function cleanupE2EData(db, adminAuth) {
  // Seconda guardia, indipendente dal chiamante: niente cancellazioni fuori da rankex-dev
  assertDevFirestore(db)
  let deleted = 0
  for (const { orgId } of Object.values(QA_ORGS)) {
    const orgRef  = db.doc(`organizations/${orgId}`)
    const clients = await orgRef.collection('clients')
      .where('name', '>=', E2E_PREFIX).where('name', '<', PREFIX_END).get()

    // Ricontrollo in memoria del prefisso: la query per range non deve essere l'unica difesa
    const e2eClients = clients.docs.filter(doc => String(doc.data().name ?? '').startsWith(E2E_PREFIX))
    for (const clientDoc of e2eClients) {
      await deleteClientTraces(db, adminAuth, orgRef, clientDoc)
      deleted++
    }
    if (e2eClients.length) await orgRef.update({ clientCount: FieldValue.increment(-e2eClients.length) })
  }
  return deleted
}

async function deleteClientTraces(db, adminAuth, orgRef, clientDoc) {
  const clientId = clientDoc.id
  const { clientAuthUid } = clientDoc.data()

  if (clientAuthUid) {
    // Si cancella l'account solo se è davvero il login di questo cliente E2E
    const userRef = db.doc(`users/${clientAuthUid}`)
    const profile = (await userRef.get()).data()
    const isOwnLogin = profile?.role === 'client' && profile.orgId === orgRef.id && profile.clientId === clientId
    if (isOwnLogin) {
      await adminAuth.deleteUser(clientAuthUid).catch(err => {
        if (err.code !== 'auth/user-not-found') throw err
      })
      await userRef.delete()
    } else if (profile) {
      console.warn(`cleanup: ${clientAuthUid} non è il login del cliente ${clientId}, account lasciato intatto`)
    }
  }

  // Appuntamenti e ricorrenze del solo cliente E2E si cancellano; quelli condivisi lo perdono
  for (const name of ['slots', 'recurrences']) {
    const docs = await orgRef.collection(name).where('clientIds', 'array-contains', clientId).get()
    for (const doc of docs.docs) {
      const others = (doc.data().clientIds ?? []).filter(id => id !== clientId)
      if (others.length) await doc.ref.update({ clientIds: FieldValue.arrayRemove(clientId) })
      else await doc.ref.delete()
    }
  }
  const groups = await orgRef.collection('groups').where('clientIds', 'array-contains', clientId).get()
  for (const doc of groups.docs) await doc.ref.update({ clientIds: FieldValue.arrayRemove(clientId) })

  for (const name of ['notifications', 'workoutPlans']) {
    const docs = await orgRef.collection(name).where('clientId', '==', clientId).get()
    for (const doc of docs.docs) await doc.ref.delete()
  }

  // Cliente con assessments, note e obiettivi
  await db.recursiveDelete(clientDoc.ref)
}
