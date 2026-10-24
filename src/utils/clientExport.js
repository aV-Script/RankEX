// Export dei dati personali del cliente (portabilità, art. 20 GDPR — STORY-028).
// Funzioni pure: il fetch e il download stanno in hooks/useClientExport.js.

export const CLIENT_EXPORT_VERSION = 1

// Campi tecnici che non sono dati dell'interessato: token push dei dispositivi
// ed eventuale token wearable legacy (vedi CLAUDE.md → Wearable, RX-63)
const OMIT_FIELDS = ['fcmTokens', 'accessToken']

/**
 * Costruisce il documento di export del cliente.
 * @param {object} data — { client, goals, notes, workoutPlans, notifications }
 * @param {Date}   [exportedAt]
 */
export function buildClientExport({ client, goals = [], notes = [], workoutPlans = [], notifications = [] }, exportedAt = new Date()) {
  return {
    formato:     'RankEX — esportazione dati personali',
    versione:    CLIENT_EXPORT_VERSION,
    esportatoIl: exportedAt.toISOString(),
    profilo:     stripTechnical(client),
    obiettivi:   goals.map(stripTechnical),
    note:        notes.map(stripTechnical),
    schede:      workoutPlans.map(stripTechnical),
    notifiche:   notifications.map(stripTechnical),
  }
}

/** rankex-dati-mario-rossi-2026-10-24.json */
export function clientExportFileName(client, date = new Date()) {
  const slug = (client?.name ?? 'cliente')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cliente'
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return `rankex-dati-${slug}-${day}.json`
}

function stripTechnical(value) {
  if (Array.isArray(value)) return value.map(stripTechnical)
  if (value && typeof value === 'object') {
    // Timestamp Firestore → ISO, così il file è leggibile anche fuori da RankEX
    if (typeof value.toDate === 'function') return value.toDate().toISOString()
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      if (!OMIT_FIELDS.includes(k)) out[k] = stripTechnical(v)
    }
    return out
  }
  return value
}
