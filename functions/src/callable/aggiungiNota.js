import { onCall, HttpsError }       from 'firebase-functions/v2/https'
import { getFirestore }             from 'firebase-admin/firestore'
import { requireOrgMemberOrClient } from '../shared/auth.js'

const REGION = 'europe-west1'

export const aggiungiNota = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, text, parentId = null } = request.data

  if (!orgId || !clientId || !text) {
    throw new HttpsError('invalid-argument', 'orgId, clientId e text sono obbligatori')
  }

  const profile = await requireOrgMemberOrClient(request, orgId)

  // staff_readonly non può scrivere
  if (profile.role === 'staff_readonly') {
    throw new HttpsError('permission-denied', 'Utenti in sola lettura non possono aggiungere note')
  }

  // I client possono solo commentare (parentId deve essere non-null)
  if (profile.role === 'client' && !parentId) {
    throw new HttpsError('permission-denied', 'I client possono solo aggiungere commenti a thread esistenti')
  }

  const db        = getFirestore()
  const createdAt = new Date().toISOString()
  const noteRef   = db.collection(`organizations/${orgId}/clients/${clientId}/notes`).doc()

  const noteData = {
    text:       text.trim(),
    authorId:   profile.uid,
    authorName: profile.name ?? profile.email ?? profile.uid,
    authorRole: profile.role,
    parentId:   parentId ?? null,
    createdAt,
  }

  await noteRef.set(noteData)

  return { id: noteRef.id, ...noteData }
})
