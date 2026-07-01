/**
 * Ricalcola campionamenti dopo la correzione tabelle percentili (giu 2026).
 * Test interessati: sprint_20m (velocita), standing_long_jump (esplosivita), t_test_mini (agilita)
 *
 * Cosa viene aggiornato:
 *   - campionamenti[*].stats.[stat]  → percentile ricalcolato
 *   - campionamenti[*].media         → media ricalcolata sui nuovi stats
 *   - client.stats.[stat]            → da campionamenti[0] (solo se modificato)
 *   - client.media / rank / rankColor → ricalcolati da campionamenti[0]
 *
 * Cosa NON viene toccato: xp, xpNext, level, log, biaHistory, tutto il resto.
 *
 * Uso:
 *   node scripts/recalcolo-campionamenti.mjs <service-account.json> [--dry-run] [--org <orgId>]
 */

import { readFileSync } from 'fs'
import admin           from 'firebase-admin'

// ── CLI ───────────────────────────────────────────────────────────────────────

const saPath = process.argv[2]
if (!saPath) {
  console.error('Uso: node scripts/recalcolo-campionamenti.mjs <service-account.json> [--dry-run] [--org <orgId>]')
  process.exit(1)
}
const DRY_RUN  = process.argv.includes('--dry-run')
const orgIndex = process.argv.indexOf('--org')
const ONLY_ORG = orgIndex !== -1 ? process.argv[orgIndex + 1] : null

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(saPath, 'utf-8'))) })
const db = admin.firestore()

// ── RANKS (da constants/index.js) ────────────────────────────────────────────

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

// ── TABELLE CORRETTE ─────────────────────────────────────────────────────────
// Replica esatta di src/utils/tables.js per i 3 test modificati.

const SPRINT_20M = {
  M: {
    '7':     { 0:4.90, 5:4.85, 10:4.80, 20:4.70, 30:4.60, 40:4.50, 50:4.40, 60:4.30, 70:4.20, 80:4.10, 90:4.00, 95:3.95, 100:3.90 },
    '8':     { 0:4.75, 5:4.70, 10:4.65, 20:4.55, 30:4.45, 40:4.35, 50:4.25, 60:4.15, 70:4.05, 80:3.95, 90:3.85, 95:3.80, 100:3.75 },
    '9':     { 0:4.60, 5:4.55, 10:4.50, 20:4.40, 30:4.30, 40:4.20, 50:4.10, 60:4.00, 70:3.90, 80:3.80, 90:3.70, 95:3.65, 100:3.60 },
    '10':    { 0:4.45, 5:4.40, 10:4.35, 20:4.25, 30:4.15, 40:4.05, 50:3.95, 60:3.85, 70:3.75, 80:3.65, 90:3.55, 95:3.50, 100:3.45 },
    '11':    { 0:4.29, 5:4.24, 10:4.20, 20:4.11, 30:4.03, 40:3.94, 50:3.85, 60:3.76, 70:3.67, 80:3.57, 90:3.48, 95:3.43, 100:3.39 },
    '12':    { 0:4.14, 5:4.09, 10:4.05, 20:3.96, 30:3.88, 40:3.79, 50:3.70, 60:3.60, 70:3.50, 80:3.40, 90:3.30, 95:3.25, 100:3.20 },
    '13':    { 0:3.98, 5:3.94, 10:3.90, 20:3.82, 30:3.74, 40:3.66, 50:3.58, 60:3.49, 70:3.39, 80:3.30, 90:3.20, 95:3.15, 100:3.11 },
    '14-15': { 0:4.25, 5:3.98, 10:3.86, 20:3.72, 30:3.62, 40:3.55, 50:3.48, 60:3.42, 70:3.35, 80:3.25, 90:3.14, 95:3.00, 100:2.85 },
    '16-17': { 0:4.15, 5:3.90, 10:3.78, 20:3.65, 30:3.55, 40:3.46, 50:3.38, 60:3.30, 70:3.22, 80:3.12, 90:3.00, 95:2.88, 100:2.75 },
    '18-35': { 0:4.80, 5:4.40, 10:4.15, 20:3.90, 30:3.70, 40:3.55, 50:3.40, 60:3.30, 70:3.20, 80:3.10, 90:2.95, 95:2.80, 100:2.65 },
    '36-50': { 0:5.20, 5:4.75, 10:4.50, 20:4.20, 30:4.00, 40:3.85, 50:3.68, 60:3.55, 70:3.42, 80:3.30, 90:3.15, 95:3.00, 100:2.85 },
  },
  F: {
    '8':     { 0:5.20, 5:4.90, 10:4.75, 20:4.58, 30:4.45, 40:4.36, 50:4.28, 60:4.20, 70:4.13, 80:4.05, 90:3.90, 95:3.75, 100:3.60 },
    '9':     { 0:5.20, 5:4.90, 10:4.75, 20:4.58, 30:4.45, 40:4.36, 50:4.28, 60:4.20, 70:4.13, 80:4.05, 90:3.90, 95:3.75, 100:3.60 },
    '10':    { 0:4.85, 5:4.55, 10:4.38, 20:4.20, 30:4.10, 40:4.00, 50:3.90, 60:3.82, 70:3.75, 80:3.65, 90:3.53, 95:3.38, 100:3.20 },
    '11':    { 0:4.85, 5:4.55, 10:4.38, 20:4.20, 30:4.10, 40:4.00, 50:3.90, 60:3.82, 70:3.75, 80:3.65, 90:3.53, 95:3.38, 100:3.20 },
    '12':    { 0:4.45, 5:4.18, 10:4.05, 20:3.90, 30:3.80, 40:3.72, 50:3.65, 60:3.58, 70:3.50, 80:3.40, 90:3.28, 95:3.15, 100:3.00 },
    '13':    { 0:4.45, 5:4.18, 10:4.05, 20:3.90, 30:3.80, 40:3.72, 50:3.65, 60:3.58, 70:3.50, 80:3.40, 90:3.28, 95:3.15, 100:3.00 },
    '14-15': { 0:4.25, 5:3.98, 10:3.86, 20:3.72, 30:3.62, 40:3.55, 50:3.48, 60:3.42, 70:3.35, 80:3.25, 90:3.14, 95:3.00, 100:2.85 },
    '16-17': { 0:4.15, 5:3.90, 10:3.78, 20:3.65, 30:3.55, 40:3.46, 50:3.38, 60:3.30, 70:3.22, 80:3.12, 90:3.00, 95:2.88, 100:2.75 },
    '18-35': { 0:5.40, 5:4.95, 10:4.70, 20:4.40, 30:4.18, 40:4.00, 50:3.85, 60:3.72, 70:3.60, 80:3.48, 90:3.30, 95:3.15, 100:3.00 },
    '36-50': { 0:5.70, 5:5.25, 10:5.00, 20:4.68, 30:4.45, 40:4.28, 50:4.12, 60:3.98, 70:3.85, 80:3.72, 90:3.55, 95:3.38, 100:3.20 },
  },
}

const STANDING_LONG_JUMP = {
  M: {
    '7':     { 0:75,  5:80,  10:85,  20:95,  30:105, 40:115, 50:125, 60:135, 70:145, 80:155, 90:165, 95:170, 100:175 },
    '8':     { 0:84,  5:89,  10:94,  20:104, 30:114, 40:124, 50:134, 60:144, 70:154, 80:164, 90:174, 95:179, 100:184 },
    '9':     { 0:92,  5:97,  10:102, 20:112, 30:122, 40:132, 50:142, 60:152, 70:162, 80:172, 90:182, 95:187, 100:192 },
    '10':    { 0:98,  5:103, 10:108, 20:118, 30:128, 40:138, 50:148, 60:158, 70:168, 80:178, 90:188, 95:193, 100:198 },
    '11':    { 0:105, 5:110, 10:115, 20:125, 30:135, 40:145, 50:155, 60:165, 70:175, 80:185, 90:195, 95:200, 100:205 },
    '12':    { 0:115, 5:120, 10:125, 20:135, 30:145, 40:155, 50:165, 60:175, 70:185, 80:195, 90:205, 95:210, 100:215 },
    '13':    { 0:120, 5:125, 10:130, 20:140, 30:150, 40:160, 50:170, 60:180, 70:190, 80:200, 90:210, 95:215, 100:220 },
    '14':    { 0:141, 5:146, 10:150, 20:159, 30:168, 40:176, 50:185, 60:193, 70:201, 80:208, 90:216, 95:220, 100:224 },
    '15':    { 0:157, 5:160, 10:164, 20:172, 30:179, 40:187, 50:194, 60:202, 70:209, 80:217, 90:224, 95:228, 100:232 },
    '16':    { 0:164, 5:168, 10:172, 20:180, 30:188, 40:196, 50:204, 60:211, 70:217, 80:224, 90:230, 95:233, 100:237 },
    '17':    { 0:170, 5:174, 10:178, 20:186, 30:194, 40:202, 50:210, 60:216, 70:223, 80:229, 90:235, 95:238, 100:241 },
    '18-35': { 0:120, 5:145, 10:160, 20:175, 30:188, 40:198, 50:208, 60:218, 70:228, 80:240, 90:255, 95:268, 100:290 },
    '36-50': { 0:100, 5:128, 10:145, 20:160, 30:172, 40:182, 50:192, 60:202, 70:212, 80:224, 90:238, 95:250, 100:270 },
  },
  F: {
    '7':     { 0:45,  5:55,  10:63,  20:73,  25:78,  30:82,  40:90,  50:100, 60:110, 70:118, 75:125, 80:130, 90:140, 95:155, 100:175 },
    '8':     { 0:45,  5:55,  10:63,  20:73,  25:78,  30:82,  40:90,  50:100, 60:110, 70:118, 75:125, 80:130, 90:140, 95:155, 100:175 },
    '9':     { 0:45,  5:55,  10:63,  20:73,  25:78,  30:82,  40:90,  50:100, 60:110, 70:118, 75:125, 80:130, 90:140, 95:155, 100:175 },
    '10':    { 0:95,  5:103, 10:108, 20:119, 30:132, 40:137, 50:145, 60:152, 70:157, 80:164, 90:175, 95:181, 100:189 },
    '11':    { 0:95,  5:103, 10:108, 20:119, 30:132, 40:137, 50:145, 60:152, 70:157, 80:164, 90:175, 95:181, 100:189 },
    '12':    { 0:110, 5:118, 10:122, 20:130, 30:135, 40:141, 50:147, 60:152, 70:157, 80:162, 90:177, 95:185, 100:195 },
    '13':    { 0:110, 5:118, 10:122, 20:130, 30:135, 40:141, 50:147, 60:152, 70:157, 80:162, 90:177, 95:185, 100:195 },
    '14':    { 0:103, 5:109, 10:112, 20:119, 30:126, 40:132, 50:139, 60:145, 70:151, 80:161, 90:172, 95:178, 100:186 },
    '15':    { 0:103, 5:109, 10:112, 20:119, 30:126, 40:132, 50:139, 60:145, 70:151, 80:161, 90:172, 95:178, 100:186 },
    '16':    { 0:85,  5:93,  10:99,  20:112, 30:116, 40:124, 50:129, 60:137, 70:144, 80:154, 90:167, 95:174, 100:184 },
    '17':    { 0:85,  5:93,  10:99,  20:112, 30:116, 40:124, 50:129, 60:137, 70:144, 80:154, 90:167, 95:174, 100:184 },
    '18-35': { 0:90,  5:95,  10:110, 20:125, 30:138, 40:148, 50:158, 60:168, 70:178, 80:188, 90:200, 95:210, 100:230 },
    '36-50': { 0:75,  5:95,  10:110, 20:125, 30:138, 40:148, 50:158, 60:168, 70:178, 80:188, 90:200, 95:210, 100:230 },
  },
}

const T_TEST_MINI = {
  M: {
    '7': { 0:15.1, 5:14.8, 10:14.5, 20:13.9, 30:13.4, 40:12.8, 50:12.2, 60:11.8, 70:11.4, 80:10.9, 90:10.5, 95:10.3, 100:10.1 },
    '8': { 0:14.6, 5:14.3, 10:14.0, 20:13.5, 30:12.9, 40:12.4, 50:11.8, 60:11.4, 70:11.0, 80:10.6, 90:10.2, 95:10.0, 100:9.8 },
    '9': { 0:14.0, 5:13.8, 10:13.5, 20:13.0, 30:12.5, 40:11.9, 50:11.4, 60:11.0, 70:10.6, 80:10.2, 90:9.8,  95:9.6,  100:9.4 },
  },
  F: {
    '7': { 0:17.0, 5:16.5, 10:16.0, 20:15.0, 30:14.2, 40:13.6, 50:13.0, 60:12.4, 70:11.8, 80:11.1, 90:10.4, 95:10.0, 100:8.5 },
    '8': { 0:17.0, 5:16.5, 10:16.0, 20:15.0, 30:14.2, 40:13.6, 50:13.0, 60:12.4, 70:11.8, 80:11.1, 90:10.4, 95:10.0, 100:8.5 },
    '9': { 0:17.0, 5:16.5, 10:16.0, 20:15.0, 30:14.2, 40:13.6, 50:13.0, 60:12.4, 70:11.8, 80:11.1, 90:10.4, 95:10.0, 100:8.5 },
  },
}

// ── AGEGROUP FUNCTIONS (da constants/tests.js) ────────────────────────────────

const ageGroup_sprint20m = (age) =>
  age < 7 ? null
  : age <= 7  ? '7'
  : age <= 8  ? '8'
  : age <= 9  ? '9'
  : age <= 10 ? '10'
  : age <= 11 ? '11'
  : age <= 12 ? '12'
  : age <= 13 ? '13'
  : age <= 15 ? '14-15'
  : age <= 17 ? '16-17'
  : age <= 35 ? '18-35'
  : '36-50'

const ageGroup_slj = (age) =>
  age < 7 ? null
  : age <= 7  ? '7'
  : age <= 8  ? '8'
  : age <= 9  ? '9'
  : age <= 10 ? '10'
  : age <= 11 ? '11'
  : age <= 12 ? '12'
  : age <= 13 ? '13'
  : age <= 14 ? '14'
  : age <= 15 ? '15'
  : age <= 16 ? '16'
  : age <= 17 ? '17'
  : age <= 35 ? '18-35'
  : '36-50'

const ageGroup_ttestmini = (age) =>
  age < 7 ? null
  : age <= 7 ? '7'
  : age <= 8 ? '8'
  : age <= 9 ? '9'
  : null

// ── PERCENTILE CALCULATION ────────────────────────────────────────────────────
// Replica calcPercentileEx con clamping sull'età (usa fascia più vicina se fuori range).

function getAgeGroupClamped(ageGroupFn, table, sex, age) {
  const exact = ageGroupFn(age)
  if (exact !== null) return exact

  const tableForSex = table?.[sex] ?? table?.M
  if (!tableForSex) return null

  const groups = Object.keys(tableForSex)
  if (!groups.length) return null

  const parsed = groups
    .map(g => ({ g, lo: parseFloat(g) }))
    .filter(x => !isNaN(x.lo))
    .sort((a, b) => a.lo - b.lo)

  if (!parsed.length) return null
  return age < parsed[0].lo ? parsed[0].g : parsed[parsed.length - 1].g
}

function calcPercentile(table, sex, ageGroupFn, age, value, direction) {
  const group = getAgeGroupClamped(ageGroupFn, table, sex, age)
  if (!group) return null

  const percentiles = table?.[sex]?.[group]
  if (!percentiles) return null

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

// Test config: { stat, table, ageGroupFn, direction, categorias }
// campionamento.tests usa test.stat come chiave per test semplici.
// categorias: array di categorie per cui recalcolare; null = tutte.
//
// ATTENZIONE: più test condividono lo stesso stat:
//   velocita: sprint_10m (soccer_youth, active)  → NON cambiata
//             sprint_20m (soccer_junior, soccer, athlete) → CAMBIATA
//   agilita:  t_test_mini (soccer_youth)         → CAMBIATA
//             t_test_soccer_junior (soccer_junior) → NON cambiata
//             t_test_agility (athlete)            → NON cambiata
const AFFECTED_TESTS = [
  {
    stat:        'velocita',
    table:       SPRINT_20M,
    ageGroupFn:  ageGroup_sprint20m,
    direction:   'inverse',
    categorias:  ['soccer_junior', 'soccer', 'athlete'],
  },
  {
    stat:        'esplosivita',
    table:       STANDING_LONG_JUMP,
    ageGroupFn:  ageGroup_slj,
    direction:   'direct',
    categorias:  null, // standing_long_jump è la stessa per tutte le categorie
  },
  {
    stat:        'agilita',
    table:       T_TEST_MINI,
    ageGroupFn:  ageGroup_ttestmini,
    direction:   'inverse',
    categorias:  ['soccer_youth'],
  },
]

// ── AGE CALCULATION ───────────────────────────────────────────────────────────

function calcAge(dataNascita) {
  if (!dataNascita) return null
  const birth = new Date(dataNascita)
  if (isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  if (now.getMonth() < birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--
  return age
}

// ── RECALCULATION LOGIC ───────────────────────────────────────────────────────

function recalcCampionamento(camp, sesso, age, categoria) {
  const tests = camp.tests ?? {}
  let changed = false
  const newStats = { ...camp.stats }

  for (const t of AFFECTED_TESTS) {
    // Salta se la categoria del cliente non è tra quelle pertinenti per questo test
    if (t.categorias && !t.categorias.includes(categoria)) continue

    const rawValue = tests[t.stat]
    if (rawValue == null || rawValue === '') continue

    const val = Number(rawValue)
    if (isNaN(val)) continue

    const newPercentile = calcPercentile(t.table, sesso, t.ageGroupFn, age, val, t.direction)
    if (newPercentile === null) continue

    const oldPercentile = camp.stats?.[t.stat] ?? null
    if (oldPercentile !== newPercentile) {
      newStats[t.stat] = newPercentile
      changed = true
    }
  }

  if (!changed) return null

  const newMedia = calcStatMedia(newStats)
  return { stats: newStats, media: newMedia }
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function processOrg(orgId) {
  const snap = await db.collection('organizations').doc(orgId).collection('clients').get()
  if (snap.empty) return 0

  let patched = 0

  for (const doc of snap.docs) {
    const d = doc.data()
    const campionamenti = d.campionamenti
    if (!Array.isArray(campionamenti) || campionamenti.length === 0) continue

    // Usa dataNascita se disponibile, altrimenti eta (integer)
    const age = d.dataNascita ? calcAge(d.dataNascita) : (typeof d.eta === 'number' ? d.eta : null)
    if (age == null || age <= 0) {
      console.log(`  ⚠ ${d.name} — età non determinabile, skip`)
      continue
    }

    const sesso = d.sesso ?? 'M'

    let anyChanged = false
    const categoria = d.categoria ?? ''

    const newCampionamenti = campionamenti.map(camp => {
      const result = recalcCampionamento(camp, sesso, age, categoria)
      if (!result) return camp
      anyChanged = true
      return { ...camp, stats: result.stats, media: result.media }
    })

    if (!anyChanged) continue

    // Stats cliente = da campionamento più recente
    const latest = newCampionamenti[0]
    const newStats    = latest.stats
    const newMedia    = latest.media
    const newRankObj  = getRankFromMedia(newMedia)
    const oldMedia    = d.media ?? 0
    const oldRank     = d.rank ?? 'F'

    // Tutte le stat del campionamento più recente (old vs new)
    const oldStats0 = d.campionamenti[0]?.stats ?? {}
    const newStats0 = newCampionamenti[0]?.stats ?? {}
    const allStatKeys = [...new Set([...Object.keys(oldStats0), ...Object.keys(newStats0)])]
    const statsLine = allStatKeys
      .map(k => {
        const o = oldStats0[k] ?? '—'
        const n = newStats0[k] ?? '—'
        const changed = o !== n
        return `${k}: ${changed ? `${o}→${n}` : o}`
      })
      .join('  ')

    console.log(
      `  ✓ ${String(d.name).padEnd(20)} eta:${age} sesso:${sesso} cat:${categoria}\n` +
      `       ${statsLine}\n` +
      `       media: ${oldMedia}→${newMedia}  rank: ${oldRank}→${newRankObj.label}`
    )

    if (!DRY_RUN) {
      await doc.ref.update({
        campionamenti: newCampionamenti,
        stats:         newStats,
        media:         newMedia,
        rank:          newRankObj.label,
        rankColor:     newRankObj.color,
      })
    }
    patched++
  }

  return patched
}

async function run() {
  console.log(`\n=== RICALCOLO CAMPIONAMENTI${DRY_RUN ? ' [DRY-RUN]' : ''} ===\n`)
  console.log(`Test: sprint_20m (velocita), standing_long_jump (esplosivita), t_test_mini (agilita)`)
  console.log(`Fascia: tutte le categorie con campionamenti\n`)

  let totalPatched = 0

  if (ONLY_ORG) {
    console.log(`Org: ${ONLY_ORG}`)
    const n = await processOrg(ONLY_ORG)
    totalPatched = n
  } else {
    const orgsSnap = await db.collection('organizations').get()
    console.log(`Organizzazioni trovate: ${orgsSnap.size}\n`)

    for (const orgDoc of orgsSnap.docs) {
      const orgId   = orgDoc.id
      const orgName = orgDoc.data().name ?? orgId
      console.log(`Org: ${orgName} (${orgId})`)
      const n = await processOrg(orgId)
      if (n === 0) console.log('  — nessun cliente modificato')
      totalPatched += n
    }
  }

  console.log(`\n${DRY_RUN ? '[DRY-RUN] ' : ''}${totalPatched} client ${DRY_RUN ? 'da aggiornare' : 'aggiornati'}.`)
  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
