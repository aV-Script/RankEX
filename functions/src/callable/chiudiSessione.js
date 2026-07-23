/**
 * chiudiSessione — callable Cloud Function (Gen 2)
 *
 * Sostituisce closeSessionUseCase.js lato client.
 * Esegue in un unico batch atomico server-side:
 *   - slot.status = 'completed'
 *   - XP + streak per ogni attendee
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
import { buildSessionUpdate } from '../shared/gamification.js'

const REGION = 'europe-west1'

export const chiudiSessione = onCall({ region: REGION }, async (request) => {
  const { orgId, slotId, attendeeIds } = request.data

  if (!orgId || !slotId || !Array.isArray(attendeeIds)) {
    throw new HttpsError('invalid-argument', 'orgId, slotId e attendeeIds sono richiesti')
  }

  await requireOrgAccess(request, orgId)

  const db   = getFirestore()
  const batch = db.batch()

  // ── Carica slot ──────────────────────────────────────────────────────────
  const slotRef = db.collection(`organizations/${orgId}/slots`).doc(slotId)
  const slotDoc = await slotRef.get()
  if (!slotDoc.exists) throw new HttpsError('not-found', 'Slot non trovato')

  const slot       = slotDoc.data()
  const allClientIds = slot.clientIds ?? []
  const absenteeIds  = allClientIds.filter(id => !attendeeIds.includes(id))

  if (slot.status === 'completed') {
    throw new HttpsError('failed-precondition', 'Sessione già chiusa')
  }

  batch.update(slotRef, {
    status:    'completed',
    attendees: attendeeIds,
    absentees: absenteeIds,
  })

  // ── Carica tutti i client coinvolti in un'unica round-trip ───────────────
  const clientIds = [...new Set([...attendeeIds, ...absenteeIds])]
  const clientDocs = await Promise.all(
    clientIds.map(id => db.collection(`organizations/${orgId}/clients`).doc(id).get())
  )
  const clientMap = {}
  clientDocs.forEach(d => { if (d.exists) clientMap[d.id] = { id: d.id, ...d.data() } })

  const today    = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
  const notifCol = db.collection(`organizations/${orgId}/notifications`)

  // ── Attendees: XP + streak ───────────────────────────────────────────────
  for (const clientId of attendeeIds) {
    const client = clientMap[clientId]
    if (!client) continue

    const { update, xpGain } = buildSessionUpdate(client, client.baseXP ?? 50, 'Sessione di allenamento')
    batch.update(db.collection(`organizations/${orgId}/clients`).doc(clientId), update)

    if (client.clientAuthUid) {
      batch.set(notifCol.doc(), {
        clientId,
        message:   `Sessione del ${slot.date} completata! +${xpGain} XP (streak ${update.sessionStreak})`,
        date:      today,
        type:      'session',
        read:      false,
        createdAt: new Date().toISOString(),
      })
    }
  }

  // ── Absentees: azzera streak ─────────────────────────────────────────────
  for (const clientId of absenteeIds) {
    const client = clientMap[clientId]
    if (!client) continue

    batch.update(db.collection(`organizations/${orgId}/clients`).doc(clientId), { sessionStreak: 0 })

    if (client.clientAuthUid) {
      batch.set(notifCol.doc(), {
        clientId,
        message:   `Sessione del ${slot.date} — assenza registrata. Streak azzerata.`,
        date:      today,
        type:      'absence',
        read:      false,
        createdAt: new Date().toISOString(),
      })
    }
  }

  await batch.commit()

  return { ok: true, attendees: attendeeIds.length, absentees: absenteeIds.length }
})
