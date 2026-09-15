import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth }          from 'firebase-admin/auth'
import { requireOrgAccess } from '../shared/auth.js'

const REGION = 'europe-west1'

// Margine sotto il limite Firestore di 500 operazioni per batch (STORY-016/EPIC-007)
// — lascia spazio per non dover mai avvicinarsi al limite esatto.
const BATCH_CHUNK_SIZE = 450

export const eliminaCliente = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId } = request.data

  if (!orgId || !clientId) {
    throw new HttpsError('invalid-argument', 'orgId e clientId sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const db        = getFirestore()
  const clientRef = db.doc(`organizations/${orgId}/clients/${clientId}`)
  const clientDoc = await clientRef.get()

  if (!clientDoc.exists) {
    throw new HttpsError('not-found', 'Cliente non trovato')
  }

  const clientData    = clientDoc.data()
  const clientAuthUid = clientData.clientAuthUid ?? null

  // ── Cascade delete completo (STORY-016/EPIC-007) ──────────────────────────
  // Diritto alla cancellazione: nessun dato personale orfano dopo l'eliminazione
  // di un cliente (note libere, obiettivi, riferimenti in slot/ricorrenze/
  // notifiche/schede — vedi docs/BACKLOG.md → STORY-016).
  //
  // Ordine deliberato (code review STORY-016): il delete "core" — cliente,
  // users/{uid}, decremento clientCount — va per PRIMO, come batch atomico a
  // sé, prima di recursiveDelete e della pulizia referenziale. Se una fase
  // successiva fallisce (rete, un chunk oltre il primo su un cliente con molto
  // storico), lo stato peggiore possibile è "cliente cancellato ma qualche
  // riferimento residuo in slot/notifiche" — non l'opposto ("cliente ancora
  // presente ma note/obiettivi già spariti per sempre"), che è il vero rischio
  // per un'operazione il cui scopo è il diritto alla cancellazione.
  const coreBatch = db.batch()
  coreBatch.delete(clientRef)
  if (clientAuthUid) {
    coreBatch.delete(db.doc(`users/${clientAuthUid}`))
  }
  coreBatch.update(db.doc(`organizations/${orgId}`), {
    clientCount: FieldValue.increment(-1),
  })
  await coreBatch.commit()

  // notes/ e goals/ sono interamente del cliente — recursiveDelete gestisce
  // internamente dimensioni arbitrarie (BulkWriter), nessun limite 500.
  await db.recursiveDelete(clientRef.collection('notes'))
  await db.recursiveDelete(clientRef.collection('goals'))

  // Rimuove il cliente da tutti i gruppi
  const groupsSnap = await db.collection(`organizations/${orgId}/groups`).get()
  const groupsToUpdate = groupsSnap.docs.filter(g => (g.data().clientIds ?? []).includes(clientId))

  // slots — clientIds/attendees/absentees sono tre array indipendenti,
  // Firestore non supporta OR tra campi diversi in una query: tre
  // array-contains separate, poi dedup sui doc id (un cliente può comparire
  // in più di uno dei tre array sullo stesso slot).
  const slotsCollection = db.collection(`organizations/${orgId}/slots`)
  const [slotsByClientIds, slotsByAttendees, slotsByAbsentees] = await Promise.all([
    slotsCollection.where('clientIds', 'array-contains', clientId).get(),
    slotsCollection.where('attendees', 'array-contains', clientId).get(),
    slotsCollection.where('absentees', 'array-contains', clientId).get(),
  ])
  const slotDocsById = new Map()
  ;[...slotsByClientIds.docs, ...slotsByAttendees.docs, ...slotsByAbsentees.docs].forEach(doc => {
    slotDocsById.set(doc.id, doc)
  })

  // recurrences — array-contains su clientIds
  const recurrencesSnap = await db.collection(`organizations/${orgId}/recurrences`)
    .where('clientIds', 'array-contains', clientId)
    .get()

  // notifications e workoutPlans del cliente — eliminazione intera del
  // documento (non solo rimozione del riferimento). workoutPlans va
  // cancellata, non archiviata (decisione esplicita Tech Lead, vedi
  // docs/BACKLOG.md → STORY-016: archiviare lascerebbe dati personali
  // orfani senza UI che li mostri mai più).
  const [notificationsSnap, workoutPlansSnap] = await Promise.all([
    db.collection(`organizations/${orgId}/notifications`).where('clientId', '==', clientId).get(),
    db.collection(`organizations/${orgId}/workoutPlans`).where('clientId', '==', clientId).get(),
  ])

  // Costruisce la lista delle operazioni di pulizia referenziale rimanenti
  // (slots/recurrences condivisi con altri client, non cancellabili per
  // intero — a differenza di notes/goals), poi le esegue a chunk di
  // BATCH_CHUNK_SIZE con db.batch(), stesso stile già usato nel resto delle
  // callable (niente BulkWriter qui). Le operazioni "core" (cliente,
  // users/{uid}, clientCount) sono già state committate sopra, per prime.
  const ops = []

  groupsToUpdate.forEach(g => {
    const newIds = (g.data().clientIds ?? []).filter(id => id !== clientId)
    ops.push({ ref: g.ref, type: 'update', data: { clientIds: newIds } })
  })

  slotDocsById.forEach(slotDoc => {
    const data   = slotDoc.data()
    const update = {}
    if (Array.isArray(data.clientIds)) update.clientIds = data.clientIds.filter(id => id !== clientId)
    if (Array.isArray(data.attendees)) update.attendees = data.attendees.filter(id => id !== clientId)
    if (Array.isArray(data.absentees)) update.absentees = data.absentees.filter(id => id !== clientId)
    ops.push({ ref: slotDoc.ref, type: 'update', data: update })
  })

  recurrencesSnap.docs.forEach(recDoc => {
    const newIds = (recDoc.data().clientIds ?? []).filter(id => id !== clientId)
    ops.push({ ref: recDoc.ref, type: 'update', data: { clientIds: newIds } })
  })

  notificationsSnap.docs.forEach(notifDoc => {
    ops.push({ ref: notifDoc.ref, type: 'delete' })
  })

  workoutPlansSnap.docs.forEach(planDoc => {
    ops.push({ ref: planDoc.ref, type: 'delete' })
  })

  for (let i = 0; i < ops.length; i += BATCH_CHUNK_SIZE) {
    const chunk = ops.slice(i, i + BATCH_CHUNK_SIZE)
    const batch = db.batch()
    chunk.forEach(op => {
      if (op.type === 'delete') {
        batch.delete(op.ref)
      } else {
        batch.update(op.ref, op.data)
      }
    })
    await batch.commit()
  }

  // Elimina l'account Firebase Auth (fire and forget con try/catch)
  if (clientAuthUid) {
    try {
      await getAuth().deleteUser(clientAuthUid)
    } catch {
      // Ignora se l'utente non esiste in Auth
    }
  }

  return { ok: true }
})
