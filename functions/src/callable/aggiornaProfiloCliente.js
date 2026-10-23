import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }  from 'firebase-admin/firestore'
import { requireOrgAccess } from '../shared/auth.js'
import { buildProfileUpgrade } from '../shared/gamification.js'
import { requireId } from '../shared/validate.js'

const REGION = 'europe-west1'
const PROFILE_TYPES = ['tests_only', 'bia_only', 'complete']

export const aggiornaProfiloCliente = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, newProfileType } = request.data
  await requireOrgAccess(request, orgId)
  requireId(clientId, 'clientId')
  if (!PROFILE_TYPES.includes(newProfileType)) {
    throw new HttpsError('invalid-argument', 'newProfileType non valido')
  }

  const db = getFirestore()
  const clientRef = db.doc(`organizations/${orgId}/clients/${clientId}`)

  // Transazione: legge stats/biaHistory/log e li riscrive (vedi salvaXP).
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(clientRef)
    if (!snap.exists) throw new HttpsError('not-found', 'Cliente non trovato')

    const client = { id: clientId, ...snap.data() }
    tx.update(clientRef, buildProfileUpgrade(client, newProfileType))

    if (client.clientAuthUid) {
      tx.set(db.collection(`organizations/${orgId}/notifications`).doc(), {
        clientId,
        message:   'Il tuo profilo è stato aggiornato dal trainer.',
        date:      new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
        type:      'upgrade',
        read:      false,
        createdAt: new Date().toISOString(),
      })
    }
  })

  return { ok: true }
})
