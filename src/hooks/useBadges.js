import { useCallback }                    from 'react'
import { awardBadge, revokeBadge, updateBadgeShowcase } from '../firebase/services/badges'
import { getSessionCount }                from '../utils/badges'
import { BADGES }                         from '../config/badges.config'
import { useToast }                       from './useToast'

/**
 * useBadges(orgId, clientId, client)
 *
 * I badge automatici li assegna il server (functions/src/shared/badges.js, dentro
 * chiudiSessione e salvaCampionamento), nella stessa transazione che cambia i dati
 * da cui dipendono. Qui restano solo lettura, assegnazione manuale e vetrina
 * (le azioni manuali sono nascoste in sola lettura da TrophiesSection).
 *
 * Restituisce:
 *   earnedBadges — badge ottenuti con dati completi (config + awardedAt)
 *   allBadges    — tutti i badge definiti (per griglia locked/unlocked)
 *   handleAwardManual(badgeId, awardedBy, note?)
 *   handleRevoke(badgeId)
 */
export function useBadges(orgId, clientId, client) {
  const { success: toastSuccess, error: toastError } = useToast()

  const rawBadges = client?.badges ?? {}

  const earnedBadges = BADGES
    .filter(b => rawBadges[b.id])
    .map(b  => ({ ...b, ...rawBadges[b.id] }))
    .sort((a, b) => (b.awardedAt ?? 0) - (a.awardedAt ?? 0))

  const handleAwardManual = useCallback(async (badgeId, awardedBy, note = null) => {
    try {
      await awardBadge(orgId, clientId, badgeId, awardedBy, note)
      toastSuccess('Badge assegnato')
    } catch {
      toastError('Impossibile assegnare il badge')
    }
  }, [orgId, clientId, toastSuccess, toastError])

  const handleRevoke = useCallback(async (badgeId) => {
    try {
      await revokeBadge(orgId, clientId, badgeId)
      toastSuccess('Badge revocato')
    } catch {
      toastError('Impossibile revocare il badge')
    }
  }, [orgId, clientId, toastSuccess, toastError])

  const handleUpdateShowcase = useCallback(async (badgeIds) => {
    try {
      await updateBadgeShowcase(orgId, clientId, badgeIds)
    } catch (err) {
      toastError('Impossibile aggiornare la vetrina badge')
      throw err   // permette al chiamante di annullare l'aggiornamento ottimistico locale
    }
  }, [orgId, clientId, toastError])

  const badgeProgress = computeBadgeProgress(client)

  return { earnedBadges, allBadges: BADGES, rawBadges, badgeProgress, handleAwardManual, handleRevoke, handleUpdateShowcase }
}

function computeBadgeProgress(client) {
  if (!client) return {}
  const sessions  = getSessionCount(client)
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
