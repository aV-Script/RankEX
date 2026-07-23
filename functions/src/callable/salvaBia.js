import { onCall }        from 'firebase-functions/v2/https'
import { getFirestore }  from 'firebase-admin/firestore'
import { requireOrgAccess } from '../shared/auth.js'
import { buildBiaUpdate } from '../shared/gamification.js'

const REGION = 'europe-west1'

export const salvaBia = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, biaData } = request.data
  await requireOrgAccess(request, orgId)

  const db = getFirestore()
  const clientRef = db.doc(`organizations/${orgId}/clients/${clientId}`)
  const snap = await clientRef.get()
  if (!snap.exists) throw new Error('Cliente non trovato')

  const client = { id: clientId, ...snap.data() }
  const { update, xpEarned, isFirstMeasurement } = buildBiaUpdate(client, biaData)

  const batch = db.batch()
  batch.update(clientRef, update)

  if (client.clientAuthUid && xpEarned > 0) {
    batch.set(db.collection(`organizations/${orgId}/notifications`).doc(), {
      clientId,
      message:   isFirstMeasurement
        ? `Prima misurazione BIA completata! +${xpEarned} XP`
        : `BIA aggiornata — +${xpEarned} XP guadagnati!`,
      date:      new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
      type:      'bia',
      read:      false,
      createdAt: new Date().toISOString(),
    })
  }

  await batch.commit()
  return { ok: true, xpEarned, isFirstMeasurement }
})
