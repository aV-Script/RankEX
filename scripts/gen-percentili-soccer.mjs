/**
 * Genera rankex_percentili_soccer.xlsx
 * Contiene le tabelle percentili di riferimento per il modulo soccer
 * con i dati del dataset reale affiancati per il calibramento.
 *
 * Uso: node scripts/gen-percentili-soccer.mjs
 */

import { resolve, dirname }  from 'path'
import { fileURLToPath }     from 'url'
import { createRequire }     from 'module'

const require   = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = resolve(__dirname, '..')

const XLSX = require('xlsx')

// ── Dataset dal file Excel ────────────────────────────────────────────────────

const srcWb = XLSX.readFile(resolve(ROOT, 'rankex_dataset_template (2).xlsx'))
const s1    = XLSX.utils.sheet_to_json(srcWb.Sheets[srcWb.SheetNames[0]], { header: 1 })
const s2    = XLSX.utils.sheet_to_json(srcWb.Sheets[srcWb.SheetNames[1]], { header: 1 })

const pf = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? null : n }

const G1 = s1.filter((r, i) => i > 0 && typeof r[0] === 'string' && r[2]).map(r => ({
  name: r[0], age: 2026 - parseInt(r[2]),
  single_leg_stance:  pf(r[6]),
  sprint_10m:         pf(r[7]),
  t_test_mini:        pf(r[8]),
  standing_long_jump: pf(r[9]),
  shuttle_run_30m:    pf(r[10]),
}))

const G2 = s2.filter((r, i) => i > 0 && typeof r[0] === 'string' && r[2]).map(r => {
  const antDx = pf(r[6]), antSx = pf(r[7]), ll = pf(r[14]), rl = pf(r[15])
  return {
    name: r[0], age: 2026 - parseInt(r[2]),
    y_balance_anterior:   (antDx && rl && antSx && ll) ? +((antDx / rl + antSx / ll) / 2 * 100).toFixed(2) : null,
    sprint_20m:           pf(r[8]),
    t_test_soccer_junior: pf(r[9]),
    standing_long_jump:   pf(r[10]),
    six_minute_run:       pf(r[11]),
  }
})

// ── Tabelle di riferimento attuali ────────────────────────────────────────────

const TABLES = {
  single_leg_stance: {
    label: 'Single Leg Stance', unit: 'secondi', direction: 'direct (↑)',
    groups: { '7-9': { M: { 0:20, 5:25, 10:30, 20:38, 30:45, 40:50, 50:55, 60:60, 70:65, 80:77, 90:82, 95:87, 100:90 }, F: null } }
  },
  sprint_10m: {
    label: '10m Sprint', unit: 'secondi', direction: 'inverse (↓)',
    groups: { '7-9': { M: { 100:2.00, 95:2.20, 90:2.26, 80:2.39, 70:2.50, 60:2.60, 50:2.70, 40:2.82, 30:2.94, 20:3.10, 10:3.30, 5:3.40, 0:3.50 }, F: null } }
  },
  t_test_mini: {
    label: 'T-Test Mini (5m)', unit: 'secondi', direction: 'inverse (↓)',
    groups: { '7-9': { M: { 100:8.5, 95:10.0, 90:10.4, 80:11.1, 70:11.8, 60:12.4, 50:13.0, 40:13.6, 30:14.2, 20:15.0, 10:16.0, 5:16.5, 0:17.0 }, F: null } }
  },
  standing_long_jump_youth: {
    label: 'Standing Long Jump — Pulcini', unit: 'cm', direction: 'direct (↑)',
    groups: {
      '7-9':  { M: { 0:45, 5:51, 10:57, 20:69, 30:79, 40:87, 50:95, 60:103, 70:111, 80:119, 90:126, 95:130, 100:145 }, F: { 0:45, 5:51, 10:57, 20:69, 30:79, 40:87, 50:95, 60:103, 70:111, 80:119, 90:126, 95:130, 100:145 } },
      '9-10': { M: { 0:96, 5:102, 10:108, 20:120, 30:125, 40:131, 50:138, 60:143, 70:150, 80:160, 90:176, 95:184, 100:193 }, F: { 0:96, 5:101, 10:105, 20:114, 30:120, 40:125, 50:130, 60:139, 70:145, 80:153, 90:165, 95:171, 100:177 } },
    }
  },
  shuttle_run_30m: {
    label: '30m Shuttle Run (6×5m)', unit: 'secondi', direction: 'inverse (↓)',
    groups: { '7-9': { M: { 100:20.0, 95:22.5, 90:23.1, 80:23.8, 70:25.6, 60:26.8, 50:28.0, 40:29.2, 30:30.4, 20:32.2, 10:34.6, 5:35.8, 0:37.0 }, F: null } }
  },
  y_balance_anterior: {
    label: 'Y-Balance Anterior (%LL)', unit: '%', direction: 'direct (↑)',
    groups: { '10-13': { M: { 0:40, 5:52, 10:56, 20:62, 30:66, 40:69, 50:72, 60:75, 70:78, 80:81, 90:85, 95:88, 100:100 }, F: null } }
  },
  sprint_20m: {
    label: '20m Sprint', unit: 'secondi', direction: 'inverse (↓)',
    groups: {
      '10-11': { M: { 100:3.93, 95:3.96, 90:4.00, 80:4.07, 70:4.15, 60:4.24, 50:4.33, 40:4.41, 30:4.48, 20:4.70, 10:5.06, 5:5.24, 0:5.42 }, F: null },
      '12-13': { M: { 100:3.70, 95:3.74, 90:3.77, 80:3.84, 70:3.91, 60:3.98, 50:4.06, 40:4.13, 30:4.20, 20:4.37, 10:4.64, 5:4.78, 0:4.91 }, F: null },
    }
  },
  t_test_soccer_junior: {
    label: 'T-Test Standard (10m)', unit: 'secondi', direction: 'inverse (↓)',
    groups: { '10-13': { M: { 100:8.5, 95:9.8, 90:10.0, 80:10.3, 70:10.6, 60:10.9, 50:11.2, 40:11.5, 30:11.8, 20:12.4, 10:13.2, 5:13.6, 0:14.0 }, F: null } }
  },
  standing_long_jump_junior: {
    label: 'Standing Long Jump — Esordienti', unit: 'cm', direction: 'direct (↑)',
    groups: {
      '9-10':  { M: { 0:96, 5:102, 10:108, 20:120, 30:125, 40:131, 50:138, 60:143, 70:150, 80:160, 90:176, 95:184, 100:193 }, F: { 0:96, 5:101, 10:105, 20:114, 30:120, 40:125, 50:130, 60:139, 70:145, 80:153, 90:165, 95:171, 100:177 } },
      '11-12': { M: { 0:98, 5:108, 10:117, 20:137, 30:143, 40:148, 50:153, 60:156, 70:164, 80:168, 90:178, 95:183, 100:187 }, F: { 0:90, 5:98, 10:106, 20:122, 30:140, 40:144, 50:152, 60:155, 70:160, 80:165, 90:175, 95:180, 100:185 } },
      '13-14': { M: { 0:121, 5:127, 10:133, 20:145, 30:153, 40:160, 50:167, 60:177, 70:181, 80:188, 90:197, 95:202, 100:206 }, F: { 0:109, 5:113, 10:116, 20:123, 30:128, 40:133, 50:140, 60:147, 70:153, 80:160, 90:173, 95:180, 100:186 } },
    }
  },
  six_minute_run: {
    label: 'Test 6 Minuti (Mezzo Cooper)', unit: 'metri', direction: 'direct (↑)',
    groups: { '10-13': { M: { 0:700, 5:760, 10:820, 20:940, 30:1030, 40:1090, 50:1150, 60:1230, 70:1310, 80:1388, 90:1463, 95:1500, 100:1800 }, F: null } }
  },
}

// ── Stili ─────────────────────────────────────────────────────────────────────

const PERCENTILE_ORDER = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100]

const fill  = (rgb) => ({ patternType: 'solid', fgColor: { rgb } })
const font  = (opts) => opts
const aln   = (h, v = 'center') => ({ horizontal: h, vertical: v, wrapText: true })

const S = {
  title:    { font: font({ bold: true, sz: 13, color: { rgb: 'FFFFFF' } }), fill: fill('1A2A3A'), alignment: aln('center') },
  hdr:      { font: font({ bold: true, sz: 10, color: { rgb: 'FFFFFF' } }), fill: fill('2D4A6A'), alignment: aln('center') },
  hdrGreen: { font: font({ bold: true, sz: 10, color: { rgb: 'FFFFFF' } }), fill: fill('1B6B3A'), alignment: aln('center') },
  hdrRed:   { font: font({ bold: true, sz: 10, color: { rgb: 'FFFFFF' } }), fill: fill('8B1A1A'), alignment: aln('center') },
  pct:      { font: font({ bold: true, sz: 10 }), fill: fill('EAF0FB'), alignment: aln('center') },
  val:      { font: font({ sz: 10 }), alignment: aln('center') },
  valBold:  { font: font({ bold: true, sz: 10 }), alignment: aln('center') },
  warn:     { font: font({ bold: true, sz: 10, color: { rgb: 'CC0000' } }), fill: fill('FFF0F0'), alignment: aln('center') },
  note:     { font: font({ italic: true, sz: 9, color: { rgb: '666666' } }), alignment: aln('left') },
  dataHdr:  { font: font({ bold: true, sz: 10, color: { rgb: 'FFFFFF' } }), fill: fill('5B4A1A'), alignment: aln('center') },
  dataVal:  { font: font({ sz: 10 }), fill: fill('FFFDE7'), alignment: aln('center') },
}

function c(v, s) {
  return s ? { v, t: typeof v === 'number' ? 'n' : 's', s } : { v, t: typeof v === 'number' ? 'n' : 's' }
}

// ── Helper: distribuzione empirica percentile ─────────────────────────────────

function empiricalPct(arr) {
  const vals = arr.filter(v => v !== null && !isNaN(v)).sort((a, b) => a - b)
  if (!vals.length) return {}
  const p = (pct) => {
    const i = (pct / 100) * (vals.length - 1)
    const lo = Math.floor(i), hi = Math.ceil(i)
    return +((vals[lo] + (vals[hi] - vals[lo]) * (i - lo))).toFixed(2)
  }
  return { 0: p(0), 25: p(25), 50: p(50), 75: p(75), 100: p(100), n: vals.length, vals }
}

// ── Costruzione fogli ─────────────────────────────────────────────────────────

function buildSheet(testKey, testDef, datasetVals, ageGroupLabel) {
  const data   = []
  const merges = []
  let   row    = 0

  // Titolo
  merges.push({ s: { r: row, c: 0 }, e: { r: row, c: 7 } })
  data.push([c(`${testDef.label}  —  ${ageGroupLabel}  |  Unità: ${testDef.unit}  |  ${testDef.direction}`, S.title)])
  row++

  // Spazio
  data.push([c('')])
  row++

  // Intestazione tabella
  data.push([
    c('Percentile', S.hdr),
    c('Riferimento M', S.hdr),
    c('Riferimento F', S.hdr),
    c('', {}),
    c('Dataset — valori reali', S.dataHdr),
    c('', {}),
    c('', {}),
    c('Nota calibramento', S.hdrRed),
  ])
  merges.push({ s: { r: row, c: 4 }, e: { r: row, c: 6 } })
  row++

  const groups  = testDef.groups
  const allPercs = PERCENTILE_ORDER

  // Per ogni fascia d'età nella tabella
  for (const [group, sexTables] of Object.entries(groups)) {
    const tableM = sexTables.M ?? {}
    const tableF = sexTables.F ?? tableM  // F = M se non definita

    // Subheader fascia
    merges.push({ s: { r: row, c: 0 }, e: { r: row, c: 7 } })
    data.push([c(`Fascia: ${group} anni`, S.hdrGreen)])
    row++

    // Intestazione colonne dati
    const ds       = empiricalPct(datasetVals)
    const hasFdiff = Object.keys(tableF).some(k => tableF[k] !== tableM[k])

    data.push([
      c('Percentile', S.hdr),
      c('M (attuale)', S.hdr),
      c(hasFdiff ? 'F (attuale)' : 'F = M', S.hdr),
      c('', {}),
      c('Atleta', S.dataHdr),
      c('Età', S.dataHdr),
      c('Valore', S.dataHdr),
      c('→ Percentile attuale', S.dataHdr),
    ])
    row++

    // Righe percentili
    allPercs.forEach((pct, pi) => {
      const valM = tableM[pct] ?? ''
      const valF = hasFdiff ? (tableF[pct] ?? '') : ''

      // Riga dati atleta affiancata
      let athleteRow = ['', '', '']
      if (datasetVals && pi < datasetVals.length) {
        const athlete = datasetVals[pi]
        if (athlete) {
          const isOut = (athlete.pct === 0 || athlete.pct === 100)
          athleteRow = [
            c(athlete.name, isOut ? S.warn : S.dataVal),
            c(athlete.age,  isOut ? S.warn : S.dataVal),
            c(athlete.raw,  isOut ? S.warn : S.dataVal),
          ]
        }
      }

      data.push([
        c(pct + '°', S.pct),
        c(valM !== '' ? +valM : '', S.val),
        c(valF !== '' ? +valF : valM !== '' ? +valM : '', S.val),
        c('', {}),
        ...athleteRow,
        c('', {}),
      ])
      row++
    })

    data.push([c('')])
    row++
  }

  // Sezione dataset completo
  if (datasetVals && datasetVals.length) {
    merges.push({ s: { r: row, c: 0 }, e: { r: row, c: 7 } })
    data.push([c('DISTRIBUZIONE DATASET — tutti i valori', S.hdrGreen)])
    row++

    data.push([
      c('Atleta', S.dataHdr), c('Età', S.dataHdr), c('Valore raw', S.dataHdr),
      c('Percentile calcolato', S.dataHdr), c('', {}), c('', {}), c('', {}), c('', {}),
    ])
    row++

    datasetVals.forEach(({ name, age, raw, pct }) => {
      const isOut = pct === 0 || pct === 100
      data.push([
        c(name, isOut ? S.warn : S.dataVal),
        c(age,  isOut ? S.warn : S.dataVal),
        c(raw !== null ? +raw.toFixed(2) : '—', isOut ? S.warn : S.dataVal),
        c(pct, isOut ? S.warn : S.dataVal),
        c('', {}), c('', {}), c('', {}), c('', {}),
      ])
      row++
    })

    // Stats distribuzione
    const validRaw = datasetVals.filter(d => d.raw !== null).map(d => d.raw)
    const ep       = empiricalPct(validRaw)
    data.push([c('')])
    data.push([
      c('Statistiche dataset', S.hdrRed),
      c(`Min: ${ep[0]}`, S.warn),
      c(`P25: ${ep[25]}`, S.warn),
      c(`P50 (mediana): ${ep[50]}`, S.warn),
      c(`P75: ${ep[75]}`, S.warn),
      c(`Max: ${ep[100]}`, S.warn),
      c('', {}), c('', {}),
    ])
  }

  // Converti in worksheet
  const ws   = XLSX.utils.aoa_to_sheet(data)
  ws['!merges'] = merges
  ws['!cols'] = [
    { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 2 },
    { wch: 20 }, { wch: 6 }, { wch: 14 }, { wch: 22 },
  ]
  return ws
}

// ── Calcola percentile singolo ────────────────────────────────────────────────

function calcPct(tableM, rawValue, direction) {
  if (rawValue === null || isNaN(rawValue)) return null
  const sorted = Object.entries(tableM)
    .map(([p, v]) => [parseFloat(p), parseFloat(v)])
    .sort((a, b) => direction === 'direct' ? a[1] - b[1] : b[1] - a[1])

  if (direction === 'direct') {
    if (rawValue <= sorted[0][1])                    return sorted[0][0]
    if (rawValue >= sorted[sorted.length - 1][1])    return sorted[sorted.length - 1][0]
    for (let i = 0; i < sorted.length - 1; i++) {
      const [p1, v1] = sorted[i], [p2, v2] = sorted[i + 1]
      if (rawValue >= v1 && rawValue <= v2)
        return Math.round(p1 + (rawValue - v1) / (v2 - v1) * (p2 - p1))
    }
  } else {
    if (rawValue >= sorted[0][1])                    return sorted[0][0]
    if (rawValue <= sorted[sorted.length - 1][1])    return sorted[sorted.length - 1][0]
    for (let i = 0; i < sorted.length - 1; i++) {
      const [p1, v1] = sorted[i], [p2, v2] = sorted[i + 1]
      if (rawValue <= v1 && rawValue >= v2)
        return Math.round(p1 + (rawValue - v1) / (v2 - v1) * (p2 - p1))
    }
  }
  return null
}

// ── Foglio riepilogo ──────────────────────────────────────────────────────────

function buildSummarySheet() {
  const rows   = []
  const merges = []
  let r = 0

  merges.push({ s: { r, c: 0 }, e: { r, c: 9 } })
  rows.push([c('RIEPILOGO CALIBRAMENTO — Modulo Soccer', S.title)])
  r++
  rows.push([c('')])
  r++

  const groups = [
    {
      label: 'GRUPPO 1 — Pulcini (soccer_youth, 7-9 anni)',
      tests: [
        { key: 'single_leg_stance',  dir: 'direct',  table: TABLES.single_leg_stance.groups['7-9'].M,  vals: G1.map(p => ({ name: p.name, age: p.age, raw: p.single_leg_stance })) },
        { key: 'sprint_10m',         dir: 'inverse', table: TABLES.sprint_10m.groups['7-9'].M,         vals: G1.map(p => ({ name: p.name, age: p.age, raw: p.sprint_10m })) },
        { key: 't_test_mini',        dir: 'inverse', table: TABLES.t_test_mini.groups['7-9'].M,        vals: G1.map(p => ({ name: p.name, age: p.age, raw: p.t_test_mini })) },
        { key: 'standing_long_jump', dir: 'direct',  table: TABLES.standing_long_jump_youth.groups['7-9'].M, vals: G1.map(p => ({ name: p.name, age: p.age, raw: p.standing_long_jump })) },
        { key: 'shuttle_run_30m',    dir: 'inverse', table: TABLES.shuttle_run_30m.groups['7-9'].M,    vals: G1.map(p => ({ name: p.name, age: p.age, raw: p.shuttle_run_30m })) },
      ],
    },
    {
      label: 'GRUPPO 2 — Esordienti (soccer_junior, 10-13 anni)',
      tests: [
        { key: 'y_balance_anterior',    dir: 'direct',  table: TABLES.y_balance_anterior.groups['10-13'].M,      vals: G2.map(p => ({ name: p.name, age: p.age, raw: p.y_balance_anterior })) },
        { key: 'sprint_20m',            dir: 'inverse', table: null, vals: G2.map(p => ({ name: p.name, age: p.age, raw: p.sprint_20m })), multiGroup: true },
        { key: 't_test_soccer_junior',  dir: 'inverse', table: TABLES.t_test_soccer_junior.groups['10-13'].M,    vals: G2.map(p => ({ name: p.name, age: p.age, raw: p.t_test_soccer_junior })) },
        { key: 'standing_long_jump',    dir: 'direct',  table: null, vals: G2.map(p => ({ name: p.name, age: p.age, raw: p.standing_long_jump })), multiGroup: true },
        { key: 'six_minute_run',        dir: 'direct',  table: TABLES.six_minute_run.groups['10-13'].M,          vals: G2.map(p => ({ name: p.name, age: p.age, raw: p.six_minute_run })) },
      ],
    },
  ]

  for (const grp of groups) {
    merges.push({ s: { r, c: 0 }, e: { r, c: 9 } })
    rows.push([c(grp.label, S.hdrGreen)])
    r++

    rows.push([
      c('Test', S.hdr),
      c('Status', S.hdr),
      c('Ref P0', S.hdr), c('Ref P25', S.hdr), c('Ref P50', S.hdr), c('Ref P75', S.hdr), c('Ref P100', S.hdr),
      c('DS P0',  S.dataHdr), c('DS P50', S.dataHdr), c('DS P100', S.dataHdr),
    ])
    r++

    for (const t of grp.tests) {
      const rawVals  = t.vals.map(v => v.raw).filter(v => v !== null && !isNaN(v)).sort((a, b) => a - b)
      const ep       = empiricalPct(rawVals)
      const tableM   = t.table
      const refP     = tableM ? {
        0: tableM[0] ?? '—', 25: null, 50: tableM[50] ?? '—',
        75: null, 100: tableM[100] ?? '—',
      } : { 0: 'fascia', 50: 'multipla', 100: '→ vedi foglio' }

      // Calcola percentili per ogni atleta
      let pcts = []
      if (tableM) {
        pcts = t.vals.map(v => calcPct(tableM, v.raw, t.dir))
      }
      const allOut = pcts.length > 0 && pcts.every(p => p === 0 || p === 100)
      const status = !tableM ? '🔵 MULTI-FASCIA'
                   : allOut  ? '❌ FUORI SCALA'
                   : pcts.every(p => p >= 80) ? '⚠️  TROPPO FACILE'
                   : pcts.every(p => p <= 20) ? '⚠️  TROPPO DIFFICILE'
                   : '✅ OK'

      const isWarn = status.startsWith('❌') || status.startsWith('⚠')
      rows.push([
        c(t.key, isWarn ? S.warn : S.val),
        c(status, isWarn ? S.warn : S.valBold),
        c(refP[0],   S.val), c(refP[25] ?? '~', S.val), c(refP[50], S.val),
        c(refP[75] ?? '~', S.val), c(refP[100], S.val),
        c(ep[0] ?? '—',  isWarn ? S.warn : S.dataVal),
        c(ep[50] ?? '—', isWarn ? S.warn : S.dataVal),
        c(ep[100] ?? '—', isWarn ? S.warn : S.dataVal),
      ])
      r++
    }
    rows.push([c('')])
    r++
  }

  const ws     = XLSX.utils.aoa_to_sheet(rows)
  ws['!merges'] = merges
  ws['!cols']   = [
    { wch: 28 }, { wch: 18 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 },
  ]
  return ws
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const wb = XLSX.utils.book_new()

  // Foglio riepilogo
  XLSX.utils.book_append_sheet(wb, buildSummarySheet(), '📊 Riepilogo')

  // ── Fogli per test Pulcini ────────────────────────────────────────────────────

  const ybaTable = TABLES.y_balance_anterior.groups['10-13'].M
  const sprint20Table_1011 = TABLES.sprint_20m.groups['10-11'].M
  const sprint20Table_1213 = TABLES.sprint_20m.groups['12-13'].M
  const sljJuniorTable_910 = TABLES.standing_long_jump_junior.groups['9-10']
  const sljJuniorTable_1112 = TABLES.standing_long_jump_junior.groups['11-12']
  const sljJuniorTable_1314 = TABLES.standing_long_jump_junior.groups['13-14']

  // single_leg_stance
  XLSX.utils.book_append_sheet(wb, buildSheet(
    'single_leg_stance', TABLES.single_leg_stance,
    G1.map(p => ({ name: p.name, age: p.age, raw: p.single_leg_stance,
      pct: calcPct(TABLES.single_leg_stance.groups['7-9'].M, p.single_leg_stance, 'direct') })),
    'Pulcini (7-9 anni)'
  ), '⚖ Single Leg Stance')

  // sprint_10m
  XLSX.utils.book_append_sheet(wb, buildSheet(
    'sprint_10m', TABLES.sprint_10m,
    G1.map(p => ({ name: p.name, age: p.age, raw: p.sprint_10m,
      pct: calcPct(TABLES.sprint_10m.groups['7-9'].M, p.sprint_10m, 'inverse') })),
    'Pulcini (7-9 anni)'
  ), '🏃 Sprint 10m')

  // t_test_mini
  XLSX.utils.book_append_sheet(wb, buildSheet(
    't_test_mini', TABLES.t_test_mini,
    G1.map(p => ({ name: p.name, age: p.age, raw: p.t_test_mini,
      pct: calcPct(TABLES.t_test_mini.groups['7-9'].M, p.t_test_mini, 'inverse') })),
    'Pulcini (7-9 anni)'
  ), '🔀 T-Test Mini')

  // standing_long_jump (pulcini — solo '7-9')
  XLSX.utils.book_append_sheet(wb, buildSheet(
    'standing_long_jump_youth', TABLES.standing_long_jump_youth,
    G1.map(p => ({ name: p.name, age: p.age, raw: p.standing_long_jump,
      pct: calcPct(TABLES.standing_long_jump_youth.groups['7-9'].M, p.standing_long_jump, 'direct') })),
    'Pulcini (7-9 anni)'
  ), '🦘 Long Jump (Pulcini)')

  // shuttle_run_30m
  XLSX.utils.book_append_sheet(wb, buildSheet(
    'shuttle_run_30m', TABLES.shuttle_run_30m,
    G1.map(p => ({ name: p.name, age: p.age, raw: p.shuttle_run_30m,
      pct: calcPct(TABLES.shuttle_run_30m.groups['7-9'].M, p.shuttle_run_30m, 'inverse') })),
    'Pulcini (7-9 anni)'
  ), '🔁 Shuttle Run 30m')

  // ── Fogli per test Esordienti ─────────────────────────────────────────────────

  // y_balance_anterior
  XLSX.utils.book_append_sheet(wb, buildSheet(
    'y_balance_anterior', TABLES.y_balance_anterior,
    G2.map(p => ({ name: p.name, age: p.age, raw: p.y_balance_anterior,
      pct: calcPct(ybaTable, p.y_balance_anterior, 'direct') })),
    'Esordienti (10-13 anni)'
  ), '⚖ Y-Balance Anterior')

  // sprint_20m — tabella multi-fascia, mostro 10-11
  XLSX.utils.book_append_sheet(wb, buildSheet(
    'sprint_20m', TABLES.sprint_20m,
    G2.map(p => {
      const tbl = p.age <= 11 ? sprint20Table_1011 : sprint20Table_1213
      return { name: p.name, age: p.age, raw: p.sprint_20m,
        pct: calcPct(tbl, p.sprint_20m, 'inverse') }
    }),
    'Esordienti (10-13 anni)'
  ), '🏃 Sprint 20m')

  // t_test_soccer_junior
  XLSX.utils.book_append_sheet(wb, buildSheet(
    't_test_soccer_junior', TABLES.t_test_soccer_junior,
    G2.map(p => ({ name: p.name, age: p.age, raw: p.t_test_soccer_junior,
      pct: calcPct(TABLES.t_test_soccer_junior.groups['10-13'].M, p.t_test_soccer_junior, 'inverse') })),
    'Esordienti (10-13 anni)'
  ), '🔀 T-Test Junior')

  // standing_long_jump (esordienti — tabella multi-fascia, mostro 11-12)
  XLSX.utils.book_append_sheet(wb, buildSheet(
    'standing_long_jump_junior', TABLES.standing_long_jump_junior,
    G2.map(p => {
      const tbl = p.age <= 10 ? sljJuniorTable_910.M : p.age <= 12 ? sljJuniorTable_1112.M : sljJuniorTable_1314.M
      return { name: p.name, age: p.age, raw: p.standing_long_jump,
        pct: calcPct(tbl, p.standing_long_jump, 'direct') }
    }),
    'Esordienti (10-13 anni)'
  ), '🦘 Long Jump (Junior)')

  // six_minute_run
  XLSX.utils.book_append_sheet(wb, buildSheet(
    'six_minute_run', TABLES.six_minute_run,
    G2.map(p => ({ name: p.name, age: p.age, raw: p.six_minute_run,
      pct: calcPct(TABLES.six_minute_run.groups['10-13'].M, p.six_minute_run, 'direct') })),
    'Esordienti (10-13 anni)'
  ), '🏃 6 Minuti Run')

  // Scrivi file
  const outPath = resolve(ROOT, 'rankex_percentili_soccer.xlsx')
  XLSX.writeFile(wb, outPath)
  console.log(`✅  File generato: ${outPath}`)
}

main()
