// Logica auto-badge — funzioni pure, nessun side effect

/**
 * Restituisce gli ID dei badge automatici che il cliente dovrebbe
 * avere ma non ha ancora. Chiamato da useBadges (trainer context).
 */
export function checkAutoBadges(client) {
  const earned = Object.keys(client.badges ?? {})

  const sessions = (client.log ?? []).filter(e => e.action === 'session').length
  const camps    = (client.campionamenti ?? []).length
  const media    = client.media ?? 0
  const rank     = client.rank  ?? 'F'

  // Prima di avere un campionamento media è 0, ma potrebbe essere sul rank F
  // per design. Primo rank-up = media > 0 (ha un punteggio reale) + camps >= 1.
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
