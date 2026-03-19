import { useMemo } from 'react'
import { calcStatMedia } from '../utils/percentile'
import { getRankFromMedia } from '../constants'

/**
 * Incapsula il pattern ripetuto in 6 componenti:
 *   const media   = calcStatMedia(client.stats ?? {})
 *   const rankObj = getRankFromMedia(media)
 *   const color   = client.rankColor ?? rankObj.color
 *
 * @param {object} client — oggetto cliente con { stats, rankColor }
 * @returns {{ media, rankObj, color }}
 */
export function useClientRank(client) {
  return useMemo(() => {
    const media   = calcStatMedia(client?.stats ?? {})
    const rankObj = getRankFromMedia(media)
    const color   = client?.rankColor ?? rankObj.color
    return { media, rankObj, color }
  }, [client?.stats, client?.rankColor])
}
