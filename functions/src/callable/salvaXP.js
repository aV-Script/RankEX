import { onCall }        from 'firebase-functions/v2/https'
import { getFirestore }  from 'firebase-admin/firestore'
import { requireOrgAccess } from '../shared/auth.js'
import { buildXPUpdate } from '../shared/gamification.js'

const REGION = 'europe-west1'

export const salvaXP = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, xpToAdd, note } = request.data
  await requireOrgAccess(request, orgId)

  const db = getFirestore()
  const clientRef = db.doc(`organizations/${orgId}/clients/${clientId}`)
  const snap = await clientRef.get()
  if (!snap.exists) throw new Error('Cliente non trovato')

  const client = { id: clientId, ...snap.data() }
  const { update } = buildXPUpdate(client, xpToAdd, note)

  const batch = db.batch()
  batch.update(clientRef, update)

  if (client.clientAuthUid) {
    batch.set(db.collection(`organizations/${orgId}/notifications`).doc(), {
      clientId,
      message:   `Hai guadagnato ${xpToAdd} XP — ${note || 'aggiunto dal trainer'}!`,
      date:      new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
      type:      'xp',
      read:      false,
      createdAt: new Date().toISOString(),
    })
  }

  await batch.commit()
  return { ok: true }
})
