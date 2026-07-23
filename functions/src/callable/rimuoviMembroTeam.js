import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth }           from 'firebase-admin/auth'
import { requireOrgAdmin }   from '../shared/auth.js'

const REGION = 'europe-west1'

export const rimuoviMembroTeam = onCall({ region: REGION }, async (request) => {
  const { orgId, uid } = request.data

  if (!orgId || !uid) {
    throw new HttpsError('invalid-argument', 'orgId e uid sono obbligatori')
  }

  await requireOrgAdmin(request, orgId)

  const db    = getFirestore()
  const batch = db.batch()

  batch.delete(db.doc(`organizations/${orgId}/members/${uid}`))
  batch.delete(db.doc(`users/${uid}`))
  batch.update(db.doc(`organizations/${orgId}`), {
    memberCount: FieldValue.increment(-1),
  })

  await batch.commit()

  // Elimina account Firebase Auth (fire and forget)
  try {
    await getAuth().deleteUser(uid)
  } catch {
    // Ignora se l'utente non esiste in Auth
  }

  return { ok: true }
})
