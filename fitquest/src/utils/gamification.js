import {
  LOG_MAX_ENTRIES, XP_PER_LEVEL_MULTIPLIER,
  getRankFromMedia, 
} from '../constants'
import { calcStatMedia } from './percentile'

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

  // Log con valori grezzi
  const UNITS  = { forza: 'kg', mobilita: 'cm', equilibrio: 'cad.', esplosivita: 's', resistenza: 'bpm' }
  const valStr = Object.entries(testValues)
    .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)} ${v}${UNITS[k] ?? ''}`)
    .join(' · ')
  const logEntry = { date: today, action: `Campionamento — ${valStr}`, xp: 0 }

  const log = [logEntry, ...(client.log ?? [])].slice(0, LOG_MAX_ENTRIES)

  // Aggiornamento XP se necessario (qui puoi calcolare xpUpdate se serve)
  const xpUpdate = {} // oppure chiama buildXPUpdate se vuoi incrementare XP

  return {
    update: {
      stats:      newStats,
      rank:       rankObj.label,
      rankColor:  rankObj.color,
      media,
      campionamenti,
      log,
      ...xpUpdate,
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

