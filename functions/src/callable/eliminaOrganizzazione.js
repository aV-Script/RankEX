import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }       from 'firebase-admin/firestore'
import { getAuth }            from 'firebase-admin/auth'
import { requireRole }        from '../shared/auth.js'

const REGION = 'europe-west1'
// Limite di getAuth().deleteUsers() per singola chiamata
const AUTH_DELETE_CHUNK = 1000
const BATCH_LIMIT       = 450

/**
 * Cancella un'intera organizzazione: account Auth di staff e clienti, i loro
 * /users/{uid}, e l'org con tutte le subcollection (clienti, note, obiettivi,
 * membri, slot, gruppi, ricorrenze, notifiche, schede).
 * Promessa del DPA a fine contratto — solo super_admin.
 *
 * Ordine scelto per poter rilanciare la funzione se si interrompe a metà:
 * prima gli account (nessuno può più entrare), poi /users, per ultimo il
 * documento org, che serve a ritrovare tutto il resto.
 */
export const eliminaOrganizzazione = onCall({ region: REGION, timeoutSeconds: 540 }, async (request) => {
  const caller = await requireRole(request, ['super_admin'])
  const { orgId, confirmName } = request.data ?? {}

  if (!orgId) throw new HttpsError('invalid-argument', 'orgId è obbligatorio')

  const db      = getFirestore()
  const orgRef  = db.doc(`organizations/${orgId}`)
  const orgSnap = await orgRef.get()
  if (!orgSnap.exists) throw new HttpsError('not-found', 'Organizzazione non trovata')

  // Seconda conferma lato server: il nome digitato deve corrispondere, così un
  // orgId sbagliato passato per errore non cancella l'org di qualcun altro.
  const orgName = orgSnap.data().name ?? ''
  if (typeof confirmName !== 'string' || confirmName.trim() !== orgName.trim()) {
    throw new HttpsError('failed-precondition', 'Il nome di conferma non corrisponde')
  }

  const [membersSnap, clientsSnap, usersSnap] = await Promise.all([
    orgRef.collection('members').get(),
    orgRef.collection('clients').get(),
    db.collection('users').where('orgId', '==', orgId).get(),
  ])

  // Mai cancellare un super_admin (es. l'owner registrato alla creazione dell'org)
  const protectedUids = new Set(
    usersSnap.docs.filter(d => d.data().role === 'super_admin').map(d => d.id),
  )
  protectedUids.add(caller.uid)

  const uids = new Set([
    ...membersSnap.docs.map(d => d.id),
    ...clientsSnap.docs.map(d => d.data().clientAuthUid).filter(Boolean),
    ...usersSnap.docs.map(d => d.id),
  ])
  for (const uid of protectedUids) uids.delete(uid)
  const uidList = [...uids]

  let authDeleted = 0
  const authErrors = []
  for (let i = 0; i < uidList.length; i += AUTH_DELETE_CHUNK) {
    const chunk  = uidList.slice(i, i + AUTH_DELETE_CHUNK)
    const result = await getAuth().deleteUsers(chunk)
    authDeleted += result.successCount
    // deleteUsers non segnala come errore un utente già inesistente
    for (const e of result.errors) authErrors.push(chunk[e.index])
  }
  if (authErrors.length) {
    console.error('eliminaOrganizzazione: account non cancellati', orgId, authErrors)
    throw new HttpsError('internal', `${authErrors.length} account non cancellati: riprova`)
  }

  for (let i = 0; i < uidList.length; i += BATCH_LIMIT) {
    const batch = db.batch()
    for (const uid of uidList.slice(i, i + BATCH_LIMIT)) batch.delete(db.doc(`users/${uid}`))
    await batch.commit()
  }

  await db.recursiveDelete(orgRef)

  return {
    ok:       true,
    accounts: authDeleted,
    members:  membersSnap.size,
    clients:  clientsSnap.size,
  }
})
