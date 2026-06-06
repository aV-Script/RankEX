import { useEffect, useRef, useCallback } from 'react'
import { awardBadge, revokeBadge }        from '../firebase/services/badges'
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

  return { earnedBadges, allBadges: BADGES, rawBadges, handleAwardManual, handleRevoke }
}
