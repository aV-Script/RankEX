/**
 * Pulizia dei dati creati dagli spec QA (STORY-041): solo clienti/pazienti delle org
 * qa-* il cui nome inizia con E2E_PREFIX, con quanto li riguarda. Admin SDK, perché
 * le valutazioni sono immutabili dal client. Mai fuori da rankex-dev: il service
 * account è verificato da loadDevServiceAccount prima di arrivare qui.
 */
import { FieldValue } from 'firebase-admin/firestore'
import { E2E_PREFIX, QA_ORGS, E2E_FIXTURES_MODULE, assertDevFirestore } from './qaDev.config.js'
import { e2eSlotDate } from './slotFixtureDate.js'

// '\uf8ff' (ultimo code point BMP d'uso comune): name >= 'E2E-' && name < 'E2E-\uf8ff'
// equivale a "inizia con E2E-". Scritto come escape: il carattere è invisibile
const PREFIX_END = `${E2E_PREFIX}\uf8ff`

// Orario insolito: aggiungiSlot unisce gli slot con stessa data+ora, qui non deve mai capitare
const E2E_SLOT_START = '06:30'
const E2E_SLOT_END   = '07:15'

// Formato esatto di gruppi e slot creati da createE2EFixtures (runId = Date.now() in base 36):
// il ricontrollo in memoria \u00e8 pi\u00f9 stretto del solo prefisso, per non toccare dati altrui
const E2E_GROUP_NAME_PATTERN  = /^E2E-gruppo-[A-Za-z0-9]+$/
const E2E_SLOT_MARKER_PATTERN = /^E2E-slot-[A-Za-z0-9]+$/

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

/**
 * Gruppo e slot E2E creati dal setup per i casi di sola lettura (Sprint #18 voce 1c).
 * Marker: il gruppo ha il nome con prefisso E2E-; lo slot non ha un nome, quindi porta
 * `e2eMarker` (stringa con prefisso E2E-, solo sui dati di test: la UI e le rules lo ignorano,
 * l'Admin SDK scrive comunque). Nell'org del modulo E2E_FIXTURES_MODULE.
 * @returns {Promise<{ groupId: string, slotId: string, ... }>}
 */
export async function createE2EFixtures(db, runId) {
  assertDevFirestore(db)
  const org = QA_ORGS[E2E_FIXTURES_MODULE]
  const orgRef = db.doc(`organizations/${org.orgId}`)

  const baseClients = await orgRef.collection('clients').where('name', '==', org.baseClient.name).limit(1).get()
  if (baseClients.empty) throw new Error(`Cliente di base "${org.baseClient.name}" non trovato in ${org.orgId}: lancia npm run qa:dev:seed`)
  const clientId = baseClients.docs[0].id

  // Ieri (data di Roma): è passato, quindi al trainer compare anche SEGNA COME SALTATA. Di lunedì
  // cade nella settimana precedente (l'app parte da lunedì): lo spec lo sa con isSlotInPreviousAppWeek
  const date = e2eSlotDate(new Date())

  const groupName = `${E2E_PREFIX}gruppo-${runId}`
  const groupRef  = await orgRef.collection('groups').add({ name: groupName, clientIds: [clientId] })
  const slotRef   = await orgRef.collection('slots').add({
    date, startTime: E2E_SLOT_START, endTime: E2E_SLOT_END,
    clientIds: [clientId], groupIds: [groupRef.id],
    status: 'planned', attendees: [], absentees: [], recurrenceId: null,
    createdAt: new Date().toISOString(),
    e2eMarker: `${E2E_PREFIX}slot-${runId}`,
  })

  return {
    orgId: org.orgId, clientId, clientName: org.baseClient.name,
    groupId: groupRef.id, groupName,
    slotId: slotRef.id, slotDate: date, slotStart: E2E_SLOT_START, slotEnd: E2E_SLOT_END,
  }
}

/** Cancella gruppi (per nome) e slot (per e2eMarker) E2E- di tutte le org qa-*. @returns {Promise<number>} */
export async function cleanupE2EFixtures(db) {
  assertDevFirestore(db)
  let deleted = 0
  for (const { orgId } of Object.values(QA_ORGS)) {
    const orgRef = db.doc(`organizations/${orgId}`)
    const groups = await orgRef.collection('groups')
      .where('name', '>=', E2E_PREFIX).where('name', '<', PREFIX_END).get()
    const slots  = await orgRef.collection('slots')
      .where('e2eMarker', '>=', E2E_PREFIX).where('e2eMarker', '<', PREFIX_END).get()
    // Ricontrollo in memoria del formato esatto, come per i clienti
    const toDelete = [
      ...groups.docs.filter(doc => E2E_GROUP_NAME_PATTERN.test(String(doc.data().name ?? ''))),
      ...slots.docs.filter(doc => E2E_SLOT_MARKER_PATTERN.test(String(doc.data().e2eMarker ?? ''))),
    ]
    for (const doc of toDelete) await doc.ref.delete()
    deleted += toDelete.length
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
