/**
 * Dati di partenza che il seed QA (scripts/seed-qa-orgs.mjs) crea per il cliente di base
 * (Sprint #21 voce 5, AI 1). Modulo puro, senza firebase-admin: lo prova Vitest.
 *
 * Marker `qaSeedMarker` (NON `e2eMarker`): il teardown degli spec cancella solo `E2E-…`,
 * quindi questi documenti restano. Id deterministici: un secondo lancio li trova e non li
 * ricrea, né li riapre se la QA li ha già chiusi / letti.
 * Il seed non scrive coins né sessionStreak: li accredita chiudiSessione dalla UI.
 */
import { romeDateStr } from './slotFixtureDate.js'

export const QA_SEED_PREFIX = 'qa-seed-'

const MIDDAY_SUFFIX = 'T12:00:00Z'
const MS_PER_DAY    = 24 * 60 * 60 * 1000

// Orario insolito rispetto agli slot E2E (06:30): aggiungiSlot unisce gli slot con stessa data+ora
const SEED_SLOT_START = '18:15'
const SEED_SLOT_END   = '19:00'

/** Slot passati (ieri, l'altro ieri, 3 giorni fa): la QA li chiude, 10 Monete l'uno (TP-089 in qa-pt; streak/Monete per STORY-048 anche in qa-soccer) */
export const PAST_SLOT_DAYS_AGO = [1, 2, 3]
/** Giorni da oggi dello slot futuro (domani) */
export const UPCOMING_SLOT_DAYS_AHEAD = 1

/** Per chiave modulo di QA_ORGS: cosa crea il seed. Il paziente lipedema non ha login: nulla */
export const QA_SEED_PLAN = {
  pt:       { pastSlots: true,  upcomingSlot: true },
  soccer:   { pastSlots: true,  upcomingSlot: true },   // coins > 0 e streak >= 1 anche per l'allievo (STORY-048)
  lipedema: { pastSlots: false, upcomingSlot: false },
}

const NOTIFICATIONS = [
  { suffix: 'unread-1', message: 'QA: promemoria di prova (non letto)',         type: 'session', read: false },
  { suffix: 'unread-2', message: 'QA: seconda notifica di prova (non letta)',   type: 'session', read: false },
  { suffix: 'read-1',   message: 'QA: notifica di prova già letta',             type: 'absence', read: true  },
]

/** Data 'YYYY-MM-DD' (fuso di Roma) a `offsetDays` giorni da `now`: negativo = passato */
export function offsetRomeDate(now, offsetDays) {
  const base = new Date(`${romeDateStr(now)}${MIDDAY_SUFFIX}`)
  return new Date(base.getTime() + offsetDays * MS_PER_DAY).toISOString().slice(0, 10)
}

/**
 * Slot del cliente di base, come da modello Slot (CLAUDE.md): status planned, attendees e
 * absentees vuoti, recurrenceId null. `kind` 'past' | 'upcoming'.
 * @returns {{ id: string, kind: string, data: object }[]}
 */
export function buildSeedSlots(planKey, clientId, now) {
  const plan = QA_SEED_PLAN[planKey] ?? {}
  const entries = [
    ...(plan.pastSlots ? PAST_SLOT_DAYS_AGO.map(daysAgo => ({ kind: 'past', key: `past-${daysAgo}`, offset: -daysAgo })) : []),
    ...(plan.upcomingSlot ? [{ kind: 'upcoming', key: 'upcoming-1', offset: UPCOMING_SLOT_DAYS_AHEAD }] : []),
  ]
  return entries.map(({ kind, key, offset }) => {
    const marker = `${QA_SEED_PREFIX}slot-${key}`
    return {
      id: marker, kind,
      data: {
        date: offsetRomeDate(now, offset), startTime: SEED_SLOT_START, endTime: SEED_SLOT_END,
        clientIds: [clientId], groupIds: [],
        status: 'planned', attendees: [], absentees: [], recurrenceId: null,
        createdAt: now.toISOString(),
        qaSeedMarker: marker,
      },
    }
  })
}

/** Notifiche del cliente di base (>= 2, di cui >= 1 non letta), modello Notifica di CLAUDE.md */
export function buildSeedNotifications(planKey, clientId, now) {
  if (!QA_SEED_PLAN[planKey]?.upcomingSlot) return []
  const date = now.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
  return NOTIFICATIONS.map(({ suffix, message, type, read }) => {
    const marker = `${QA_SEED_PREFIX}notif-${suffix}`
    return {
      id: marker,
      data: {
        clientId, message, date, type, read,
        readAt: read ? now.toISOString() : null,
        createdAt: now.toISOString(),
        qaSeedMarker: marker,
      },
    }
  })
}

/**
 * Lo slot futuro già esistente e ancora pianificato ma ormai passato (seed lanciato giorni fa)
 * va spostato a domani, così "almeno 1 slot da oggi" resta vero. Mai per gli slot passati.
 */
export function shouldRefreshUpcoming(existingData, now) {
  return existingData?.status === 'planned' && existingData.date < romeDateStr(now)
}
