import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }  from 'firebase-admin/firestore'
import { requireOrgAccess } from '../shared/auth.js'
import { buildXPUpdate } from '../shared/gamification.js'
import { requireId, requireNumber, optionalString } from '../shared/validate.js'
import { getOrgCapabilities, requireCapability } from '../shared/orgModule.js'

const REGION = 'europe-west1'
const MAX_XP_PER_CALL = 1000

export const salvaXP = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, xpToAdd, note } = request.data
  await requireOrgAccess(request, orgId)
  requireId(clientId, 'clientId')
  requireNumber(xpToAdd, 'xpToAdd', { min: 1, max: MAX_XP_PER_CALL, integer: true })
  const safeNote = optionalString(note, 'note', 200)

  const db = getFirestore()
  // Moduli senza gamification (lipedema): nessun XP, nemmeno con chiamata diretta (ADR-008)
  requireCapability(await getOrgCapabilities(db, orgId), 'hasGamification')
  const clientRef = db.doc(`organizations/${orgId}/clients/${clientId}`)

  // Transazione: legge xp/log e li riscrive. Con lettura e scrittura separate due
  // salvataggi concorrenti sullo stesso cliente perdevano XP o voci di log.
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(clientRef)
    if (!snap.exists) throw new HttpsError('not-found', 'Cliente non trovato')

    const client = { id: clientId, ...snap.data() }
    const { update } = buildXPUpdate(client, xpToAdd, safeNote)
    tx.update(clientRef, update)

    if (client.clientAuthUid) {
      tx.set(db.collection(`organizations/${orgId}/notifications`).doc(), {
        clientId,
        message:   `Hai guadagnato ${xpToAdd} XP — ${safeNote || 'aggiunto dal trainer'}!`,
        date:      new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
        type:      'xp',
        read:      false,
        createdAt: new Date().toISOString(),
      })
    }
  })

  return { ok: true }
})
