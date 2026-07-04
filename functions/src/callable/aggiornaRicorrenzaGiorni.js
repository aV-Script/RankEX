import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }      from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'

const REGION = 'europe-west1'

export const aggiornaRicorrenzaGiorni = onCall({ region: REGION }, async (request) => {
  const { orgId, recurrenceId, days } = request.data

  if (!orgId || !recurrenceId || !days) {
    throw new HttpsError('invalid-argument', 'orgId, recurrenceId e days sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const db = getFirestore()
  await db.doc(`organizations/${orgId}/recurrences/${recurrenceId}`).update({ days })

  return { ok: true }
})
