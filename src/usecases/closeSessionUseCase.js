import { buildSessionUpdate } from '../utils/gamification'
import { closeSlot }          from '../firebase/services/calendar'
import { updateClient }       from '../firebase/services/clients'
import { addNotification }    from '../firebase/services/notifications'

/**
 * Chiude una sessione: aggiorna lo slot, assegna XP e streak agli attendees,
 * invia notifiche a presenti e assenti.
 *
 * @param {string}   orgId
 * @param {object}   slot        — slot da chiudere (deve avere id, date, clientIds)
 * @param {string[]} attendeeIds — clientIds presenti
 * @param {object[]} clients     — array completo dei clienti (per lookup)
 */
export async function closeSessionUseCase(orgId, slot, attendeeIds, clients) {
  const absenteeIds = slot.clientIds.filter(id => !attendeeIds.includes(id))

  await closeSlot(orgId, slot.id, { attendees: attendeeIds, absentees: absenteeIds })

  await Promise.all(
    attendeeIds.map(async clientId => {
      const client = clients.find(c => c.id === clientId)
      if (!client) return

      const { update, xpGain } = buildSessionUpdate(
        client,
        client.baseXP ?? 50,
        'Sessione di allenamento'
      )

      await updateClient(orgId, client.id, update)

      if (client.clientAuthUid) {
        await addNotification(orgId, {
          clientId: client.id,
          message:  `Sessione del ${slot.date} completata! +${xpGain} XP (streak ${update.sessionStreak})`,
          date:     new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
          type:     'session',
        })
      }
    })
  )

  await Promise.all(
    absenteeIds.map(async clientId => {
      const client = clients.find(c => c.id === clientId)
      if (!client) return

      await updateClient(orgId, client.id, { sessionStreak: 0 })

      if (client.clientAuthUid) {
        await addNotification(orgId, {
          clientId: client.id,
          message:  `Sessione del ${slot.date} — assenza registrata. Streak azzerata.`,
          date:     new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
          type:     'absence',
        })
      }
    })
  )
}
