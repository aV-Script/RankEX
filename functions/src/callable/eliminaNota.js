import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }      from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'

const REGION = 'europe-west1'

export const eliminaNota = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, noteId } = request.data

  if (!orgId || !clientId || !noteId) {
    throw new HttpsError('invalid-argument', 'orgId, clientId e noteId sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const db = getFirestore()

  // Legge tutte le note del cliente e filtra quelle da eliminare (cascade)
  const notesSnap = await db.collection(`organizations/${orgId}/clients/${clientId}/notes`).get()
  const toDelete  = notesSnap.docs.filter(d => d.id === noteId || d.data().parentId === noteId)

  if (toDelete.length === 0) return { ok: true, deleted: 0 }

  const batch = db.batch()
  toDelete.forEach(d => batch.delete(d.ref))
  await batch.commit()

  return { ok: true, deleted: toDelete.length }
})
