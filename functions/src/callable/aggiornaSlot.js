import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }      from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'
import { pickAllowed, assertIdsInData } from '../shared/validate.js'

const REGION = 'europe-west1'

export const aggiornaSlot = onCall({ region: REGION }, async (request) => {
  const { orgId, slotId, data } = request.data

  if (!orgId || !slotId || !data) {
    throw new HttpsError('invalid-argument', 'orgId, slotId e data sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  // Solo i campi di pianificazione: stato, presenti e assenti li scrivono
  // chiudiSessione / saltaSlot, che assegnano anche XP e streak.
  const update = pickAllowed(data, ['date', 'startTime', 'endTime', 'clientIds', 'groupIds'])
  if (!Object.keys(update).length) throw new HttpsError('invalid-argument', 'Nessun campo aggiornabile')
  assertIdsInData(update)

  const db = getFirestore()
  await db.doc(`organizations/${orgId}/slots/${slotId}`).update(update)

  return { ok: true }
})
