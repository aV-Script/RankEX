// Logica gamification lato server — speculare a src/utils/gamification.js.
// Nessuna dipendenza browser: solo JS puro + costanti locali.

import {
  LOG_MAX_ENTRIES,
  XP_PER_LEVEL_MULTIPLIER,
  MAX_CAMPIONAMENTI,
  getRankFromMedia,
  calcStatMedia,
} from './constants.js'
import { calcBiaXP } from './bia.js'

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

export function buildBiaUpdate(client, newBia) {
  const today   = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
  const prevBia = client.lastBia ?? null
  const xpToAdd = calcBiaXP(newBia, prevBia)

  const biaRecord  = { ...newBia, date: today }
  const biaHistory = [biaRecord, ...(client.biaHistory ?? [])].slice(0, 50)

  const logEntry = {
    date:   today,
    action: `BIA — ${prevBia ? 'Aggiornamento composizione corporea' : 'Prima misurazione'}`,
    xp:     xpToAdd,
    ts:     Date.now(),
  }
  const log = [logEntry, ...(client.log ?? [])].slice(0, LOG_MAX_ENTRIES)

  const { xp, xpNext, level } = calcLevelProgression(
    (client.xp ?? 0) + xpToAdd,
    client.xpNext ?? 500,
    client.level  ?? 1,
  )

  return {
    update:             { lastBia: biaRecord, biaHistory, log, xp, xpNext, level },
    xpEarned:           xpToAdd,
    isFirstMeasurement: prevBia === null,
  }
}

export function buildProfileUpgrade(client, newProfileType) {
  const update = { profileType: newProfileType }
  const today  = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })

  if (newProfileType === 'complete') {
    if (client.profileType === 'tests_only') {
      update.biaHistory = []
      update.lastBia    = null
    } else if (client.profileType === 'bia_only') {
      update.stats         = {}
      update.campionamenti = []
      update.rank          = 'F'
      update.rankColor     = '#6b7280'
      update.media         = 0
      update.categoria     = 'health'
    }
  }

  const logEntry = {
    date:   today,
    action: `Profilo aggiornato → ${newProfileType === 'complete' ? 'Test + BIA' : newProfileType}`,
    xp:     0,
    ts:     Date.now(),
  }
  update.log = [logEntry, ...(client.log ?? [])].slice(0, LOG_MAX_ENTRIES)
  return update
}

export function buildNewClient(trainerId, formData, defaults) {
  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
  const { testValues = {}, stats = {}, ...anagrafica } = formData
  const profileType = anagrafica.profileType ?? 'tests_only'
  const hasTests    = profileType !== 'bia_only'

  const media   = hasTests ? calcStatMedia(stats) : 0
  const rankObj = getRankFromMedia(media)

  const FIRST_CAMP_XP = 50
  const { xp, xpNext, level } = hasTests
    ? calcLevelProgression((defaults.xp ?? 0) + FIRST_CAMP_XP, defaults.xpNext, defaults.level)
    : { xp: defaults.xp ?? 0, xpNext: defaults.xpNext, level: defaults.level }

  return {
    ...defaults,
    ...anagrafica,
    trainerId,
    xp, xpNext, level,
    stats:         hasTests ? stats : {},
    rank:          hasTests ? rankObj.label : 'F',
    rankColor:     hasTests ? rankObj.color : '#4a5568',
    media:         hasTests ? media : 0,
    campionamenti: hasTests ? [{ date: today, stats, tests: testValues, media }] : [],
    log: [{
      date:   today,
      action: 'Primo campionamento effettuato',
      xp:     hasTests ? FIRST_CAMP_XP : 0,
      ts:     Date.now(),
    }],
  }
}
