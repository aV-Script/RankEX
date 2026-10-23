import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }      from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'
import { pickAllowed, assertIdsInData, optionalString } from '../shared/validate.js'

const REGION = 'europe-west1'

export const aggiornaGruppo = onCall({ region: REGION }, async (request) => {
  const { orgId, groupId, data } = request.data

  if (!orgId || !groupId || !data) {
    throw new HttpsError('invalid-argument', 'orgId, groupId e data sono obbligatori')
  }

  await requireOrgAccess(request, orgId)

  const update = pickAllowed(data, ['name', 'clientIds'])
  if (!Object.keys(update).length) throw new HttpsError('invalid-argument', 'Nessun campo aggiornabile')
  if ('name' in update) update.name = optionalString(update.name, 'name', 100).trim()
  assertIdsInData(update)

  const db = getFirestore()
  await db.doc(`organizations/${orgId}/groups/${groupId}`).update(update)

  return { ok: true }
})
