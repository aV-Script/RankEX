import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }       from 'firebase-admin/firestore'
import { requireOrgAccess }   from '../shared/auth.js'
import { TESTS_META }         from '../shared/testsMeta.js'

const REGION = 'europe-west1'

export const aggiungiObiettivo = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, testKey, testLabel, targetPercentile, deadline, note = '' } = request.data

  if (!orgId || !clientId || !testKey || !deadline) {
    throw new HttpsError('invalid-argument', 'orgId, clientId, testKey e deadline sono obbligatori')
  }
  const target = Number(targetPercentile)
  if (isNaN(target) || target < 1 || target > 100) {
    throw new HttpsError('invalid-argument', 'targetPercentile deve essere un numero tra 1 e 100')
  }
  if (!TESTS_META.some(t => t.key === testKey)) {
    throw new HttpsError('invalid-argument', 'testKey sconosciuto')
  }

  const profile = await requireOrgAccess(request, orgId)

  const db      = getFirestore()
  const goalRef = db.collection(`organizations/${orgId}/clients/${clientId}/goals`).doc()

  const goalData = {
    testKey,
    testLabel:        testLabel ?? testKey, // denormalizzato dal client — il BE non ha label/unit (vedi testsMeta.js)
    targetPercentile: target,
    deadline,
    note:              note.trim(),
    status:            'active',
    createdAt:         new Date().toISOString(),
    createdBy:         profile.uid,
    achievedAt:        null,
    achievedPercentile: null,
  }

  await goalRef.set(goalData)

  return { id: goalRef.id, ...goalData }
})
