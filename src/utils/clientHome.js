import { calcStreakMultiplier, calcStreakPreview } from './gamification'
import { sortNotificationsNewestFirst } from './notifications'
import { formatUpcomingDate } from './calendarUtils'

export const HOME_NOTIFICATIONS_SHOWN = 2

// it-IT di Intl non raggruppa i numeri a 4 cifre ("3420"): il canvas mostra "3.420"
function formatThousands(value) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** "XP ×1,1": moltiplicatore con la virgola, identico al riepilogo del Calendario. */
export function formatXpMultiplier(multiplier) {
  return `XP ×${multiplier.toFixed(1).replace('.', ',')}`
}

/** Striscia del cliente e testo del moltiplicatore della prossima sessione (anche a streak 0: ×1,1). */
export function getStreakSummary(client) {
  const streak = client?.sessionStreak ?? 0
  const multiplier = calcStreakMultiplier(calcStreakPreview(client ?? {}))
  return { streak, multiplierText: formatXpMultiplier(multiplier) }
}

/**
 * Valori della barra XP. `max` è almeno 1 (xpNext assente o 0 non rompe) e `now` non lo supera,
 * così `aria-valuenow` resta nell'intervallo; `pct` è 0 senza xpNext.
 */
export function getXpProgress({ xp = 0, xpNext = 0, level = 1 }) {
  const safeXp = Math.max(xp ?? 0, 0)
  const safeNext = Math.max(xpNext ?? 0, 0)
  const max = Math.max(safeNext, 1)
  const now = Math.min(safeXp, max)
  const pct = safeNext > 0 ? Math.round((now / safeNext) * 100) : 0
  const xpLabel = formatThousands(safeXp)
  const nextLabel = formatThousands(safeNext)
  return {
    now, max, pct,
    xpText: `${xpLabel} / ${nextLabel} XP`,
    levelText: `LIVELLO ${level}`,
    ariaLabel: `Livello ${level}: ${xpLabel} di ${nextLabel} XP`,
  }
}

/** Media dei test arrotondata, solo con campionamenti e profilo non bia_only (D2); altrimenti null. */
export function getHomeMedia({ media, campionamenti, profileType }) {
  if (profileType === 'bia_only') return null
  if (!campionamenti || campionamenti.length === 0) return null
  if (typeof media !== 'number' || Number.isNaN(media)) return null
  return Math.round(media)
}

/**
 * Nome della categoria PT sotto il nome. Solo moduli con `hasCategories`, solo categorie reali
 * (niente ricaduta su "Health" per valori ignoti) e non per `bia_only`.
 * @param {{ hasCategories: boolean }} capabilities
 * @param {object} client
 * @param {{ id: string, label: string }[]} categories — CATEGORIE
 */
export function getHomeCategoryLabel(capabilities, client, categories) {
  if (!capabilities?.hasCategories) return null
  if ((client?.profileType ?? 'tests_only') === 'bia_only') return null
  return categories.find(category => category.id === client?.categoria)?.label ?? null
}

/** Le ultime `limit` notifiche, dalla più recente (non modifica l'array ricevuto). */
export function pickLatestNotifications(notifications, limit = HOME_NOTIFICATIONS_SHOWN) {
  return sortNotificationsNewestFirst(notifications ?? []).slice(0, limit)
}

/** "GIO 28 NOV · 10:00 – 11:00" (senza orario: solo la data; senza fine: solo l'inizio). */
export function formatNextSessionWhen(slot) {
  const time = slot.startTime ? ` · ${slot.startTime}${slot.endTime ? ` – ${slot.endTime}` : ''}` : ''
  return `${formatUpcomingDate(slot.date)}${time}`
}

/**
 * Nome accessibile della card PROSSIMA: titolo e data separati da ":" (il testo visibile li affianca
 * senza spazio e un lettore di schermo leggerebbe "Prossimagio 28 nov"). Con slot: "Prossima sessione: GIO 28 NOV · 10:00";
 * senza: il testo del caso vuoto.
 * @param {{ title: string, sessionTerm: string, emptyText: string }} parts
 */
export function getNextSessionAriaLabel({ title, sessionTerm, emptyText }, slot) {
  return slot ? `${title} ${sessionTerm}: ${formatNextSessionWhen(slot)}` : emptyText
}
