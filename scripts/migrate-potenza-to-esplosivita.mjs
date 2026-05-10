/**
 * Migrazione: rinomina stats.potenza → stats.esplosivita
 * nei documenti client dell'org vdp5-tgtdu.
 *
 * Il bug era nel STAT_MAP dell'import script che usava 'potenza' invece di
 * 'esplosivita' per standing_long_jump. Questo script lo corregge sui dati
 * già scritti in Firestore.
 *
 * Uso:
 *   node scripts/migrate-potenza-to-esplosivita.mjs path/to/service-account.json
 */

import { readFileSync } from 'fs'
import admin           from 'firebase-admin'

const saPath = process.argv[2]
if (!saPath) {
  console.error('Uso: node scripts/migrate-potenza-to-esplosivita.mjs <service-account.json>')
  process.exit(1)
}

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(saPath, 'utf-8'))) })
const db = admin.firestore()

const ORG_ID = 'vdp5-tgtdu'

const RANKS = [
  { min: 95, label: 'EX',  color: '#ffd700' },
  { min: 90, label: 'SS+', color: '#ff4560' },
  { min: 85, label: 'SS',  color: '#ff7043' },
  { min: 80, label: 'S+',  color: '#1aff6e' },
  { min: 75, label: 'S',   color: '#0fd65a' },
  { min: 70, label: 'A+',  color: '#00c8ff' },
  { min: 65, label: 'A',   color: '#4db8ff' },
  { min: 60, label: 'B+',  color: '#38bdf8' },
  { min: 55, label: 'B',   color: '#0066cc' },
  { min: 50, label: 'C+',  color: '#a3e635' },
  { min: 45, label: 'C',   color: '#facc15' },
  { min: 40, label: 'D+',  color: '#fb923c' },
  { min: 35, label: 'D',   color: '#f97316' },
  { min: 30, label: 'E+',  color: '#f87171' },
  { min: 25, label: 'E',   color: '#ef4444' },
  { min: 20, label: 'F+',  color: '#8a9bb0' },
  { min: 0,  label: 'F',   color: '#4a5568' },
]

const getRankFromMedia = (media) => RANKS.find(r => media >= r.min) ?? RANKS[RANKS.length - 1]

const calcStatMedia = (stats) => {
  const vals = Object.values(stats).filter(v => typeof v === 'number' && !isNaN(v))
  if (!vals.length) return 0
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}

function migrateStats(stats) {
  if (!stats || !('potenza' in stats)) return null
  const { potenza, ...rest } = stats
  return { ...rest, esplosivita: potenza }
}

async function run() {
  const snap = await db.collection(`organizations/${ORG_ID}/clients`).get()

  let migrated = 0
  let skipped  = 0

  for (const doc of snap.docs) {
    const data = doc.data()

    // Controlla se c'è potenza da migrare
    if (!data.stats || !('potenza' in data.stats)) {
      skipped++
      continue
    }

    const newStats = migrateStats(data.stats)
    const newCampionamenti = (data.campionamenti ?? []).map(camp => {
      const fixedStats = migrateStats(camp.stats)
      if (!fixedStats) return camp
      const newMedia = calcStatMedia(fixedStats)
      return { ...camp, stats: fixedStats, media: newMedia }
    })

    const newMedia   = calcStatMedia(newStats)
    const rankObj    = getRankFromMedia(newMedia)

    await doc.ref.update({
      stats:         newStats,
      campionamenti: newCampionamenti,
      media:         newMedia,
      rank:          rankObj.label,
      rankColor:     rankObj.color,
    })

    console.log(`✓ ${data.name} — potenza:${data.stats.potenza} → esplosivita:${newStats.esplosivita} (media ${data.media} → ${newMedia}, rank ${data.rank} → ${rankObj.label})`)
    migrated++
  }

  console.log(`\nFatto: ${migrated} migrati, ${skipped} già corretti.`)
  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
