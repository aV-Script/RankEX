/**
 * Patch DB — ricalcola agilita, media e rank per i Pulcini VDP5
 * colpiti dalla calibrazione tabelle t_test_mini (M7/M8/M9 aggiornati da Excel).
 *
 * Aggiorna ogni campionamento che contiene t_test_mini, poi riscrive
 * i root stats dal campionamento più recente.
 *
 * Uso:
 *   node scripts/recalcolo-t-test-mini-vdp5.mjs path/to/service-account.json [--dry-run]
 */

import { readFileSync } from 'fs'
import admin           from 'firebase-admin'

const saPath = process.argv[2]
if (!saPath) {
  console.error('Uso: node scripts/recalcolo-t-test-mini-vdp5.mjs <service-account.json> [--dry-run]')
  process.exit(1)
}
const DRY_RUN = process.argv.includes('--dry-run')

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(saPath, 'utf-8'))) })
const db = admin.firestore()

const ORG_ID = 'vdp5-tgtdu'

// ── Tabelle t_test_mini AGGIORNATE da Excel (mag 2026) ───────────────────────

const T_TEST_MINI_M = {
  '7': { 0:14.0, 5:13.5, 10:12.8, 20:12.2, 30:11.8, 40:11.4, 50:11.1, 60:10.8, 70:10.5, 80:10.1, 90:9.6, 95:9.3, 100:9.0 },
  '8': { 0:13.5, 5:13.0, 10:12.4, 20:12.0, 30:11.6, 40:11.2, 50:10.8, 60:10.5, 70:10.1, 80:9.8,  90:9.2, 95:8.9, 100:8.6 },
  '9': { 0:13.0, 5:12.5, 10:12.0, 20:11.4, 30:11.0, 40:10.7, 50:10.3, 60:10.0, 70:9.7,  80:9.4,  90:8.9, 95:8.6, 100:8.3 },
}

const T_TEST_MINI_F = {
  '7-9': { 0:17.0, 5:16.5, 10:16.0, 20:15.0, 30:14.2, 40:13.6, 50:13.0, 60:12.4, 70:11.8, 80:11.1, 90:10.4, 95:10.0, 100:8.5 },
}

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

function getTable(sesso, eta) {
  if (sesso === 'F') return T_TEST_MINI_F['7-9']
  const key = eta <= 7 ? '7' : eta <= 8 ? '8' : '9'
  return T_TEST_MINI_M[key]
}

function calcPercentile(value, table) {
  // inversa: valore più basso = meglio → sorted discendente per valore
  const sorted = Object.entries(table)
    .map(([p, v]) => [parseFloat(p), parseFloat(v)])
    .sort((a, b) => b[1] - a[1])

  if (value >= sorted[0][1])                       return sorted[0][0]
  if (value <= sorted[sorted.length - 1][1])       return sorted[sorted.length - 1][0]
  for (let i = 0; i < sorted.length - 1; i++) {
    const [p1, v1] = sorted[i], [p2, v2] = sorted[i + 1]
    if (value <= v1 && value >= v2)
      return Math.round(p1 + (value - v1) / (v2 - v1) * (p2 - p1))
  }
  return 0
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const clientsRef = db.collection('organizations').doc(ORG_ID).collection('clients')
  const snap = await clientsRef.where('categoria', '==', 'soccer_youth').get()

  if (snap.empty) { console.log('Nessun Pulcino trovato.'); process.exit(0) }

  let patched = 0

  for (const doc of snap.docs) {
    const d = doc.data()
    if (!d.campionamenti?.length) continue

    const table = getTable(d.sesso, d.eta)
    let changed = false

    const campionamenti = d.campionamenti.map((camp) => {
      const rawValue = camp.tests?.t_test_mini
      if (rawValue == null) return camp

      const newAgilita = calcPercentile(rawValue, table)
      const newStats   = { ...camp.stats, agilita: newAgilita }
      const newMedia   = calcStatMedia(newStats)

      console.log(
        `  ${d.name.padEnd(20)} eta:${d.eta} sesso:${d.sesso ?? '?'}` +
        ` t_test_mini:${rawValue}` +
        ` | agilita: ${camp.stats?.agilita ?? '—'} → ${newAgilita}` +
        ` | media camp: ${camp.media ?? '—'} → ${newMedia}`
      )
      changed = true
      return { ...camp, stats: newStats, media: newMedia }
    })

    if (!changed) continue

    // root stats: dal campionamento più recente che ha t_test_mini
    const latestWithTest = campionamenti.find(c => c.tests?.t_test_mini != null)
    const newRootAgilita = latestWithTest?.stats?.agilita ?? d.stats?.agilita
    const newRootStats   = { ...d.stats, agilita: newRootAgilita }
    const newRootMedia   = calcStatMedia(newRootStats)
    const newRank        = getRankFromMedia(newRootMedia)

    console.log(
      `    → root: media ${d.media} → ${newRootMedia} | rank ${d.rank} → ${newRank.label}\n`
    )

    if (!DRY_RUN) {
      await doc.ref.update({
        'stats.agilita': newRootAgilita,
        media:           newRootMedia,
        rank:            newRank.label,
        rankColor:       newRank.color,
        campionamenti,
      })
    }
    patched++
  }

  console.log(`\n${DRY_RUN ? '[DRY-RUN] ' : ''}${patched} documenti ${DRY_RUN ? 'da aggiornare' : 'aggiornati'}.`)
  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
