/**
 * Import clienti da Excel → Firebase production (Admin SDK)
 *
 * Uso:
 *   node scripts/import-clients-prod.mjs <temp-password> [--dry-run]
 *
 * Richiede:
 *   - service-account.json nella root del progetto
 *   - rankex_dataset_template (2).xlsx nella root del progetto
 *
 * Esempio:
 *   node scripts/import-clients-prod.mjs Welcome1! --dry-run
 *   node scripts/import-clients-prod.mjs Welcome1!
 */

import { resolve, dirname }  from 'path'
import { fileURLToPath }     from 'url'
import { createRequire }     from 'module'

const require    = createRequire(import.meta.url)
const __dirname  = dirname(fileURLToPath(import.meta.url))
const ROOT       = resolve(__dirname, '..')

const admin = require('firebase-admin')
const XLSX  = require('xlsx')

// ── Config ────────────────────────────────────────────────────────────────────

const ORG_ID       = 'vdp5-tgtdu'
const TRAINER_ID   = 'RwXH0Im2F0WNCgjd12gxBxTWnqp2'
const EMAIL_DOMAIN = 'rankex.vdp5.it'
const EXCEL_FILE   = resolve(ROOT, 'rankex_dataset_template.xlsx')
const SA_FILE      = resolve(ROOT, 'service-account.json')
const TEST_DATE    = '05.05.2026'

const XP_FIRST_CAMP     = 50
const XP_PER_LEVEL_MULT = 1.08
const XP_NEXT_START     = 500

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

function getRank(media) {
  return RANKS.find(r => media >= r.min) ?? RANKS[RANKS.length - 1]
}

// ── Percentile tables ─────────────────────────────────────────────────────────

const TABLES = {
  single_leg_stance: {
    M: { '7-9': { 0:20, 5:25, 10:30, 20:38, 30:45, 40:50, 50:55, 60:60, 70:65, 80:77, 90:82, 95:87, 100:90 } },
    F: { '7-9': { 0:20, 5:25, 10:30, 20:38, 30:45, 40:50, 50:55, 60:60, 70:65, 80:77, 90:82, 95:87, 100:90 } },
  },
  sprint_10m: {
    M: { '7-9': { 100:2.00, 95:2.20, 90:2.26, 80:2.39, 70:2.50, 60:2.60, 50:2.70, 40:2.82, 30:2.94, 20:3.10, 10:3.30, 5:3.40, 0:3.50 } },
    F: { '7-9': { 100:2.00, 95:2.20, 90:2.26, 80:2.39, 70:2.50, 60:2.60, 50:2.70, 40:2.82, 30:2.94, 20:3.10, 10:3.30, 5:3.40, 0:3.50 } },
  },
  t_test_mini: {
    M: { '7-9': { 100:8.5, 95:10.0, 90:10.4, 80:11.1, 75:11.5, 70:11.8, 60:12.4, 50:13.0, 40:13.6, 30:14.2, 25:14.5, 20:15.0, 10:16.0, 5:16.5, 0:17.0 } },
    F: { '7-9': { 100:8.5, 95:10.0, 90:10.4, 80:11.1, 75:11.5, 70:11.8, 60:12.4, 50:13.0, 40:13.6, 30:14.2, 25:14.5, 20:15.0, 10:16.0, 5:16.5, 0:17.0 } },
  },
  standing_long_jump: {
    M: {
      '7-9':   { 0:45,  5:55,  10:63,  20:73,  25:78,  30:82,  40:90,  50:100, 60:110, 70:118, 75:125, 80:130, 90:140, 95:155, 100:175 },
      '9-10':  { 0:96,  5:102, 10:108, 20:120, 30:125, 40:131, 50:138, 60:143, 70:150, 80:160, 90:176, 95:184, 100:193 },
      '11-12': { 0:98,  5:108, 10:117, 20:137, 30:143, 40:148, 50:153, 60:156, 70:164, 80:168, 90:178, 95:183, 100:187 },
      '13-14': { 0:121, 5:127, 10:133, 20:145, 30:153, 40:160, 50:167, 60:177, 70:181, 80:188, 90:197, 95:202, 100:206 },
    },
    F: {
      '7-9':   { 0:45,  5:55,  10:63,  20:73,  25:78,  30:82,  40:90,  50:100, 60:110, 70:118, 75:125, 80:130, 90:140, 95:155, 100:175 },
      '9-10':  { 0:96,  5:101, 10:105, 20:114, 30:120, 40:125, 50:130, 60:139, 70:145, 80:153, 90:165, 95:171, 100:177 },
      '11-12': { 0:90,  5:98,  10:106, 20:122, 30:140, 40:144, 50:152, 60:155, 70:160, 80:165, 90:175, 95:180, 100:185 },
      '13-14': { 0:109, 5:113, 10:116, 20:123, 30:128, 40:133, 50:140, 60:147, 70:153, 80:160, 90:173, 95:180, 100:186 },
    },
  },
  shuttle_run_30m: {
    M: { '7-9': { 100:11.0, 95:11.5, 90:12.0, 80:12.5, 75:12.8, 70:13.0, 60:13.5, 50:14.2, 40:15.0, 30:15.8, 25:16.2, 20:16.8, 10:17.8, 5:18.5, 0:20.0 } },
    F: { '7-9': { 100:11.0, 95:11.5, 90:12.0, 80:12.5, 75:12.8, 70:13.0, 60:13.5, 50:14.2, 40:15.0, 30:15.8, 25:16.2, 20:16.8, 10:17.8, 5:18.5, 0:20.0 } },
  },
  y_balance_anterior: {
    M: { '10-13': { 0:40, 5:52, 10:56, 20:62, 30:66, 40:69, 50:72, 60:75, 70:78, 80:81, 90:85, 95:88, 100:100 } },
    F: { '10-13': { 0:40, 5:52, 10:56, 20:62, 30:66, 40:69, 50:72, 60:75, 70:78, 80:81, 90:85, 95:88, 100:100 } },
  },
  sprint_20m: {
    M: {
      '10-11': { 100:3.93, 95:3.96, 90:4.00, 80:4.07, 70:4.15, 60:4.24, 50:4.33, 40:4.41, 30:4.48, 20:4.70, 10:5.06, 5:5.24, 0:5.42 },
      '12-13': { 100:3.70, 95:3.74, 90:3.77, 80:3.84, 70:3.91, 60:3.98, 50:4.06, 40:4.13, 30:4.20, 20:4.37, 10:4.64, 5:4.78, 0:4.91 },
    },
    F: {
      '10-11': { 100:3.93, 95:3.96, 90:4.00, 80:4.07, 70:4.15, 60:4.24, 50:4.33, 40:4.41, 30:4.48, 20:4.70, 10:5.06, 5:5.24, 0:5.42 },
      '12-13': { 100:3.70, 95:3.74, 90:3.77, 80:3.84, 70:3.91, 60:3.98, 50:4.06, 40:4.13, 30:4.20, 20:4.37, 10:4.64, 5:4.78, 0:4.91 },
    },
  },
  t_test_soccer_junior: {
    M: { '10-13': { 100:8.5, 95:9.8, 90:10.5, 80:11.2, 75:11.6, 70:12.0, 60:12.5, 50:13.0, 40:13.5, 30:14.0, 25:14.5, 20:15.0, 10:15.8, 5:16.2, 0:17.0 } },
    F: { '10-13': { 100:8.5, 95:9.8, 90:10.5, 80:11.2, 75:11.6, 70:12.0, 60:12.5, 50:13.0, 40:13.5, 30:14.0, 25:14.5, 20:15.0, 10:15.8, 5:16.2, 0:17.0 } },
  },
  six_minute_run: {
    M: { '10-13': { 0:700, 5:760, 10:820, 20:940, 30:1030, 40:1090, 50:1150, 60:1230, 70:1310, 80:1388, 90:1463, 95:1500, 100:1800 } },
    F: { '10-13': { 0:700, 5:760, 10:820, 20:940, 30:1030, 40:1090, 50:1150, 60:1230, 70:1310, 80:1388, 90:1463, 95:1500, 100:1800 } },
  },
}

// ── Test config ───────────────────────────────────────────────────────────────

const SOCCER_YOUTH_TESTS = [
  { key: 'single_leg_stance',  stat: 'equilibrio',  direction: 'direct',  ageGroup: () => '7-9' },
  { key: 'sprint_10m',         stat: 'velocita',    direction: 'inverse', ageGroup: () => '7-9' },
  { key: 't_test_mini',        stat: 'agilita',     direction: 'inverse', ageGroup: () => '7-9' },
  { key: 'standing_long_jump', stat: 'esplosivita', direction: 'direct',  ageGroup: (age) => age <= 9 ? '7-9' : '9-10' },
  { key: 'shuttle_run_30m',    stat: 'resistenza',  direction: 'inverse', ageGroup: () => '7-9' },
]

const SOCCER_JUNIOR_TESTS = [
  {
    key: 'y_balance_anterior', stat: 'stabilita', direction: 'direct', ageGroup: () => '10-13',
    variables: ['ANT_dx', 'ANT_sx', 'lunghezza_dx', 'lunghezza_sx'],
    formula: (v) => ((v.ANT_dx / v.lunghezza_dx) + (v.ANT_sx / v.lunghezza_sx)) / 2 * 100,
  },
  { key: 'sprint_20m',             stat: 'velocita',    direction: 'inverse', ageGroup: (age) => age <= 11 ? '10-11' : '12-13' },
  { key: 't_test_soccer_junior',   stat: 'agilita',     direction: 'inverse', ageGroup: () => '10-13' },
  { key: 'standing_long_jump',     stat: 'esplosivita', direction: 'direct',  ageGroup: (age) => age <= 10 ? '9-10' : age <= 12 ? '11-12' : '13-14' },
  { key: 'six_minute_run',         stat: 'resistenza',  direction: 'direct',  ageGroup: () => '10-13' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeForEmail(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/'/g, '').replace(/[^a-z0-9]/g, '')
}

function generateEmail(nameStr) {
  const parts   = nameStr.trim().split(/\s+/)
  const initial = normalizeForEmail(parts[parts.length - 1].replace(/\./g, ''))
  const surname = parts.slice(0, -1).map(p => normalizeForEmail(p)).join('')
  return initial ? `${surname}.${initial}@${EMAIL_DOMAIN}` : `${surname}@${EMAIL_DOMAIN}`
}

const ROLE_MAP = {
  'Centrocampista': 'midfielder',
  'Difensore':      'defender',
  'Attaccante':     'forward',
  'Portiere':       'goalkeeper',
}

function getCategoriaFromAge(age) {
  if (age < 10)  return 'soccer_youth'
  if (age <= 13) return 'soccer_junior'
  return 'soccer'
}

function parseFloatIT(val) {
  if (val === null || val === undefined) return null
  const n = parseFloat(String(val).replace(',', '.'))
  return isNaN(n) ? null : n
}

function formatDateIT(dateStr) {
  const [day, month] = dateStr.split('.')
  const d = new Date(2026, parseInt(month, 10) - 1, parseInt(day, 10))
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
}

function calcPercentile(testKey, rawValue, sesso, age, direction, ageGroupFn) {
  const table = TABLES[testKey]?.[sesso]
  if (!table) return null
  const group = ageGroupFn(age)
  if (!group) return null
  const percentiles = table[group]
  if (!percentiles) return null

  const sorted = Object.entries(percentiles)
    .map(([p, v]) => [parseFloat(p), parseFloat(v)])
    .sort((a, b) => direction === 'direct' ? a[1] - b[1] : b[1] - a[1])

  if (direction === 'direct') {
    if (rawValue <= sorted[0][1])                         return sorted[0][0]
    if (rawValue >= sorted[sorted.length - 1][1])         return sorted[sorted.length - 1][0]
    for (let i = 0; i < sorted.length - 1; i++) {
      const [p1, v1] = sorted[i], [p2, v2] = sorted[i + 1]
      if (rawValue >= v1 && rawValue <= v2)
        return Math.round(p1 + (rawValue - v1) / (v2 - v1) * (p2 - p1))
    }
  } else {
    if (rawValue >= sorted[0][1])                         return sorted[0][0]
    if (rawValue <= sorted[sorted.length - 1][1])         return sorted[sorted.length - 1][0]
    for (let i = 0; i < sorted.length - 1; i++) {
      const [p1, v1] = sorted[i], [p2, v2] = sorted[i + 1]
      if (rawValue <= v1 && rawValue >= v2)
        return Math.round(p1 + (rawValue - v1) / (v2 - v1) * (p2 - p1))
    }
  }
  return null
}

function calcLevelProgression(xp, xpNext = XP_NEXT_START, level = 1) {
  let cur = xp, next = xpNext, lvl = level
  while (cur >= next) { cur -= next; next = Math.round(next * XP_PER_LEVEL_MULT); lvl++ }
  return { xp: cur, xpNext: next, level: lvl }
}

// ── Excel parsing ─────────────────────────────────────────────────────────────

function parseSheet1(rows) {
  return rows
    .filter((r, i) => i > 0 && typeof r[0] === 'string' && r[2])
    .map(r => ({
      name: r[0], ruolo: ROLE_MAP[r[1]] ?? r[1], birthYear: parseInt(r[2], 10),
      sesso: r[3] ?? 'M', altezza: r[4] ?? null, peso: r[5] ?? null,
      noteTrainer: r[11] ?? null, gruppo: 'soccer_youth',
      rawTests: {
        single_leg_stance:  parseFloatIT(r[6]),
        sprint_10m:         parseFloatIT(r[7]),
        t_test_mini:        parseFloatIT(r[8]),
        standing_long_jump: parseFloatIT(r[9]),
        shuttle_run_30m:    parseFloatIT(r[10]),
      },
    }))
}

function parseSheet2(rows) {
  return rows
    .filter((r, i) => i > 0 && typeof r[0] === 'string' && r[2])
    .map(r => ({
      name: r[0], ruolo: ROLE_MAP[r[1]] ?? r[1], birthYear: parseInt(r[2], 10),
      sesso: r[3] ?? 'M', altezza: r[4] ?? null, peso: r[5] ?? null,
      noteTrainer: r[12] ?? null, gruppo: 'soccer_junior',
      rawTests: {
        y_balance_anterior: {
          ANT_dx: parseFloatIT(r[6]), ANT_sx: parseFloatIT(r[7]),
          lunghezza_sx: parseFloatIT(r[14]), lunghezza_dx: parseFloatIT(r[15]),
        },
        sprint_20m:           parseFloatIT(r[8]),
        t_test_soccer_junior: parseFloatIT(r[9]),
        standing_long_jump:   parseFloatIT(r[10]),
        six_minute_run:       parseFloatIT(r[11]),
      },
    }))
}

function parseExcel() {
  const wb     = XLSX.readFile(EXCEL_FILE)
  const sheet1 = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 })
  const sheet2 = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[1]], { header: 1 })
  return [...parseSheet1(sheet1), ...parseSheet2(sheet2)]
}

// ── Build client document ─────────────────────────────────────────────────────

function buildClientDoc(player) {
  const age      = 2026 - player.birthYear
  const sesso    = player.sesso
  const tests    = player.gruppo === 'soccer_youth' ? SOCCER_YOUTH_TESTS : SOCCER_JUNIOR_TESTS
  const dateStr  = formatDateIT(TEST_DATE)
  const categoria = getCategoriaFromAge(age)

  const stats = {}, testValues = {}

  for (const test of tests) {
    const raw = player.rawTests[test.key]
    if (test.formula && test.variables) {
      const vars = raw
      if (vars && test.variables.every(k => vars[k] !== null)) {
        const computed = test.formula(vars)
        stats[test.stat] = calcPercentile(test.key, computed, sesso, age, test.direction, test.ageGroup) ?? 0
        test.variables.forEach(k => { testValues[k] = vars[k] })
      } else {
        stats[test.stat] = 0
      }
    } else {
      if (raw !== null && raw !== undefined) {
        stats[test.stat] = calcPercentile(test.key, raw, sesso, age, test.direction, test.ageGroup) ?? 0
        testValues[test.stat] = raw
      } else {
        stats[test.stat] = 0
      }
    }
  }

  const media   = Math.round(Object.values(stats).reduce((s, v) => s + v, 0) / Object.values(stats).length)
  const rankObj = getRank(media)
  const { xp, xpNext, level } = calcLevelProgression(XP_FIRST_CAMP)
  const ts = new Date('2026-05-05').getTime()

  return {
    name:          player.name,
    email:         generateEmail(player.name),
    dataNascita:   `${player.birthYear}-01-01`,
    eta:           age,
    sesso,
    altezza:       player.altezza,
    peso:          player.peso,
    ruolo:         player.ruolo,
    categoria,
    profileType:   'tests_only',
    trainerId:     TRAINER_ID,
    clientAuthUid: null,          // aggiornato dopo la creazione Auth
    level, xp, xpNext,
    rank:          rankObj.label,
    rankColor:     rankObj.color,
    media,
    stats,
    campionamenti: [{ date: dateStr, stats, tests: testValues, media }],
    log:           [{ date: dateStr, action: 'Primo campionamento effettuato', xp: XP_FIRST_CAMP, ts }],
    sessionsPerWeek: 3,
    biaHistory:    [],
    lastBia:       null,
    createdAt:     new Date().toISOString(),
  }
}

// ── Preview ───────────────────────────────────────────────────────────────────

function printPreview(players) {
  const pad = (s, n) => String(s ?? '—').padEnd(n)
  console.log(`\nProgetto: fitquest-60a09  |  Org: ${ORG_ID}  |  Clienti: ${players.length}\n`)
  console.log(pad('Nome', 22) + pad('Email', 32) + pad('Età', 5) + pad('Cat.', 14) + pad('Ruolo', 13) + pad('Media', 7) + 'Rank')
  console.log('─'.repeat(96))
  for (const p of players)
    console.log(pad(p.name, 22) + pad(p.email, 32) + pad(p.eta, 5) + pad(p.categoria, 14) + pad(p.ruolo, 13) + pad(p.media, 7) + p.rank)
  console.log('\nDettaglio stats (percentili):')
  console.log('─'.repeat(96))
  for (const p of players)
    console.log(pad(p.name, 22) + Object.entries(p.stats).map(([k, v]) => `${k.slice(0,4)}:${v}`).join('  '))
  const withNotes = players.filter(p => p._noteTrainer)
  if (withNotes.length) {
    console.log('\nNote trainer:')
    withNotes.forEach(p => console.log(`  ${p.name}: ${p._noteTrainer}`))
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args       = process.argv.slice(2)
  const dryRun     = args.includes('--dry-run')
  const [tempPassword] = args.filter(a => a !== '--dry-run')

  if (!dryRun && !tempPassword) {
    console.error('Uso: node scripts/import-clients-prod.mjs <temp-password> [--dry-run]')
    process.exit(1)
  }

  // Parse Excel e build docs
  const raw     = parseExcel()
  const players = raw.map(p => ({ ...buildClientDoc(p), _noteTrainer: p.noteTrainer }))

  printPreview(players)

  if (dryRun) {
    console.log('\n[DRY RUN] Nessuna scrittura effettuata.')
    return
  }

  // ── Init Admin SDK ────────────────────────────────────────────────────────────
  const serviceAccount = require(SA_FILE)
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  const db   = admin.firestore()
  const auth = admin.auth()

  console.log('\nInizio caricamento...\n')

  const created = [], errors = []

  for (let i = 0; i < players.length; i++) {
    const player = players[i]
    const { _noteTrainer, ...clientDoc } = player
    process.stdout.write(`[${i + 1}/${players.length}] ${player.name.padEnd(22)}`)

    try {
      // Crea account Auth
      const userRecord = await auth.createUser({
        email:         player.email,
        password:      tempPassword,
        displayName:   player.name,
      })
      const uid = userRecord.uid

      // ID documento cliente
      const clientRef = db.collection(`organizations/${ORG_ID}/clients`).doc()
      const clientId  = clientRef.id

      // Batch Firestore
      const batch = db.batch()

      batch.set(db.doc(`users/${uid}`), {
        role:               'client',
        orgId:              ORG_ID,
        clientId,
        trainerId:          TRAINER_ID,
        mustChangePassword: true,
      })

      batch.set(clientRef, { ...clientDoc, clientAuthUid: uid })

      await batch.commit()

      created.push({ name: player.name, uid, clientId })
      console.log(`✅  uid=${uid.slice(0, 8)}…`)
    } catch (e) {
      errors.push({ name: player.name, error: e.message })
      console.log(`❌  ${e.message}`)
    }
  }

  // Aggiorna clientCount
  if (created.length > 0) {
    await db.doc(`organizations/${ORG_ID}`).update({
      clientCount: admin.firestore.FieldValue.increment(created.length),
    })
    console.log(`\nclientCount +${created.length}`)
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`✅  Creati:  ${created.length}/${players.length}`)
  if (errors.length) {
    console.log(`❌  Errori:  ${errors.length}`)
    errors.forEach(e => console.log(`    ${e.name}: ${e.error}`))
  }
  console.log('─'.repeat(50))

  process.exit(0)
}

main().catch(err => {
  console.error('\nErrore fatale:', err.message ?? err)
  process.exit(1)
})
