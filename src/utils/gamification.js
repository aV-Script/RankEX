import {
  LOG_MAX_ENTRIES,
  XP_PER_LEVEL_MULTIPLIER,
  getRankFromMedia,
  ALL_TESTS,
} from '../constants'
import { calcStatMedia } from './percentile'

// ── Configurazione sessioni ───────────────────────────────────────────────────
export const MONTHLY_XP_TARGET   = 500
export const BONUS_XP_FULL_MONTH = 200
export const WEEKS_PER_MONTH     = 4.33

/**
 * Calcola la configurazione sessioni dato il numero di sessioni settimanali.
 * Spostato da useCalendar — è logica di business, non logica di hook.
 */
export function calcSessionConfig(sessionsPerWeek) {
  const freq        = Math.max(1, Math.min(7, Math.round(sessionsPerWeek)))
  const monthlySess = Math.round(freq * WEEKS_PER_MONTH)
  const xpPerSess   = Math.round(MONTHLY_XP_TARGET / monthlySess)
  return { sessionsPerWeek: freq, monthlySessions: monthlySess, xpPerSession: xpPerSess }
}

const XP_PER_CAMPIONAMENTO = 50

export function calcLevelProgression(xp, xpNext, level) {
  let cur = xp, next = xpNext, lvl = level
  while (cur >= next) {
    cur  -= next
    next  = Math.round(next * XP_PER_LEVEL_MULTIPLIER)
    lvl  += 1
  }
  return { xp: cur, xpNext: next, level: lvl }
}

export function buildXPUpdate(client, xpToAdd, note) {
  const { xp, xpNext, level } = calcLevelProgression(client.xp + xpToAdd, client.xpNext, client.level)
  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
  const entry = { date: today, action: note || `+${xpToAdd} XP aggiunto dal trainer`, xp: xpToAdd }
  const log   = [entry, ...(client.log ?? [])].slice(0, LOG_MAX_ENTRIES)
  return { update: { xp, xpNext, level, log } }
}

export function buildCampionamentoUpdate(client, newStats, testValues) {
  const media   = calcStatMedia(newStats)
  const rankObj = getRankFromMedia(media)
  const today   = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })

  const campionamento = { date: today, stats: newStats, tests: testValues, media }
  const campionamenti = [campionamento, ...(client.campionamenti ?? [])].slice(0, 50)

  const valStr = Object.entries(testValues)
    .map(([k, v]) => {
      const test  = ALL_TESTS.find(t => t.key === k)
      const unit  = test?.unit ?? ''
      const label = test?.label ?? k.charAt(0).toUpperCase() + k.slice(1)
      return `${label} ${v}${unit}`
    })
    .join(' · ')

  const logEntry = { date: today, action: `Campionamento — ${valStr}`, xp: XP_PER_CAMPIONAMENTO }
  const log      = [logEntry, ...(client.log ?? [])].slice(0, LOG_MAX_ENTRIES)

  const { xp, xpNext, level } = calcLevelProgression(
    (client.xp ?? 0) + XP_PER_CAMPIONAMENTO,
    client.xpNext,
    client.level
  )

  return {
    update: {
      stats: newStats, rank: rankObj.label, rankColor: rankObj.color,
      media, campionamenti, log, xp, xpNext, level,
    },
    campionamento,
  }
}

export function buildNewClient(trainerId, formData, defaults) {
  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
  const { testValues, stats, ...anagrafica } = formData
  const media   = calcStatMedia(stats)
  const rankObj = getRankFromMedia(media)

  return {
    ...defaults,
    ...anagrafica,
    trainerId,
    stats,
    rank:      rankObj.label,
    rankColor: rankObj.color,
    media,
    campionamenti: [{ date: today, stats, tests: testValues, media }],
    log: [{ date: today, action: 'Benvenuto nel programma!', xp: 0 }],
  }
}