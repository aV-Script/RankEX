/**
 * Import allievi VDP5 — campionamento 05-05-2026
 * Crea 14 client in produzione (org vdp5-tgtdu) con primo campionamento.
 *
 * Uso:
 *   node scripts/import-vdp5-05-05-26.mjs path/to/service-account.json
 *
 * Il service account si scarica da:
 *   Firebase Console → fitquest-60a09 → Impostazioni progetto → Account di servizio
 *   → "Genera nuova chiave privata"
 */

import { readFileSync } from 'fs'
import admin           from 'firebase-admin'

// ── Init ─────────────────────────────────────────────────────────────────────

const saPath = process.argv[2]
if (!saPath) {
  console.error('Uso: node scripts/import-vdp5-05-05-26.mjs <service-account.json>')
  process.exit(1)
}

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(saPath, 'utf-8'))) })
const db = admin.firestore()

const ORG_ID = 'vdp5-tgtdu'

// ── Rank ──────────────────────────────────────────────────────────────────────

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

// ── Tabelle percentili (solo test soccer usati in questo import, M) ───────────

const TABLES = {
  single_leg_stance: {
    M: { '7-9': { 0:10, 5:15, 10:22, 20:30, 30:36, 40:40, 50:48, 60:56, 70:64, 80:75, 90:82, 95:87, 100:90 } },
  },
  sprint_10m: {
    M: {
      '7': { 0:3.18, 5:3.09, 10:3.00, 20:2.83, 30:2.65, 40:2.48, 50:2.30, 60:2.23, 70:2.15, 80:2.08, 90:2.00, 95:1.96, 100:1.93 },
      '8': { 0:2.98, 5:2.89, 10:2.80, 20:2.63, 30:2.45, 40:2.28, 50:2.10, 60:2.05, 70:2.00, 80:1.95, 90:1.90, 95:1.88, 100:1.85 },
      '9': { 0:2.63, 5:2.56, 10:2.50, 20:2.38, 30:2.25, 40:2.13, 50:2.00, 60:1.95, 70:1.90, 80:1.85, 90:1.80, 95:1.78, 100:1.75 },
    },
  },
  shuttle_run_30m: {
    M: {
      '7': { 0:15.1, 5:14.8, 10:14.5, 20:13.9, 30:13.4, 40:12.8, 50:12.2, 60:11.8, 70:11.4, 80:10.9, 90:10.5, 95:10.3, 100:10.1 },
      '8': { 0:14.6, 5:14.3, 10:14.0, 20:13.5, 30:12.9, 40:12.4, 50:11.8, 60:11.4, 70:11.0, 80:10.6, 90:10.2, 95:10.0, 100:9.8  },
      '9': { 0:14.0, 5:13.8, 10:13.5, 20:13.0, 30:12.5, 40:11.9, 50:11.4, 60:11.0, 70:10.6, 80:10.2, 90:9.8,  95:9.6,  100:9.4  },
    },
  },
  t_test_mini: {
    M: {
      '7': { 0:15.1, 5:14.8, 10:14.5, 20:13.9, 30:13.4, 40:12.8, 50:12.2, 60:11.8, 70:11.4, 80:10.9, 90:10.5, 95:10.3, 100:10.1 },
      '8': { 0:14.6, 5:14.3, 10:14.0, 20:13.5, 30:12.9, 40:12.4, 50:11.8, 60:11.4, 70:11.0, 80:10.6, 90:10.2, 95:10.0, 100:9.8  },
      '9': { 0:14.0, 5:13.8, 10:13.5, 20:13.0, 30:12.5, 40:11.9, 50:11.4, 60:11.0, 70:10.6, 80:10.2, 90:9.8,  95:9.6,  100:9.4  },
    },
  },
  standing_long_jump: {
    M: {
      '7':  { 0:75,  5:80,  10:85,  20:95,  30:105, 40:115, 50:125, 60:135, 70:145, 80:155, 90:165, 95:170, 100:175 },
      '8':  { 0:84,  5:89,  10:94,  20:104, 30:114, 40:124, 50:134, 60:144, 70:154, 80:164, 90:174, 95:179, 100:184 },
      '9':  { 0:92,  5:97,  10:102, 20:112, 30:122, 40:132, 50:142, 60:152, 70:162, 80:172, 90:182, 95:187, 100:192 },
      '10': { 0:98,  5:103, 10:108, 20:118, 30:128, 40:138, 50:148, 60:158, 70:168, 80:178, 90:188, 95:193, 100:198 },
      '11': { 0:105, 5:110, 10:115, 20:125, 30:135, 40:145, 50:155, 60:165, 70:175, 80:185, 90:195, 95:200, 100:205 },
      '12': { 0:115, 5:120, 10:125, 20:135, 30:145, 40:155, 50:165, 60:175, 70:185, 80:195, 90:205, 95:210, 100:215 },
      '13': { 0:120, 5:125, 10:130, 20:140, 30:150, 40:160, 50:170, 60:180, 70:190, 80:200, 90:210, 95:215, 100:220 },
    },
  },
  y_balance_anterior: {
    M: { '10-13': { 0:40, 5:52, 10:56, 20:62, 30:66, 40:69, 50:72, 60:75, 70:78, 80:81, 90:85, 95:88, 100:100 } },
  },
  t_test_soccer_junior: {
    M: {
      '10': { 0:18.1, 5:17.8, 10:17.5, 20:16.9, 30:16.3, 40:15.6, 50:15.0, 60:14.6, 70:14.1, 80:13.7, 90:13.2, 95:13.0, 100:12.8 },
      '11': { 0:17.1, 5:16.8, 10:16.5, 20:15.9, 30:15.4, 40:14.8, 50:14.2, 60:13.8, 70:13.3, 80:12.9, 90:12.4, 95:12.2, 100:12.0 },
      '12': { 0:16.3, 5:16.1, 10:15.8, 20:15.3, 30:14.8, 40:14.2, 50:13.7, 60:13.3, 70:12.8, 80:12.4, 90:11.9, 95:11.7, 100:11.5 },
      '13': { 0:15.5, 5:15.2, 10:15.0, 20:14.6, 30:14.1, 40:13.7, 50:13.2, 60:12.8, 70:12.4, 80:11.9, 90:11.5, 95:11.3, 100:11.1 },
    },
  },
  six_minute_run: {
    M: {
      '10': { 0:810,  5:830,  10:850,  20:890,  30:925,  40:960,  50:1000, 60:1075, 70:1150, 80:1225, 90:1300, 95:1340, 100:1375 },
      '11': { 0:860,  5:880,  10:900,  20:940,  30:975,  40:1010, 50:1050, 60:1125, 70:1200, 80:1275, 90:1350, 95:1390, 100:1425 },
      '12': { 0:910,  5:930,  10:950,  20:990,  30:1025, 40:1060, 50:1100, 60:1175, 70:1250, 80:1325, 90:1400, 95:1440, 100:1475 },
      '13': { 0:960,  5:980,  10:1000, 20:1040, 30:1075, 40:1110, 50:1150, 60:1225, 70:1300, 80:1375, 90:1450, 95:1490, 100:1525 },
    },
  },
  sprint_20m: {
    M: {
      '10': { 0:4.45, 5:4.40, 10:4.35, 20:4.25, 30:4.15, 40:4.05, 50:3.95, 60:3.85, 70:3.75, 80:3.65, 90:3.55, 95:3.50, 100:3.45 },
      '11': { 0:4.65, 5:4.57, 10:4.50, 20:4.27, 30:4.03, 40:3.94, 50:3.85, 60:3.76, 70:3.67, 80:3.57, 90:3.48, 95:3.43, 100:3.39 },
      '12': { 0:4.50, 5:4.42, 10:4.35, 20:4.12, 30:3.88, 40:3.79, 50:3.70, 60:3.60, 70:3.50, 80:3.40, 90:3.30, 95:3.25, 100:3.20 },
      '13': { 0:4.40, 5:4.30, 10:4.20, 20:3.97, 30:3.74, 40:3.66, 50:3.58, 60:3.49, 70:3.39, 80:3.30, 90:3.20, 95:3.15, 100:3.11 },
    },
  },
}

// ── Direzione e fascia età per test ──────────────────────────────────────────

const DIRECTIONS = {
  single_leg_stance:    'direct',
  sprint_10m:           'inverse',
  shuttle_run_30m:      'inverse',
  t_test_mini:          'inverse',
  standing_long_jump:   'direct',
  y_balance_anterior:   'direct',
  t_test_soccer_junior: 'inverse',
  six_minute_run:       'direct',
  sprint_20m:           'inverse',
}

const AGE_GROUPS = {
  single_leg_stance:    ()    => '7-9',
  sprint_10m:           (age) => age <= 7 ? '7' : age <= 8 ? '8' : '9',
  shuttle_run_30m:      (age) => age <= 7 ? '7' : age <= 8 ? '8' : '9',
  t_test_mini:          (age) => age <= 7 ? '7' : age <= 8 ? '8' : '9',
  standing_long_jump:   (age) => age <= 7 ? '7' : age <= 8 ? '8' : age <= 9 ? '9' : age <= 10 ? '10' : age <= 11 ? '11' : age <= 12 ? '12' : '13',
  y_balance_anterior:   ()    => '10-13',
  t_test_soccer_junior: (age) => age <= 10 ? '10' : age <= 11 ? '11' : age <= 12 ? '12' : '13',
  six_minute_run:       (age) => age <= 10 ? '10' : age <= 11 ? '11' : age <= 12 ? '12' : '13',
  sprint_20m:           (age) => age <= 10 ? '10' : age <= 11 ? '11' : age <= 12 ? '12' : '13',
}

const STAT_MAP = {
  single_leg_stance:    'equilibrio',
  sprint_10m:           'velocita',
  shuttle_run_30m:      'resistenza',
  t_test_mini:          'agilita',
  standing_long_jump:   'esplosivita',
  y_balance_anterior:   'stabilita',
  t_test_soccer_junior: 'agilita',
  six_minute_run:       'resistenza',
  sprint_20m:           'velocita',
}

function calcPercentile(testKey, value, sex, age) {
  const group = AGE_GROUPS[testKey]?.(age)
  if (!group) return 0
  const percentiles = TABLES[testKey]?.[sex]?.[group] ?? TABLES[testKey]?.M?.[group]
  if (!percentiles) return 0
  const direction = DIRECTIONS[testKey] ?? 'direct'
  const sorted = Object.entries(percentiles)
    .map(([p, v]) => [parseFloat(p), parseFloat(v)])
    .sort((a, b) => direction === 'direct' ? a[1] - b[1] : b[1] - a[1])

  if (direction === 'direct') {
    if (value <= sorted[0][1])                      return sorted[0][0]
    if (value >= sorted[sorted.length - 1][1])      return sorted[sorted.length - 1][0]
    for (let i = 0; i < sorted.length - 1; i++) {
      const [p1, v1] = sorted[i], [p2, v2] = sorted[i + 1]
      if (value >= v1 && value <= v2)
        return Math.round(p1 + (value - v1) / (v2 - v1) * (p2 - p1))
    }
  } else {
    if (value >= sorted[0][1])                      return sorted[0][0]
    if (value <= sorted[sorted.length - 1][1])      return sorted[sorted.length - 1][0]
    for (let i = 0; i < sorted.length - 1; i++) {
      const [p1, v1] = sorted[i], [p2, v2] = sorted[i + 1]
      if (value <= v1 && value >= v2)
        return Math.round(p1 + (value - v1) / (v2 - v1) * (p2 - p1))
    }
  }
  return 0
}

// ── Dati allievi (da VDP5 Campionamento 05-05-26.xlsx) ───────────────────────

// Y Balance Anterior: formula bilaterale normalizzata su lunghezza arto
// score = ((ANT_dx / RightLeg) + (ANT_sx / LeftLeg)) / 2 * 100
const yba = (ant_dx, right, ant_sx, left) =>
  Math.round(((ant_dx / right) + (ant_sx / left)) / 2 * 100 * 100) / 100

const PULCINI = [
  { name: 'Granozzi A.', eta: 7, sesso: 'M', altezza: 128, peso: 39.1,  ruolo: 'midfielder',  nota: null,
    tests: { single_leg_stance: 20.62, sprint_10m: 2.97, t_test_mini: 10.38, standing_long_jump: 95,    shuttle_run_30m: 13.63 } },
  { name: 'Furno D.',     eta: 9, sesso: 'M', altezza: 127, peso: 24.9,  ruolo: 'midfielder',  nota: null,
    tests: { single_leg_stance: 66.38, sprint_10m: 2.66, t_test_mini: 8.59,  standing_long_jump: 155.3, shuttle_run_30m: 12.06 } },
  { name: 'Bisogno C.',   eta: 7, sesso: 'M', altezza: 120, peso: 24.5,  ruolo: 'defender',   nota: null,
    tests: { single_leg_stance: 19.84, sprint_10m: 3.0,  t_test_mini: 10.66, standing_long_jump: 110,   shuttle_run_30m: 13.47 } },
  { name: 'Luisi A.',     eta: 9, sesso: 'M', altezza: 134, peso: 28.05, ruolo: 'midfielder',  nota: null,
    tests: { single_leg_stance: 78.66, sprint_10m: 2.38, t_test_mini: 8.72,  standing_long_jump: 177,   shuttle_run_30m: 12.09 } },
  { name: 'Salmieri A.',  eta: 9, sesso: 'M', altezza: 126, peso: 22.57, ruolo: 'forward',    nota: null,
    tests: { single_leg_stance: 84.22, sprint_10m: 2.69, t_test_mini: 9.06,  standing_long_jump: 128,   shuttle_run_30m: 12.72 } },
  { name: 'Orrasi M.',    eta: 8, sesso: 'M', altezza: 132, peso: 31.0,  ruolo: 'goalkeeper', nota: null,
    tests: { single_leg_stance: 38.99, sprint_10m: 2.84, t_test_mini: 9.88,  standing_long_jump: 148,   shuttle_run_30m: 12.78 } },
  { name: 'Greco M.',     eta: 7, sesso: 'M', altezza: 128, peso: 24.1,  ruolo: 'defender',   nota: null,
    tests: { single_leg_stance: 90.0,  sprint_10m: 2.09, t_test_mini: 7.84,  standing_long_jump: 157,   shuttle_run_30m: 12.06 } },
]

const ESORDIENTI = [
  { name: 'Granozzi F.',    eta: 10, sesso: 'M', altezza: 145, peso: 52.8,  ruolo: 'defender',   nota: null,
    tests: { y_balance_anterior: yba(56, 78, 55, 77.8),  sprint_20m: 4.22, t_test_soccer_junior: 15.09, standing_long_jump: 134,   six_minute_run: 963    } },
  { name: 'Lambiase A.',    eta: 13, sesso: 'M', altezza: 153, peso: 42.75, ruolo: 'forward',    nota: null,
    tests: { y_balance_anterior: yba(53, 85.7, 51, 85.5), sprint_20m: 4.0,  t_test_soccer_junior: 12.49, standing_long_jump: 155.5, six_minute_run: 1079.6 } },
  { name: 'Muscari R.',     eta: 11, sesso: 'M', altezza: 146, peso: 50.1,  ruolo: 'defender',   nota: 'Backpedaling. Anteversione bacino.',
    tests: { y_balance_anterior: yba(61, 78.9, 59, 79.0), sprint_20m: 4.41, t_test_soccer_junior: 14.66, standing_long_jump: 138,   six_minute_run: 1062.5 } },
  { name: 'Bisogno D.',     eta: 13, sesso: 'M', altezza: 161, peso: 69.6,  ruolo: 'defender',   nota: null,
    tests: { y_balance_anterior: yba(53, 92.5, 57, 92.0), sprint_20m: 4.31, t_test_soccer_junior: 14.56, standing_long_jump: 130,   six_minute_run: 940.9  } },
  { name: 'Di Pasquale M.', eta: 10, sesso: 'M', altezza: 150, peso: 42.0,  ruolo: 'midfielder', nota: null,
    tests: { y_balance_anterior: yba(55, 79.9, 58, 79.9), sprint_20m: 3.63, t_test_soccer_junior: 14.31, standing_long_jump: 159,   six_minute_run: 1141.8 } },
  { name: 'Furno A.',       eta: 11, sesso: 'M', altezza: 138, peso: 30.65, ruolo: 'midfielder', nota: null,
    tests: { y_balance_anterior: yba(52, 75.0, 48, 75.0), sprint_20m: 3.97, t_test_soccer_junior: 13.47, standing_long_jump: 157,   six_minute_run: 1055.35} },
  { name: 'Pucci M.',       eta: 13, sesso: 'M', altezza: 165, peso: 81.4,  ruolo: 'goalkeeper', nota: null,
    tests: { y_balance_anterior: yba(64, 88.9, 64, 89.0), sprint_20m: 4.19, t_test_soccer_junior: 14.16, standing_long_jump: 128,   six_minute_run: 842.3  } },
]

// ── Builder documento cliente ─────────────────────────────────────────────────

function buildClientDoc(player, categoria, trainerId) {
  const stats = {}
  for (const [testKey, value] of Object.entries(player.tests)) {
    const stat = STAT_MAP[testKey]
    const pct  = calcPercentile(testKey, value, player.sesso, player.eta)
    // Se due test condividono la stessa stat (es. velocita) → prende il percentile più alto
    if (stat && (stats[stat] == null || pct > stats[stat])) stats[stat] = pct
  }

  const media   = calcStatMedia(stats)
  const rankObj = getRankFromMedia(media)
  const today   = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })

  return {
    name:            player.name,
    eta:             player.eta,
    sesso:           player.sesso,
    altezza:         player.altezza,
    peso:            player.peso,
    ruolo:           player.ruolo,
    categoria,
    profileType:     'tests_only',
    trainerId,
    level:           1,
    xp:              50,
    xpNext:          500,
    stats,
    rank:            rankObj.label,
    rankColor:       rankObj.color,
    media,
    campionamenti:   [{ date: today, stats, tests: player.tests, media }],
    log:             [{ date: today, action: 'Primo campionamento effettuato', xp: 50, ts: Date.now() }],
    sessionStreak:   0,
    lastSessionDate: null,
    baseXP:          50,
    sessionsPerWeek: 3,
    biaHistory:      [],
    lastBia:         null,
    wearableEnabled: false,
    wearable:        null,
  }
}

// ── Run ───────────────────────────────────────────────────────────────────────

async function run() {
  const orgRef  = db.collection('organizations').doc(ORG_ID)
  const orgSnap = await orgRef.get()
  if (!orgSnap.exists) { console.error('Org non trovata:', ORG_ID); process.exit(1) }

  const orgData   = orgSnap.data()
  const trainerId = orgData.ownerId
  console.log(`Org: "${orgData.name}" | trainer: ${trainerId}\n`)

  const clientsRef = orgRef.collection('clients')
  let created = 0

  const groups = [
    { players: PULCINI,    categoria: 'soccer_youth',  label: 'Pulcini' },
    { players: ESORDIENTI, categoria: 'soccer_junior', label: 'Esordienti' },
  ]

  for (const { players, categoria, label } of groups) {
    console.log(`--- ${label} ---`)
    for (const player of players) {
      const doc   = buildClientDoc(player, categoria, trainerId)
      const ref   = clientsRef.doc()
      const batch = db.batch()
      batch.set(ref, doc)
      batch.update(orgRef, { clientCount: admin.firestore.FieldValue.increment(1) })

      // Nota trainer (solo Muscari)
      if (player.nota) {
        const noteRef = ref.collection('notes').doc()
        batch.set(noteRef, {
          text:       player.nota,
          authorId:   trainerId,
          authorName: orgData.name,
          authorRole: 'trainer',
          parentId:   null,
          createdAt:  new Date(),
        })
      }

      await batch.commit()

      const statsLine = Object.entries(doc.stats)
        .map(([k, v]) => `${k}:${v}`)
        .join(' ')
      console.log(`  ✓ ${player.name.padEnd(18)} id:${ref.id} | media:${doc.media} rank:${doc.rank} | ${statsLine}`)
      created++
    }
    console.log()
  }

  console.log(`Completato: ${created} allievi creati in prod (org: ${ORG_ID})`)
  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
