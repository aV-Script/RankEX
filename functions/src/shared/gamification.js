// Logica gamification lato server — speculare a src/utils/gamification.js.
// Nessuna dipendenza browser: solo JS puro + costanti locali.

import {
  LOG_MAX_ENTRIES,
  XP_PER_LEVEL_MULTIPLIER,
  MAX_CAMPIONAMENTI,
  getRankFromMedia,
  calcStatMedia,
} from './constants.js'

function calcLevelProgression(xp, xpNext, level) {
  let cur = xp, next = xpNext, lvl = level
  while (cur >= next) {
    cur  -= next
    next  = Math.round(next * XP_PER_LEVEL_MULTIPLIER)
    lvl  += 1
  }
  return { xp: cur, xpNext: next, level: lvl }
}

export function calcSessionXP(baseXP, streak = 0) {
  const multiplier = 1 + Math.min(streak * 0.1, 1.0)
  return Math.round(baseXP * multiplier)
}

export function buildSessionUpdate(client, baseXP, label = 'Sessione') {
  const todayDate = new Date()
  const todayStr  = todayDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
  const streak    = (client.sessionStreak ?? 0) + 1
  const xpGain    = calcSessionXP(baseXP, streak)

  const logEntry = {
    date:   todayStr,
    action: `${label} (streak ${streak})`,
    xp:     xpGain,
    ts:     Date.now(),
  }

  const log = [logEntry, ...(client.log ?? [])].slice(0, LOG_MAX_ENTRIES)
  const { xp, xpNext, level } = calcLevelProgression(
    (client.xp    ?? 0)   + xpGain,
    client.xpNext ?? 500,
    client.level  ?? 1,
  )

  return { update: { xp, xpNext, level, sessionStreak: streak, lastSessionDate: todayDate.toISOString(), log }, xpGain, streak }
}

export function buildCampionamentoUpdate(client, newStats, testValues) {
  const media   = calcStatMedia(newStats)
  const rankObj = getRankFromMedia(media)
  const today   = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })

  const prevStats = client.campionamenti?.[0]?.stats
  let xpGain
  if (!prevStats) {
    xpGain = 50
  } else {
    const nImproved = Object.keys(newStats).filter(
      k => (newStats[k] ?? 0) > (prevStats[k] ?? 0)
    ).length
    if      (nImproved >= 4) xpGain = 100
    else if (nImproved >= 2) xpGain = 60
    else if (nImproved === 1) xpGain = 30
    else                      xpGain = 10
  }

  const campionamento = { date: today, stats: newStats, tests: testValues, media }
  const campionamenti = [campionamento, ...(client.campionamenti ?? [])].slice(0, MAX_CAMPIONAMENTI)

  const logEntry = { date: today, action: `Campionamento effettuato`, xp: xpGain, ts: Date.now() }
  const log = [logEntry, ...(client.log ?? [])].slice(0, LOG_MAX_ENTRIES)

  const { xp, xpNext, level } = calcLevelProgression(
    (client.xp    ?? 0)   + xpGain,
    client.xpNext ?? 500,
    client.level  ?? 1,
  )

  return {
    update: { stats: newStats, rank: rankObj.label, rankColor: rankObj.color, media, campionamenti, log, xp, xpNext, level },
    campionamento,
  }
}

export function buildXPUpdate(client, xpToAdd, note) {
  const { xp, xpNext, level } = calcLevelProgression(
    (client.xp ?? 0) + xpToAdd,
    client.xpNext ?? 500,
    client.level ?? 1,
  )
  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
  const entry = { date: today, action: note || `+${xpToAdd} XP`, xp: xpToAdd, ts: Date.now() }
  const log   = [entry, ...(client.log ?? [])].slice(0, LOG_MAX_ENTRIES)
  return { update: { xp, xpNext, level, log } }
}
