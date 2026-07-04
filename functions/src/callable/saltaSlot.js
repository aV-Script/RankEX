import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }      from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'

const REGION = 'europe-west1'

export const saltaSlot = onCall({ region: REGION }, async (request) => {
  const { orgId, slotId } = request.data

  if (!orgId || !slotId) {
    throw new HttpsError('invalid-argument', 'orgId e slotId sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const db = getFirestore()
  await db.doc(`organizations/${orgId}/slots/${slotId}`).update({
    status:    'skipped',
    attendees: [],
    absentees: [],
  })

  return { ok: true }
})
