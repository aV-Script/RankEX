/**
 * recalcolaCampionamenti — callable Cloud Function (Gen 2)
 *
 * Migra la logica di scripts/recalcolo-campionamenti.mjs lato server.
 * Ricalcola percentili e media di tutti i campionamenti dopo una correzione
 * delle tabelle. Usata dal super_admin tramite AdminDashboard.
 *
 * Input:
 *   { orgId?: string, dryRun?: boolean }
 *   - orgId: limita il ricalcolo a una singola org (null = tutte)
 *   - dryRun: se true, restituisce il report senza scrivere su Firestore
 *
 * Output:
 *   { patched: number, skipped: number, report: string[] }
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }       from 'firebase-admin/firestore'
import { requireRole }        from '../shared/auth.js'
import { getRankFromMedia, calcStatMedia } from '../shared/constants.js'

const REGION = 'europe-west1'

// ── Tabelle percentili corrette ──────────────────────────────────────────────
// Stessa logica di scripts/recalcolo-campionamenti.mjs — qui come modulo riusabile.
// Da aggiornare ogni volta che le tabelle in src/utils/tables.js cambiano.

import { SPRINT_20M, STANDING_LONG_JUMP, T_TEST_MINI } from '../shared/tables.js'

const AFFECTED_TESTS = [
  { stat: 'velocita',    table: SPRINT_20M,         ageGroupFn: ageGroup_sprint20m,  direction: 'inverse', categorias: ['soccer_junior', 'soccer', 'athlete'] },
  { stat: 'esplosivita', table: STANDING_LONG_JUMP,  ageGroupFn: ageGroup_slj,        direction: 'direct',  categorias: null },
  { stat: 'agilita',     table: T_TEST_MINI,          ageGroupFn: ageGroup_ttestmini,  direction: 'inverse', categorias: ['soccer_youth'] },
]

export const recalcolaCampionamenti = onCall({ region: REGION, timeoutSeconds: 540 }, async (request) => {
  await requireRole(request, ['super_admin'])

  const { orgId = null, dryRun = false } = request.data ?? {}
  const db     = getFirestore()
  const report = []
  let patched  = 0
  let skipped  = 0

  const orgsToProcess = orgId
    ? [{ id: orgId }]
    : (await db.collection('organizations').get()).docs.map(d => ({ id: d.id, name: d.data().name }))

  for (const org of orgsToProcess) {
    const clientSnap = await db
      .collection('organizations').doc(org.id)
      .collection('clients').get()

    for (const clientDoc of clientSnap.docs) {
      const d            = clientDoc.data()
      const campionamenti = d.campionamenti
      if (!Array.isArray(campionamenti) || campionamenti.length === 0) { skipped++; continue }

      const age = calcAge(d.dataNascita) ?? (typeof d.eta === 'number' ? d.eta : null)
      if (!age || age <= 0) { skipped++; continue }

      const sesso     = d.sesso ?? 'M'
      const categoria = d.categoria ?? ''
      let   anyChanged = false

      const newCampionamenti = campionamenti.map(camp => {
        const result = recalcCampionamento(camp, sesso, age, categoria)
        if (!result) return camp
        anyChanged = true
        return { ...camp, stats: result.stats, media: result.media }
      })

      if (!anyChanged) { skipped++; continue }

      const latest   = newCampionamenti[0]
      const newRank  = getRankFromMedia(latest.media)

      report.push(`${d.name} (${org.id}) — media: ${d.media ?? 0}→${latest.media}  rank: ${d.rank ?? 'F'}→${newRank.label}`)

      if (!dryRun) {
        await clientDoc.ref.update({
          campionamenti: newCampionamenti,
          stats:         latest.stats,
          media:         latest.media,
          rank:          newRank.label,
          rankColor:     newRank.color,
        })
      }
      patched++
    }
  }

  return { patched, skipped, dryRun, report }
})

// ── Helpers percentile ───────────────────────────────────────────────────────

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

function ageGroup_sprint20m(age) {
  if (age < 7)  return null
  if (age <= 7)  return '7'
  if (age <= 8)  return '8'
  if (age <= 9)  return '9'
  if (age <= 10) return '10'
  if (age <= 11) return '11'
  if (age <= 12) return '12'
  if (age <= 13) return '13'
  if (age <= 15) return '14-15'
  if (age <= 17) return '16-17'
  if (age <= 35) return '18-35'
  return '36-50'
}

function ageGroup_slj(age) {
  if (age < 7)  return null
  if (age <= 7)  return '7'
  if (age <= 8)  return '8'
  if (age <= 9)  return '9'
  if (age <= 10) return '10'
  if (age <= 11) return '11'
  if (age <= 12) return '12'
  if (age <= 13) return '13'
  if (age <= 14) return '14'
  if (age <= 15) return '15'
  if (age <= 16) return '16'
  if (age <= 17) return '17'
  if (age <= 35) return '18-35'
  return '36-50'
}

function ageGroup_ttestmini(age) {
  if (age < 7) return null
  if (age <= 7) return '7'
  if (age <= 8) return '8'
  if (age <= 9) return '9'
  return null
}

function getAgeGroupClamped(ageGroupFn, table, sex, age) {
  const exact = ageGroupFn(age)
  if (exact !== null) return exact
  const tableForSex = table?.[sex] ?? table?.M
  if (!tableForSex) return null
  const parsed = Object.keys(tableForSex)
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
    if (value <= sorted[0][1]) return sorted[0][0]
    if (value >= sorted[sorted.length - 1][1]) return sorted[sorted.length - 1][0]
    for (let i = 0; i < sorted.length - 1; i++) {
      const [p1, v1] = sorted[i], [p2, v2] = sorted[i + 1]
      if (value >= v1 && value <= v2)
        return Math.round(p1 + (value - v1) / (v2 - v1) * (p2 - p1))
    }
  } else {
    if (value >= sorted[0][1]) return sorted[0][0]
    if (value <= sorted[sorted.length - 1][1]) return sorted[sorted.length - 1][0]
    for (let i = 0; i < sorted.length - 1; i++) {
      const [p1, v1] = sorted[i], [p2, v2] = sorted[i + 1]
      if (value <= v1 && value >= v2)
        return Math.round(p1 + (value - v1) / (v2 - v1) * (p2 - p1))
    }
  }
  return 0
}

function recalcCampionamento(camp, sesso, age, categoria) {
  const tests = camp.tests ?? {}
  let changed = false
  const newStats = { ...camp.stats }

  for (const t of AFFECTED_TESTS) {
    if (t.categorias && !t.categorias.includes(categoria)) continue
    const rawValue = tests[t.stat]
    if (rawValue == null || rawValue === '') continue
    const val = Number(rawValue)
    if (isNaN(val)) continue
    const newPercentile = calcPercentile(t.table, sesso, t.ageGroupFn, age, val, t.direction)
    if (newPercentile === null) continue
    if ((camp.stats?.[t.stat] ?? null) !== newPercentile) {
      newStats[t.stat] = newPercentile
      changed = true
    }
  }

  if (!changed) return null
  return { stats: newStats, media: calcStatMedia(newStats) }
}
