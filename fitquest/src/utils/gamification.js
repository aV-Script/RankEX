import { LOG_MAX_ENTRIES, XP_PER_LEVEL_MULTIPLIER, LEVEL_PER_RANK, getRankFromMedia } from '../constants'
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
  const today  = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
  const entry  = { date: today, action: note || `+${xpToAdd} XP aggiunto dal trainer`, xp: xpToAdd }
  const log    = [entry, ...(client.log ?? [])].slice(0, LOG_MAX_ENTRIES)
  return { update: { xp, xpNext, level, log } }
}

export function buildCampionamentoUpdate(client, newStats, testValues, note) {
  const media      = calcStatMedia(newStats)
  const rankObj    = getRankFromMedia(media)
  const today      = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })

  const campionamento = { date: today, stats: newStats, tests: testValues, note: note || '', media }
  const campionamenti = [campionamento, ...(client.campionamenti ?? [])].slice(0, 50)

  const entry = { date: today, action: note || 'Nuovo campionamento 📊', xp: 0 }
  const log   = [entry, ...(client.log ?? [])].slice(0, LOG_MAX_ENTRIES)

  // Badge per statistiche a 100
  const newBadges = [...(client.badges ?? [])]
  Object.entries(newStats).forEach(([key, val]) => {
    const badge = `🏆 ${key} al 100%`
    if (val >= 100 && !newBadges.includes(badge)) newBadges.push(badge)
  })
  // Badge rank
  const rankBadge = `🎖️ Rank ${rankObj.label}`
  if (!newBadges.includes(rankBadge) && rankObj.label !== (client.rank ?? 'F')) {
    newBadges.push(rankBadge)
  }

  return {
    update: {
      stats:      newStats,
      rank:       rankObj.label,
      rankColor:  rankObj.color,
      media,
      campionamenti,
      log,
      badges:     newBadges,
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
    campionamenti: [{ date: today, stats, tests: testValues, note: 'Campionamento iniziale', media }],
    log: [{ date: today, action: 'Benvenuto nel programma! 🎉', xp: 0 }],
  }
}
