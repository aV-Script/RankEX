/**
 * chiudiSessione — callable Cloud Function (Gen 2)
 *
 * Sostituisce closeSessionUseCase.js lato client.
 * Esegue in un'unica transazione server-side (idempotente: una seconda chiamata
 * sulla stessa sessione fallisce con failed-precondition):
 *   - slot.status = 'completed'
 *   - XP + streak + Monete (spike EPIC-005) per ogni attendee
 *   - streak reset per ogni assente
 *   - notifiche per tutti
 *
 * Chiamata dal client:
 *   const fn = httpsCallable(functions, 'chiudiSessione')
 *   await fn({ orgId, slotId, attendeeIds })
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { requireOrgAccess }  from '../shared/auth.js'
import { buildSessionUpdate, buildXPUpdate } from '../shared/gamification.js'
import { PLAN_COMPLETION_XP } from '../shared/constants.js'
import { autoBadgeFields }    from '../shared/badges.js'

const REGION = 'europe-west1'

// Spike EPIC-005 (docs/DECISIONS.md → ADR-002) — importo provvisorio, non
// un'economia bilanciata. Unica fonte di Monete implementata nello spike.
const COINS_PER_SESSION = 10
// Limite degli id per una query 'in'
const IN_QUERY_LIMIT = 30

export const chiudiSessione = onCall({ region: REGION }, async (request) => {
  const { orgId, slotId, attendeeIds } = request.data

  if (!orgId || !slotId || !Array.isArray(attendeeIds)) {
    throw new HttpsError('invalid-argument', 'orgId, slotId e attendeeIds sono richiesti')
  }

  await requireOrgAccess(request, orgId)

  const db         = getFirestore()
  const slotRef    = db.collection(`organizations/${orgId}/slots`).doc(slotId)
  const clientsCol = db.collection(`organizations/${orgId}/clients`)
  const notifCol   = db.collection(`organizations/${orgId}/notifications`)
  const plansCol   = db.collection(`organizations/${orgId}/workoutPlans`)
  const today      = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })

  // Transazione, non batch: il controllo "già chiusa" deve stare nella stessa
  // unità delle scritture. Con un batch due chiamate ravvicinate (doppio tap,
  // retry di rete) passavano entrambe il controllo e accreditavano XP e Monete
  // due volte. Firestore ritenta la transazione se lo slot cambia nel frattempo.
  return db.runTransaction(async (tx) => {
    const slotDoc = await tx.get(slotRef)
    if (!slotDoc.exists) throw new HttpsError('not-found', 'Slot non trovato')

    const slot = slotDoc.data()
    if (slot.status === 'completed') {
      throw new HttpsError('failed-precondition', 'Sessione già chiusa')
    }

    // Presenti = solo clienti dello slot, senza duplicati: un id ripetuto o
    // estraneo allo slot riceveva XP e Monete più volte, o senza essere iscritto.
    const allClientIds = slot.clientIds ?? []
    const presentIds   = [...new Set(attendeeIds)].filter(id => allClientIds.includes(id))
    const absenteeIds  = allClientIds.filter(id => !presentIds.includes(id))

    // Tutte le letture prima delle scritture (vincolo delle transazioni)
    const clientDocs = await Promise.all(
      [...presentIds, ...absenteeIds].map(id => tx.get(clientsCol.doc(id)))
    )
    const clientMap = {}
    clientDocs.forEach(d => { if (d.exists) clientMap[d.id] = { id: d.id, ...d.data() } })

    // Scheda attiva di ogni presente: la sessione la fa avanzare di uno
    const activePlans = {}
    for (let i = 0; i < presentIds.length; i += IN_QUERY_LIMIT) {
      const snap = await tx.get(plansCol.where('clientId', 'in', presentIds.slice(i, i + IN_QUERY_LIMIT)))
      snap.docs.forEach(d => {
        const plan = d.data()
        if (plan.status === 'active' && !activePlans[plan.clientId]) activePlans[plan.clientId] = { ref: d.ref, ...plan }
      })
    }

    tx.update(slotRef, {
      status:    'completed',
      attendees: presentIds,
      absentees: absenteeIds,
    })

    // ── Presenti: XP + streak + sessionCount ───────────────────────────────
    for (const clientId of presentIds) {
      const client = clientMap[clientId]
      if (!client) continue

      const session = buildSessionUpdate(client, client.baseXP ?? 50, 'Sessione di allenamento')
      let update    = session.update
      let xpGain    = session.xpGain

      // Scheda ↔ calendario: +1 sessione sulla scheda attiva; raggiunte quelle
      // previste, scheda completata e bonus XP (una volta sola: completedAt)
      const plan = activePlans[clientId]
      let planCompleted = false
      if (plan) {
        const completedSessions = (plan.completedSessions ?? 0) + 1
        const planUpdate = { completedSessions, updatedAt: new Date().toISOString() }
        if (plan.targetSessions && completedSessions >= plan.targetSessions && !plan.completedAt) {
          planUpdate.completedAt = planUpdate.updatedAt
          planCompleted = true
          const bonus = buildXPUpdate({ ...client, ...update }, PLAN_COMPLETION_XP, `Scheda completata: ${plan.title} (+${PLAN_COMPLETION_XP} XP)`)
          update  = { ...update, ...bonus.update }
          xpGain += PLAN_COMPLETION_XP
        }
        tx.update(plan.ref, planUpdate)
      }
      // Monete negozio avatar — unica fonte di guadagno implementata nello spike
      // EPIC-005 (vedi docs/DECISIONS.md → ADR-002). Importo provvisorio, non
      // un'economia bilanciata — richiede playtesting (STORY-012).
      tx.update(clientsCol.doc(clientId), {
        ...update,
        ...autoBadgeFields(client, update),
        coins: FieldValue.increment(COINS_PER_SESSION),
      })

      if (client.clientAuthUid) {
        tx.set(notifCol.doc(), {
          clientId,
          message:   planCompleted
            ? `Sessione del ${slot.date} completata e scheda "${plan.title}" finita! +${xpGain} XP (streak ${update.sessionStreak})`
            : `Sessione del ${slot.date} completata! +${xpGain} XP (streak ${update.sessionStreak})`,
          date:      today,
          type:      'session',
          read:      false,
          createdAt: new Date().toISOString(),
        })
      }
    }

    // ── Assenti: azzera streak ─────────────────────────────────────────────
    for (const clientId of absenteeIds) {
      const client = clientMap[clientId]
      if (!client) continue

      tx.update(clientsCol.doc(clientId), { sessionStreak: 0 })

      if (client.clientAuthUid) {
        tx.set(notifCol.doc(), {
          clientId,
          message:   `Sessione del ${slot.date} — assenza registrata. Streak azzerata.`,
          date:      today,
          type:      'absence',
          read:      false,
          createdAt: new Date().toISOString(),
        })
      }
    }

    return {
      ok:        true,
      attendees: presentIds.length,
      absentees: absenteeIds.length,
      ignored:   attendeeIds.length - presentIds.length,
    }
  })
})
