/**
 * Patch DB — ricalcola velocita, media e rank per gli Esordienti VDP5
 * colpiti dalla correzione tabelle sprint_20m (P0/P5/P10/P20 M 11-13).
 *
 * Atleti interessati (velocita era 0 con le vecchie tabelle):
 *   - Lambiase A.  (eta 13, sprint_20m 4.00) → velocita 0 → 19
 *   - Muscari R.   (eta 11, sprint_20m 4.41) → velocita 0 → 14
 *   - Bisogno D.   (eta 13, sprint_20m 4.31) → velocita 0 →  5
 *   - Pucci M.     (eta 13, sprint_20m 4.19) → velocita 0 → 10
 *
 * Uso:
 *   node scripts/recalcolo-sprint20m-vdp5.mjs path/to/service-account.json [--dry-run]
 */

import { readFileSync } from 'fs'
import admin           from 'firebase-admin'

const saPath = process.argv[2]
if (!saPath) {
  console.error('Uso: node scripts/recalcolo-sprint20m-vdp5.mjs <service-account.json> [--dry-run]')
  process.exit(1)
}
const DRY_RUN = process.argv.includes('--dry-run')

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(saPath, 'utf-8'))) })
const db = admin.firestore()

const ORG_ID = 'vdp5-tgtdu'

// ── Tabelle sprint_20m CORRETTE (M, solo fasce Esordienti) ───────────────────

const SPRINT_20M_M = {
  '10': { 0:4.45, 5:4.40, 10:4.35, 20:4.25, 30:4.15, 40:4.05, 50:3.95, 60:3.85, 70:3.75, 80:3.65, 90:3.55, 95:3.50, 100:3.45 },
  '11': { 0:4.65, 5:4.57, 10:4.50, 20:4.27, 30:4.03, 40:3.94, 50:3.85, 60:3.76, 70:3.67, 80:3.57, 90:3.48, 95:3.43, 100:3.39 },
  '12': { 0:4.50, 5:4.42, 10:4.35, 20:4.12, 30:3.88, 40:3.79, 50:3.70, 60:3.60, 70:3.50, 80:3.40, 90:3.30, 95:3.25, 100:3.20 },
  '13': { 0:4.40, 5:4.30, 10:4.20, 20:3.97, 30:3.74, 40:3.66, 50:3.58, 60:3.49, 70:3.39, 80:3.30, 90:3.20, 95:3.15, 100:3.11 },
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

function calcSprint20mPercentile(value, eta) {
  const key = eta <= 10 ? '10' : eta <= 11 ? '11' : eta <= 12 ? '12' : '13'
  const table = SPRINT_20M_M[key]
  // inversa: valore più basso = meglio → sorted discendente per valore
  const sorted = Object.entries(table)
    .map(([p, v]) => [parseFloat(p), parseFloat(v)])
    .sort((a, b) => b[1] - a[1])

  if (value >= sorted[0][1])                      return sorted[0][0]
  if (value <= sorted[sorted.length - 1][1])      return sorted[sorted.length - 1][0]
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
  const snap = await clientsRef.where('categoria', '==', 'soccer_junior').get()

  if (snap.empty) { console.log('Nessun Esordienti trovato.'); process.exit(0) }

  let patched = 0

  for (const doc of snap.docs) {
    const d = doc.data()
    const sprint20m = d.campionamenti?.[0]?.tests?.sprint_20m
    if (sprint20m == null) continue

    const newVelocita = calcSprint20mPercentile(sprint20m, d.eta)
    const oldVelocita = d.stats?.velocita ?? null

    if (oldVelocita === newVelocita) {
      console.log(`  — ${d.name.padEnd(18)} velocita già corretta: ${newVelocita}`)
      continue
    }

    const newStats  = { ...d.stats, velocita: newVelocita }
    const newMedia  = calcStatMedia(newStats)
    const newRank   = getRankFromMedia(newMedia)

    // aggiorna anche campionamenti[0].stats e campionamenti[0].media
    const campionamenti = d.campionamenti ? [...d.campionamenti] : []
    if (campionamenti[0]) {
      campionamenti[0] = {
        ...campionamenti[0],
        stats: { ...campionamenti[0].stats, velocita: newVelocita },
        media: newMedia,
      }
    }

    console.log(
      `  ✓ ${d.name.padEnd(18)} eta:${d.eta} sprint_20m:${sprint20m}` +
      ` | velocita: ${oldVelocita} → ${newVelocita}` +
      ` | media: ${d.media} → ${newMedia}` +
      ` | rank: ${d.rank} → ${newRank.label}`
    )

    if (!DRY_RUN) {
      await doc.ref.update({
        'stats.velocita': newVelocita,
        media:            newMedia,
        rank:             newRank.label,
        rankColor:        newRank.color,
        campionamenti,
      })
    }
    patched++
  }

  console.log(`\n${DRY_RUN ? '[DRY-RUN] ' : ''}${patched} documenti ${DRY_RUN ? 'da aggiornare' : 'aggiornati'}.`)
  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
