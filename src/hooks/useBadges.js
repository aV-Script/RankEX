import { useEffect, useRef, useCallback } from 'react'
import { awardBadge, revokeBadge, updateBadgeShowcase } from '../firebase/services/badges'
import { checkAutoBadges }                from '../utils/badges'
import { BADGES, BADGES_MAP }             from '../config/badges.config'

/**
 * useBadges(orgId, clientId, client, { readonly })
 *
 * Se !readonly (trainer context): controlla e assegna automaticamente
 * i badge automatici mancanti ogni volta che i dati del cliente cambiano.
 *
 * Restituisce:
 *   earnedBadges — badge ottenuti con dati completi (config + awardedAt)
 *   allBadges    — tutti i badge definiti (per griglia locked/unlocked)
 *   handleAwardManual(badgeId, awardedBy, note?)
 *   handleRevoke(badgeId)
 */
export function useBadges(orgId, clientId, client, { readonly = false } = {}) {
  const awarding = useRef(false)

  useEffect(() => {
    if (readonly || !orgId || !clientId || !client || awarding.current) return

    const toAward = checkAutoBadges(client)
    if (toAward.length === 0) return

    awarding.current = true
    Promise.all(
      toAward.map(id => awardBadge(orgId, clientId, id, 'system'))
    ).finally(() => { awarding.current = false })
  }, [client, orgId, clientId, readonly])

  const rawBadges = client?.badges ?? {}

  const earnedBadges = BADGES
    .filter(b => rawBadges[b.id])
    .map(b  => ({ ...b, ...rawBadges[b.id] }))
    .sort((a, b) => (b.awardedAt ?? 0) - (a.awardedAt ?? 0))

  const handleAwardManual = useCallback(async (badgeId, awardedBy, note = null) => {
    await awardBadge(orgId, clientId, badgeId, awardedBy, note)
  }, [orgId, clientId])

  const handleRevoke = useCallback(async (badgeId) => {
    await revokeBadge(orgId, clientId, badgeId)
  }, [orgId, clientId])

  const handleUpdateShowcase = useCallback(async (badgeIds) => {
    await updateBadgeShowcase(orgId, clientId, badgeIds)
  }, [orgId, clientId])

  const badgeProgress = computeBadgeProgress(client)

  return { earnedBadges, allBadges: BADGES, rawBadges, badgeProgress, handleAwardManual, handleRevoke, handleUpdateShowcase }
}

function computeBadgeProgress(client) {
  if (!client) return {}
  const sessions  = (client.log ?? []).filter(e => e.action === 'session').length
  const camps     = (client.campionamenti ?? []).length
  const media     = client.media ?? 0
  const rank      = client.rank  ?? 'F'
  const hasRankUp = media > 0 && camps >= 1
  return {
    prima_sessione:      { current: Math.min(sessions, 1),  total: 1 },
    primo_campionamento: { current: Math.min(camps, 1),     total: 1 },
    striscia_5:          { current: Math.min(sessions, 5),  total: 5 },
    striscia_10:         { current: Math.min(sessions, 10), total: 10 },
    striscia_25:         { current: Math.min(sessions, 25), total: 25 },
    primo_rank_up:       { current: hasRankUp ? 1 : 0,      total: 1 },
    top_performer:       { current: Math.min(Math.round(media), 90), total: 90 },
    rank_massimo:        { current: rank === 'EX' ? 1 : 0,  total: 1 },
  }
}
