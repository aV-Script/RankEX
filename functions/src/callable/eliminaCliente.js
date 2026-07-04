import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth }          from 'firebase-admin/auth'
import { requireOrgAccess } from '../shared/auth.js'

const REGION = 'europe-west1'

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

  const clientData  = clientDoc.data()
  const clientAuthUid = clientData.clientAuthUid ?? null

  // Rimuove il cliente da tutti i gruppi
  const groupsSnap = await db.collection(`organizations/${orgId}/groups`).get()
  const groupsToUpdate = groupsSnap.docs.filter(g => {
    const ids = g.data().clientIds ?? []
    return ids.includes(clientId)
  })

  const batch = db.batch()

  // Delete cliente
  batch.delete(clientRef)

  // Delete users/{clientAuthUid} se esiste
  if (clientAuthUid) {
    batch.delete(db.doc(`users/${clientAuthUid}`))
  }

  // Decrementa clientCount
  batch.update(db.doc(`organizations/${orgId}`), {
    clientCount: FieldValue.increment(-1),
  })

  // Rimuovi clientId da tutti i gruppi
  groupsToUpdate.forEach(g => {
    const newIds = (g.data().clientIds ?? []).filter(id => id !== clientId)
    batch.update(g.ref, { clientIds: newIds })
  })

  await batch.commit()

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
