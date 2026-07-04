import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }      from 'firebase-admin/firestore'
import { requireOrgAdmin }   from '../shared/auth.js'

const REGION = 'europe-west1'

const ALLOWED_ROLES = ['org_admin', 'trainer', 'staff_readonly']

export const aggiornaRuoloMembro = onCall({ region: REGION }, async (request) => {
  const { orgId, uid, role } = request.data

  if (!orgId || !uid || !role) {
    throw new HttpsError('invalid-argument', 'orgId, uid e role sono obbligatori')
  }

  if (!ALLOWED_ROLES.includes(role)) {
    throw new HttpsError('invalid-argument', `Ruolo non valido: ${role}. Valori consentiti: ${ALLOWED_ROLES.join(', ')}`)
  }

  await requireOrgAdmin(request, orgId)

  const db    = getFirestore()
  const batch = db.batch()

  batch.update(db.doc(`organizations/${orgId}/members/${uid}`), { role })
  batch.update(db.doc(`users/${uid}`), { role })

  await batch.commit()

  return { ok: true }
})
