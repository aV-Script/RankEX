import { onCall }        from 'firebase-functions/v2/https'
import { getFirestore }  from 'firebase-admin/firestore'
import { requireOrgAccess } from '../shared/auth.js'
import { buildCampionamentoUpdate } from '../shared/gamification.js'

const REGION = 'europe-west1'

export const salvaCampionamento = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, newStats, testValues } = request.data
  await requireOrgAccess(request, orgId)

  const db = getFirestore()
  const clientRef = db.doc(`organizations/${orgId}/clients/${clientId}`)
  const snap = await clientRef.get()
  if (!snap.exists) throw new Error('Cliente non trovato')

  const client = { id: clientId, ...snap.data() }
  const { update } = buildCampionamentoUpdate(client, newStats, testValues)

  const batch = db.batch()
  batch.update(clientRef, update)

  if (client.clientAuthUid) {
    const isFirst     = !client.campionamenti?.length
    const rankChanged = !isFirst && update.rank !== client.rank
    const xpGain      = update.log?.[0]?.xp ?? 0
    const message = isFirst
      ? 'Primo campionamento registrato!'
      : rankChanged
        ? `Campionamento registrato — rank aggiornato: ${client.rank} → ${update.rank}`
        : `Campionamento registrato (+${xpGain} XP)`

    batch.set(db.collection(`organizations/${orgId}/notifications`).doc(), {
      clientId,
      message,
      date:      new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
      type:      rankChanged ? 'rank' : 'xp',
      read:      false,
      createdAt: new Date().toISOString(),
    })
  }

  await batch.commit()
  return { ok: true, rank: update.rank, xpGain: update.log?.[0]?.xp ?? 0 }
})
