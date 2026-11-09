/**
 * Pulizia dei dati creati dagli spec QA (STORY-041): solo clienti/pazienti delle org
 * qa-* il cui nome inizia con E2E_PREFIX, con quanto li riguarda. Admin SDK, perché
 * le valutazioni sono immutabili dal client. Mai fuori da rankex-dev: il service
 * account è verificato da loadDevServiceAccount prima di arrivare qui.
 */
import { FieldValue } from 'firebase-admin/firestore'
import { E2E_PREFIX, QA_ORGS } from './qaDev.config.js'

// Ultimo carattere stampabile: name >= 'E2E-' && name < 'E2E-' = inizia con il prefisso
const PREFIX_END = `${E2E_PREFIX}`

/** @returns {Promise<number>} clienti cancellati */
export async function cleanupE2EData(db, adminAuth) {
  let deleted = 0
  for (const { orgId } of Object.values(QA_ORGS)) {
    const orgRef  = db.doc(`organizations/${orgId}`)
    const clients = await orgRef.collection('clients')
      .where('name', '>=', E2E_PREFIX).where('name', '<', PREFIX_END).get()

    for (const clientDoc of clients.docs) {
      await deleteClientTraces(db, adminAuth, orgRef, clientDoc)
      deleted++
    }
    if (clients.size) await orgRef.update({ clientCount: FieldValue.increment(-clients.size) })
  }
  return deleted
}

async function deleteClientTraces(db, adminAuth, orgRef, clientDoc) {
  const clientId = clientDoc.id
  const { clientAuthUid } = clientDoc.data()

  if (clientAuthUid) {
    await adminAuth.deleteUser(clientAuthUid).catch(err => {
      if (err.code !== 'auth/user-not-found') throw err
    })
    await db.doc(`users/${clientAuthUid}`).delete()
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
