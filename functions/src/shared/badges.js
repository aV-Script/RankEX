// Copia speculare di src/utils/badges.js (getSessionCount, checkAutoBadges) —
// tenuta allineata dal test di parità in src/__tests__/parity/.
// I trofei automatici si assegnano qui, dentro le callable che cambiano i dati
// da cui dipendono (chiudiSessione, salvaCampionamento): prima li assegnava il
// browser del trainer, solo quando apriva la scheda del cliente.

const SESSION_LOG_PREFIX = 'Sessione di allenamento'

export function getSessionCount(client) {
  if (typeof client.sessionCount === 'number') return client.sessionCount
  return (client.log ?? []).filter(e => e.action?.startsWith(SESSION_LOG_PREFIX)).length
}

export function checkAutoBadges(client) {
  const earned = Object.keys(client.badges ?? {})

  const sessions = getSessionCount(client)
  const camps    = (client.campionamenti ?? []).length
  const media    = client.media ?? 0
  const rank     = client.rank  ?? 'F'

  const hasRankUp = media > 0 && camps >= 1

  const checks = [
    ['prima_sessione',      sessions >= 1],
    ['primo_campionamento', camps >= 1],
    ['striscia_5',          sessions >= 5],
    ['striscia_10',         sessions >= 10],
    ['striscia_25',         sessions >= 25],
    ['primo_rank_up',       hasRankUp],
    ['top_performer',       media >= 90],
    ['rank_massimo',        rank === 'EX'],
  ]

  return checks
    .filter(([id, condition]) => condition && !earned.includes(id))
    .map(([id]) => id)
}

/**
 * Campi da aggiungere all'update del cliente per i trofei appena maturati.
 * `client` = documento prima dell'update, `update` = campi che stanno per essere scritti.
 * Ritorna { 'badges.<id>': { awardedAt, awardedBy: 'system' } } (path puntati: non
 * tocca i badge già presenti).
 */
export function autoBadgeFields(client, update, now = Date.now()) {
  const ids = checkAutoBadges({ ...client, ...update })
  return Object.fromEntries(ids.map(id => [`badges.${id}`, { awardedAt: now, awardedBy: 'system' }]))
}
