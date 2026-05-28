import { writeBatch, doc, collection }              from 'firebase/firestore'
import { db }                                        from '../firebase/services/db'
import { slotsPath, clientsPath, notificationsPath } from '../firebase/paths'
import { buildSessionUpdate }                        from '../utils/gamification'
import { SLOT_STATUS }                               from '../constants/slotStatus'

/**
 * Chiude una sessione in modo atomico: aggiorna lo slot, assegna XP e streak
 * agli attendees, azzera la streak agli absentees, invia tutte le notifiche.
 * Un unico batch.commit() garantisce che tutte le scritture riescano o nessuna.
 *
 * @param {string}   orgId
 * @param {object}   slot        — slot da chiudere (deve avere id, date, clientIds)
 * @param {string[]} attendeeIds — clientIds presenti
 * @param {object[]} clients     — array completo dei clienti (per lookup)
 */
export async function closeSessionUseCase(orgId, slot, attendeeIds, clients) {
  const absenteeIds = slot.clientIds.filter(id => !attendeeIds.includes(id))
  const batch       = writeBatch(db)

  batch.update(doc(db, slotsPath(orgId), slot.id), {
    status:    SLOT_STATUS.COMPLETED,
    attendees: attendeeIds,
    absentees: absenteeIds,
  })

  for (const clientId of attendeeIds) {
    const client = clients.find(c => c.id === clientId)
    if (!client) continue

    const { update, xpGain } = buildSessionUpdate(client, client.baseXP ?? 50, 'Sessione di allenamento')

    batch.update(doc(db, clientsPath(orgId), client.id), update)

    if (client.clientAuthUid) {
      batch.set(doc(collection(db, notificationsPath(orgId))), {
        clientId:  client.id,
        message:   `Sessione del ${slot.date} completata! +${xpGain} XP (streak ${update.sessionStreak})`,
        date:      new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
        type:      'session',
        read:      false,
        createdAt: new Date().toISOString(),
      })
    }
  }

  for (const clientId of absenteeIds) {
    const client = clients.find(c => c.id === clientId)
    if (!client) continue

    batch.update(doc(db, clientsPath(orgId), client.id), { sessionStreak: 0 })

    if (client.clientAuthUid) {
      batch.set(doc(collection(db, notificationsPath(orgId))), {
        clientId:  client.id,
        message:   `Sessione del ${slot.date} — assenza registrata. Streak azzerata.`,
        date:      new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
        type:      'absence',
        read:      false,
        createdAt: new Date().toISOString(),
      })
    }
  }

  await batch.commit()
}
