import { onCall, HttpsError }        from 'firebase-functions/v2/https'
import { getFirestore }              from 'firebase-admin/firestore'
import { requireOrgMemberOrClient }  from '../shared/auth.js'
import { getUnlockRuleForAvatarId }  from '../shared/avatarUnlocks.js'

const REGION = 'europe-west1'

/**
 * Acquisto avatar nel negozio — spike EPIC-005 (vedi docs/DECISIONS.md → ADR-002).
 * Solo il cliente acquista per sé stesso (mai un trainer per conto suo — evita
 * ambiguità su chi paga). Transazione Firestore (non batch): scalare Monete e
 * sbloccare un pezzo è un'operazione a rischio race-condition su doppio tap,
 * serve atomicità reale con lettura+scrittura nella stessa transazione.
 */
export const acquistaAvatar = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, avatarId } = request.data

  if (!orgId || !clientId || !avatarId) {
    throw new HttpsError('invalid-argument', 'orgId, clientId e avatarId sono obbligatori')
  }

  const profile = await requireOrgMemberOrClient(request, orgId)
  if (profile.role !== 'client' || profile.clientId !== clientId) {
    throw new HttpsError('permission-denied', 'Solo il cliente può acquistare per sé stesso')
  }

  const rule = getUnlockRuleForAvatarId(avatarId)
  if (rule.unlockType !== 'purchase') {
    throw new HttpsError('failed-precondition', 'Questo avatar non è acquistabile')
  }

  const db        = getFirestore()
  const clientRef = db.doc(`organizations/${orgId}/clients/${clientId}`)

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(clientRef)
    if (!snap.exists) throw new HttpsError('not-found', 'Cliente non trovato')

    const client    = snap.data()
    const purchased = client.avatarPurchased ?? []
    if (purchased.includes(avatarId)) {
      throw new HttpsError('already-exists', 'Avatar già acquistato')
    }

    const coins = client.coins ?? 0
    if (coins < rule.price) {
      throw new HttpsError('failed-precondition', 'Monete insufficienti')
    }

    const newCoins = coins - rule.price
    tx.update(clientRef, {
      coins:           newCoins,
      avatarPurchased: [...purchased, avatarId],
    })

    return { ok: true, coins: newCoins }
  })
})
