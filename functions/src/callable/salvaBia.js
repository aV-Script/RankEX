import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }  from 'firebase-admin/firestore'
import { requireOrgAccess } from '../shared/auth.js'
import { buildBiaUpdate } from '../shared/gamification.js'
import { requireId, pickAllowed } from '../shared/validate.js'
import { getOrgCapabilities } from '../shared/orgModule.js'

const REGION = 'europe-west1'

// Parametri di una misurazione BIA (constants/bia.js → BIA_PARAMS)
const BIA_FIELDS = [
  'fatMassPercent', 'muscleMassKg', 'waterPercent', 'boneMassKg',
  'bmi', 'bmrKcal', 'metabolicAge', 'visceralFat',
]

function sanitizeBia(biaData) {
  const bia = pickAllowed(biaData, BIA_FIELDS)
  for (const [key, value] of Object.entries(bia)) {
    if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) {
      throw new HttpsError('invalid-argument', `${key} deve essere un numero positivo`)
    }
  }
  return bia
}

export const salvaBia = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, biaData } = request.data
  await requireOrgAccess(request, orgId)
  requireId(clientId, 'clientId')
  const bia = sanitizeBia(biaData)

  const db = getFirestore()
  const clientRef = db.doc(`organizations/${orgId}/clients/${clientId}`)
  const capabilities = await getOrgCapabilities(db, orgId)

  // Transazione: legge storico BIA/xp/log e li riscrive (vedi salvaXP).
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(clientRef)
    if (!snap.exists) throw new HttpsError('not-found', 'Cliente non trovato')

    const client = { id: clientId, ...snap.data() }
    const built  = buildBiaUpdate(client, bia)
    const { isFirstMeasurement } = built

    // Senza gamification (lipedema) si salva solo la misurazione: niente xp,
    // livello, log né notifica XP (ADR-008)
    if (!capabilities.hasGamification) {
      const { lastBia, biaHistory } = built.update
      tx.update(clientRef, { lastBia, biaHistory })
      return { ok: true, xpEarned: 0, isFirstMeasurement }
    }

    const { update, xpEarned } = built
    tx.update(clientRef, update)

    if (client.clientAuthUid && xpEarned > 0) {
      tx.set(db.collection(`organizations/${orgId}/notifications`).doc(), {
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

    return { ok: true, xpEarned, isFirstMeasurement }
  })
})
