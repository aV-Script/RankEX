import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }      from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'
import { pickAllowed, optionalTargetSessions } from '../shared/validate.js'
import { MAX_PLAN_SESSIONS } from '../shared/constants.js'

const REGION = 'europe-west1'

export const aggiornaSchedaAllenamento = onCall({ region: REGION }, async (request) => {
  const { orgId, planId, data } = request.data

  if (!orgId || !planId || !data) {
    throw new HttpsError('invalid-argument', 'orgId, planId e data sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  // clientId escluso: una scheda non si sposta su un altro cliente con un update.
  // completedSessions/completedAt esclusi: li scrive solo chiudiSessione.
  const update = pickAllowed(data, ['title', 'description', 'days', 'status', 'targetSessions'])
  if ('targetSessions' in update) update.targetSessions = optionalTargetSessions(update.targetSessions, MAX_PLAN_SESSIONS)
  if (!Object.keys(update).length) throw new HttpsError('invalid-argument', 'Nessun campo aggiornabile')
  if ('status' in update && !['active', 'archived'].includes(update.status)) {
    throw new HttpsError('invalid-argument', 'status non valido')
  }
  if ('days' in update && (!Array.isArray(update.days) || update.days.length > 7)) {
    throw new HttpsError('invalid-argument', 'days deve essere una lista di massimo 7 giorni')
  }

  const db = getFirestore()
  await db.doc(`organizations/${orgId}/workoutPlans/${planId}`).update({
    ...update,
    updatedAt: new Date().toISOString(),
  })

  return { ok: true }
})
