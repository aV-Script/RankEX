import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }      from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'

const REGION = 'europe-west1'

export const aggiungiGruppo = onCall({ region: REGION }, async (request) => {
  const { orgId, name } = request.data

  if (!orgId || !name) {
    throw new HttpsError('invalid-argument', 'orgId e name sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const db     = getFirestore()
  const newRef = db.collection(`organizations/${orgId}/groups`).doc()

  await newRef.set({ name, clientIds: [] })

  return { id: newRef.id }
})
