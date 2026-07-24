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

  // Solo il trainer/org_admin inserisce note — i client leggono soltanto
  if (profile.role === 'client') {
    throw new HttpsError('permission-denied', 'I client non possono aggiungere note')
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
