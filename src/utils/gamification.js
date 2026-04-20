import {
  LOG_MAX_ENTRIES,
  XP_PER_LEVEL_MULTIPLIER,
  getRankFromMedia,
  ALL_TESTS,
} from '../constants'
import { calcStatMedia } from './percentile'
import { calcBiaXP }    from './bia'

// ── Streak sessioni ───────────────────────────────────────────────────────────
// La streak conta sessioni consecutive chiuse con presenza.
// Sale di 1 a ogni sessione completata, si azzera se il cliente è assente.

/** Streak dopo una presenza confermata. */
function updateSessionStreak(client) {
  return (client.sessionStreak ?? 0) + 1
}

/** Anteprima streak per la UI (prima di confermare). */
export function calcStreakPreview(client) {
  return (client.sessionStreak ?? 0) + 1
}

/**
 * Calcola EXP per sessione basata SOLO su streak
 */
export function calcSessionXP(baseXP, streak = 0) {
  const multiplier = 1 + Math.min(streak * 0.1, 1.0) // max +100% a streak 10
  return Math.round(baseXP * multiplier)
}


/**
 * Costruisce l'update dopo una sessione
 * @param {object} client
 * @param {number} baseXP
 * @param {string} label (es. "Allenamento forza")
 */
export function buildSessionUpdate(client, baseXP, label = 'Sessione') {
  const todayDate = new Date()
  const todayStr = todayDate.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short'
  })

  const streak = updateSessionStreak(client, todayDate)

  const xpGain = calcSessionXP(baseXP, streak)

  const logEntry = {
    date: todayStr,
    action: `${label} (streak ${streak})`,
    xp: xpGain
  }

  const log = [logEntry, ...(client.log ?? [])].slice(0, LOG_MAX_ENTRIES)

  const { xp, xpNext, level } = calcLevelProgression(
    (client.xp ?? 0) + xpGain,
    client.xpNext,
    client.level
  )

  return {
    update: {
      xp,
      xpNext,
      level,
      sessionStreak: streak,
      lastSessionDate: todayDate.toISOString(),
      log
    },
    xpGain,
    streak
  }
}

const MAX_CAMPIONAMENTI     = 50

/**
 * Avanza di livello finché l'XP è sufficiente.
 * @param {number} xp    — XP corrente (dopo l'aggiunta)
 * @param {number} xpNext — XP necessari per il prossimo livello
 * @param {number} level  — livello corrente
 * @returns {{ xp: number, xpNext: number, level: number }}
 */
function calcLevelProgression(xp, xpNext, level) {
  let cur = xp, next = xpNext, lvl = level
  while (cur >= next) {
    cur  -= next
    next  = Math.round(next * XP_PER_LEVEL_MULTIPLIER)
    lvl  += 1
  }
  return { xp: cur, xpNext: next, level: lvl }
}

/**
 * Calcola il patch da applicare al cliente dopo l'aggiunta di XP manuale.
 * @param {object} client  — dati attuali del cliente
 * @param {number} xpToAdd — XP da aggiungere
 * @param {string} [note]  — nota opzionale per il log
 * @returns {{ update: object }} — campi da persistere su Firestore
 */
export function buildXPUpdate(client, xpToAdd, note) {
  const { xp, xpNext, level } = calcLevelProgression(client.xp + xpToAdd, client.xpNext, client.level)
  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
  const entry = { date: today, action: note || `+${xpToAdd} XP aggiunto dal trainer`, xp: xpToAdd }
  const log   = [entry, ...(client.log ?? [])].slice(0, LOG_MAX_ENTRIES)
  return { update: { xp, xpNext, level, log } }
}

/**
 * Calcola il patch da applicare al cliente dopo un campionamento.
 * Aggiorna stats, rank, media, campionamenti, log, xp e level.
 * @param {object} client     — dati attuali del cliente
 * @param {object} newStats   — nuovi valori percentile per statistica
 * @param {object} testValues — valori grezzi dei test eseguiti
 * @returns {{ update: object, campionamento: object }}
 */
export function buildCampionamentoUpdate(client, newStats, testValues) {
  const media   = calcStatMedia(newStats)
  const rankObj = getRankFromMedia(media)
  const today   = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })

  const prevStats = client.campionamenti?.[0]?.stats

  let xpGain
  if (!prevStats) {
    // Prima misurazione in assoluto
    xpGain = 50
  } else {
    const nImproved = Object.keys(newStats).filter(
      key => (newStats[key] ?? 0) > (prevStats[key] ?? 0)
    ).length

    if      (nImproved >= 4) xpGain = 100
    else if (nImproved >= 2) xpGain = 60
    else if (nImproved === 1) xpGain = 30
    else                      xpGain = 10
  }

  const campionamento = { date: today, stats: newStats, tests: testValues, media }
  const campionamenti = [campionamento, ...(client.campionamenti ?? [])].slice(0, MAX_CAMPIONAMENTI)

  const valStr = Object.entries(testValues)
    .map(([k, v]) => {
      const test  = ALL_TESTS.find(t => t.key === k)
      const unit  = test?.unit ?? ''
      const label = test?.label ?? k.charAt(0).toUpperCase() + k.slice(1)
      return `${label} ${v}${unit}`
    })
    .join(' · ')

  const logEntry = {
    date: today,
    action: `Campionamento — ${valStr}`,
    xp: xpGain
  }

  const log = [logEntry, ...(client.log ?? [])].slice(0, LOG_MAX_ENTRIES)

  const { xp, xpNext, level } = calcLevelProgression(
    (client.xp ?? 0) + xpGain,
    client.xpNext,
    client.level
  )

  return {
    update: {
      stats: newStats,
      rank: rankObj.label,
      rankColor: rankObj.color,
      media,
      campionamenti,
      log,
      xp,
      xpNext,
      level,
    },
    campionamento,
  }
}

/**
 * Costruisce l'update per una nuova misurazione BIA.
 */
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
  }
  const log = [logEntry, ...(client.log ?? [])].slice(0, LOG_MAX_ENTRIES)

  const { xp, xpNext, level } = calcLevelProgression(
    (client.xp ?? 0) + xpToAdd,
    client.xpNext,
    client.level,
  )

  return {
    update: {
      lastBia:    biaRecord,
      biaHistory,
      log,
      xp,
      xpNext,
      level,
    },
    xpEarned: xpToAdd,
  }
}

/**
 * Upgrade categoria profilo cliente.
 * Mantiene lo storico della tipologia precedente.
 */
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
  }
  update.log = [logEntry, ...(client.log ?? [])].slice(0, LOG_MAX_ENTRIES)

  return update
}

/**
 * Costruisce l'oggetto cliente completo da persistere su Firestore alla creazione.
 * @param {string} trainerId — uid del trainer
 * @param {object} formData  — dati dal wizard (anagrafica + stats + testValues + account)
 * @param {object} defaults  — valori di default (xp, xpNext, level, sessionsPerWeek...)
 * @returns {object} documento cliente pronto per Firestore
 */
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
    xp,
    xpNext,
    level,
    stats:         hasTests ? stats : {},
    rank:          hasTests ? rankObj.label : 'F',
    rankColor:     hasTests ? rankObj.color : '#4a5568',
    media:         hasTests ? media : 0,
    campionamenti: hasTests ? [{ date: today, stats, tests: testValues, media }] : [],
    log: [{ date: today, action: 'Primo campionamento effettuato', xp: hasTests ? FIRST_CAMP_XP : 0 }],
  }
}