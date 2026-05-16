/**
 * analyze.mjs — analisi statica codebase RankEX
 * Uso: node scripts/analyze.mjs [--json] [--no-color]
 *
 * Zero dipendenze esterne. Solo fs/path built-in Node.
 */

import fs from 'fs'
import path from 'path'

// ──────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────
const ROOT    = path.resolve(import.meta.dirname, '..')
const SRC     = path.join(ROOT, 'src')
const EXTS    = new Set(['.js', '.jsx', '.mjs'])
const JSON_OUT = process.argv.includes('--json')
const NO_COLOR = process.argv.includes('--no-color') || !process.stdout.isTTY

const c = {
  reset:  NO_COLOR ? '' : '\x1b[0m',
  bold:   NO_COLOR ? '' : '\x1b[1m',
  dim:    NO_COLOR ? '' : '\x1b[2m',
  green:  NO_COLOR ? '' : '\x1b[32m',
  yellow: NO_COLOR ? '' : '\x1b[33m',
  red:    NO_COLOR ? '' : '\x1b[31m',
  cyan:   NO_COLOR ? '' : '\x1b[36m',
  magenta:NO_COLOR ? '' : '\x1b[35m',
}

// ──────────────────────────────────────────────────────────────
// Raccolta file
// ──────────────────────────────────────────────────────────────
function collectFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collectFiles(full, files)
    else if (EXTS.has(path.extname(entry.name))) files.push(full)
  }
  return files
}

// ──────────────────────────────────────────────────────────────
// Analisi per file
// ──────────────────────────────────────────────────────────────
const RE_IMPORT       = /from\s+['"]([^'"]+)['"]/g
const RE_CONSOLE      = /\bconsole\.(log|warn|error|debug|info)\b/g
const RE_TODO         = /\/\/\s*(TODO|FIXME|HACK|XXX|BUG)\b.*/gi
const RE_ASYNC_AWAIT  = /\basync\b/g
const RE_TRY          = /\btry\s*\{/g
const RE_USEEFFECT    = /useEffect\s*\(\s*(?:[^,]+),\s*\[([^\]]*)\]/g
const RE_HARDCODE_IT  = /"(Errore|Successo|Caricamento|Attenzione|Conferma)[^"]{0,40}"/g
const RE_MAGIC_NUM    = /(?<![.\w])(?:500|100|1000|200|50|30|10)\b(?!\s*[,;)]?\s*\/\/)/g
const RE_ANY_TYPE     = /:\s*any\b/g
const RE_ORGID_ARG    = /\b(?:addClient|deleteClient|addMember|removeMember|getClients|getNotes|addNote)\s*\(/g

function rel(full) { return full.replace(ROOT + path.sep, '').replace(/\\/g, '/') }

function analyzeFile(full) {
  const src      = fs.readFileSync(full, 'utf8')
  const lines    = src.split('\n')
  const lineCount= lines.length

  const imports  = [...src.matchAll(RE_IMPORT)].map(m => m[1])
  const consoles = [...src.matchAll(RE_CONSOLE)].map((m, _i) => {
    const lineNo = src.slice(0, m.index).split('\n').length
    return { method: m[1], line: lineNo }
  })
  const todos    = [...src.matchAll(RE_TODO)].map(m => {
    const lineNo = src.slice(0, m.index).split('\n').length
    return { text: m[0].trim(), line: lineNo }
  })

  const asyncCount = (src.match(RE_ASYNC_AWAIT) || []).length
  const tryCount   = (src.match(RE_TRY) || []).length
  // async senza try corrispondente = potenziale mancanza error handling
  const uncoveredAsync = Math.max(0, asyncCount - tryCount)

  // useEffect con [] vuoto o senza dep
  const effectIssues = []
  for (const m of src.matchAll(RE_USEEFFECT)) {
    const deps = m[1].trim()
    if (deps === '') {
      const lineNo = src.slice(0, m.index).split('\n').length
      effectIssues.push({ lineNo, note: 'deps array vuoto' })
    }
  }

  const relNorm  = full.replace(/\\/g, '/')
  const isComponent = /\.jsx$/.test(full) && /export (default function|const [A-Z])/m.test(src)
  const isHook      = path.basename(full).startsWith('use')
  const isService   = relNorm.includes('/services/')
  const isConfig    = relNorm.includes('/config/') || relNorm.includes('/constants/')

  return {
    rel: rel(full),
    full,
    lineCount,
    imports,
    consoles,
    todos,
    asyncCount,
    tryCount,
    uncoveredAsync,
    effectIssues,
    isComponent,
    isHook,
    isService,
    isConfig,
  }
}

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────
const allFiles  = collectFiles(SRC)
const analyzed  = allFiles.map(analyzeFile)
const totalLines = analyzed.reduce((s, f) => s + f.lineCount, 0)

// Import count: quante volte ogni modulo è importato
const importFreq = {}
for (const f of analyzed) {
  for (const imp of f.imports) {
    const key = imp.startsWith('.') ? '<relativo>' : imp.split('/')[0]
    importFreq[imp] = (importFreq[imp] ?? 0) + 1
  }
}

// Moduli interni più importati
const internalFreq = {}
for (const f of analyzed) {
  for (const imp of f.imports) {
    if (!imp.startsWith('.') && !imp.startsWith('@') && !imp.includes('firebase') && imp !== 'react') continue
    if (imp.startsWith('.')) {
      // Normalizza percorso relativo → assoluto
      const abs = path.resolve(path.dirname(f.full), imp)
        .replace(ROOT + path.sep, '').replace(/\\/g, '/')
      internalFreq[abs] = (internalFreq[abs] ?? 0) + 1
    }
  }
}

// Dipendenze esterne
const externalFreq = {}
for (const f of analyzed) {
  for (const imp of f.imports) {
    if (imp.startsWith('.')) continue
    const pkg = imp.startsWith('@') ? imp.split('/').slice(0,2).join('/') : imp.split('/')[0]
    externalFreq[pkg] = (externalFreq[pkg] ?? 0) + 1
  }
}

// Aggregazioni
const largeFiles       = analyzed.filter(f => f.lineCount > 250).sort((a,b) => b.lineCount - a.lineCount)
const consolesAll      = analyzed.flatMap(f => f.consoles.map(c => ({ ...c, file: f.rel })))
const todosAll         = analyzed.flatMap(f => f.todos.map(t => ({ ...t, file: f.rel })))
const effectIssuesAll  = analyzed.flatMap(f => f.effectIssues.map(e => ({ ...e, file: f.rel })))
const uncoveredAll     = analyzed.filter(f => f.uncoveredAsync > 2).sort((a,b) => b.uncoveredAsync - a.uncoveredAsync)

const components = analyzed.filter(f => f.isComponent)
const hooks      = analyzed.filter(f => f.isHook)
const services   = analyzed.filter(f => f.isService)
const configs    = analyzed.filter(f => f.isConfig)

// Top importati interni
const topInternal = Object.entries(internalFreq)
  .sort((a,b) => b[1] - a[1])
  .slice(0, 15)

// Top dipendenze esterne
const topExternal = Object.entries(externalFreq)
  .sort((a,b) => b[1] - a[1])
  .slice(0, 10)

// ──────────────────────────────────────────────────────────────
// Output testo
// ──────────────────────────────────────────────────────────────
if (JSON_OUT) {
  console.log(JSON.stringify({
    overview: { totalFiles: allFiles.length, totalLines, components: components.length, hooks: hooks.length, services: services.length },
    largeFiles: largeFiles.map(f => ({ file: f.rel, lines: f.lineCount })),
    consoles: consolesAll,
    todos: todosAll,
    effectIssues: effectIssuesAll,
    uncoveredAsync: uncoveredAll.map(f => ({ file: f.rel, uncovered: f.uncoveredAsync })),
    topInternal,
    topExternal,
  }, null, 2))
  process.exit(0)
}

const SEP = `${c.dim}${'─'.repeat(62)}${c.reset}`

function header(title) {
  console.log(`\n${SEP}`)
  console.log(`${c.bold}${c.cyan}  ${title}${c.reset}`)
  console.log(SEP)
}

function badge(n, warn = 5, error = 20) {
  if (n >= error) return `${c.red}${n}${c.reset}`
  if (n >= warn)  return `${c.yellow}${n}${c.reset}`
  return `${c.green}${n}${c.reset}`
}

function bar(n, max, width = 20) {
  const filled = Math.round((n / max) * width)
  return `${c.green}${'█'.repeat(filled)}${c.dim}${'░'.repeat(width - filled)}${c.reset}`
}

// ── Header ──────────────────────────────────────────────────
const now = new Date().toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
console.log()
console.log(`${c.bold}${c.green}  ██████╗  █████╗ ███╗   ██╗██╗  ██╗███████╗██╗  ██╗${c.reset}`)
console.log(`${c.bold}${c.cyan}  Analisi Statica Codebase  —  ${now}${c.reset}`)
console.log()

// ── Panoramica ──────────────────────────────────────────────
header('PANORAMICA')
const maxL = Math.max(...[allFiles.length, totalLines].map(String).map(s => s.length))

console.log(`  File totali     ${c.bold}${allFiles.length.toString().padStart(5)}${c.reset}`)
console.log(`  Righe totali    ${c.bold}${totalLines.toLocaleString('it').padStart(5)}${c.reset}`)
console.log()
const cats = [
  ['Componenti JSX ', components.length],
  ['Hook custom    ', hooks.length],
  ['Services       ', services.length],
  ['Config/Costanti', configs.length],
  ['Altro          ', allFiles.length - components.length - hooks.length - services.length - configs.length],
]
const maxCat = Math.max(...cats.map(c => c[1]))
for (const [label, n] of cats) {
  console.log(`  ${label}  ${bar(n, maxCat, 15)} ${c.bold}${String(n).padStart(3)}${c.reset}`)
}

// ── File grandi ──────────────────────────────────────────────
header(`FILE PIÙ GRANDI  ${c.dim}(> 250 righe — candidati refactor)${c.reset}`)
if (!largeFiles.length) {
  console.log(`  ${c.green}Nessun file supera 250 righe.${c.reset}`)
} else {
  const maxLines = largeFiles[0].lineCount
  for (const f of largeFiles.slice(0, 20)) {
    const col = f.lineCount > 500 ? c.red : f.lineCount > 350 ? c.yellow : c.dim
    console.log(`  ${col}${String(f.lineCount).padStart(4)}${c.reset}  ${bar(f.lineCount, maxLines, 16)}  ${f.rel}`)
  }
}

// ── Hotspot dipendenze interne ────────────────────────────────
header('MODULI INTERNI PIÙ IMPORTATI  (hotspot dipendenze)')
if (!topInternal.length) {
  console.log('  Nessuno.')
} else {
  const maxN = topInternal[0][1]
  for (const [mod, n] of topInternal) {
    console.log(`  ${String(n).padStart(3)}x  ${bar(n, maxN, 12)}  ${c.dim}${mod}${c.reset}`)
  }
}

// ── Dipendenze esterne ───────────────────────────────────────
header('DIPENDENZE ESTERNE  (per frequenza import)')
for (const [pkg, n] of topExternal) {
  console.log(`  ${String(n).padStart(3)}x  ${c.magenta}${pkg}${c.reset}`)
}

// ── console.log ─────────────────────────────────────────────
header(`CONSOLE.LOG / WARN / ERROR  ${badge(consolesAll.length)}`)
if (!consolesAll.length) {
  console.log(`  ${c.green}Nessun console.* trovato.${c.reset}`)
} else {
  const byFile = {}
  for (const e of consolesAll) {
    byFile[e.file] = byFile[e.file] ?? []
    byFile[e.file].push(e)
  }
  for (const [file, entries] of Object.entries(byFile).slice(0, 12)) {
    console.log(`  ${c.yellow}${file}${c.reset}`)
    for (const e of entries) {
      console.log(`    ${c.dim}→ riga ${e.line}  console.${e.method}${c.reset}`)
    }
  }
  if (Object.keys(byFile).length > 12) {
    console.log(`  ${c.dim}... e altri ${Object.keys(byFile).length - 12} file${c.reset}`)
  }
}

// ── TODO/FIXME ──────────────────────────────────────────────
header(`TODO / FIXME / HACK  ${badge(todosAll.length, 3, 10)}`)
if (!todosAll.length) {
  console.log(`  ${c.green}Nessun TODO/FIXME trovato.${c.reset}`)
} else {
  for (const t of todosAll.slice(0, 20)) {
    console.log(`  ${c.yellow}${t.file}:${t.line}${c.reset}`)
    console.log(`    ${c.dim}${t.text.slice(0, 80)}${c.reset}`)
  }
  if (todosAll.length > 20) console.log(`  ${c.dim}... e altri ${todosAll.length - 20}${c.reset}`)
}

// ── useEffect sospetti ────────────────────────────────────────
header(`USEEFFECT CON DEPS SOSPETTI  ${badge(effectIssuesAll.length)}`)
if (!effectIssuesAll.length) {
  console.log(`  ${c.green}Nessun problema rilevato.${c.reset}`)
} else {
  for (const e of effectIssuesAll.slice(0, 15)) {
    console.log(`  ${c.yellow}${e.file}:${e.lineNo}${c.reset}  ${c.dim}${e.note}${c.reset}`)
  }
}

// ── Async senza try/catch ────────────────────────────────────
header(`ASYNC POTENZIALMENTE SCOPERTE  ${badge(uncoveredAll.length)}`)
console.log(`  ${c.dim}(file con async >> try/catch — non tutte sono bug)${c.reset}`)
if (!uncoveredAll.length) {
  console.log(`  ${c.green}Nessun file sospetto.${c.reset}`)
} else {
  for (const f of uncoveredAll.slice(0, 10)) {
    console.log(`  ${c.yellow}${f.rel}${c.reset}  ${c.dim}async: ${f.asyncCount}  try: ${f.tryCount}  delta: ${f.uncoveredAsync}${c.reset}`)
  }
}

// ── Riepilogo salute ─────────────────────────────────────────
header('RIEPILOGO SALUTE CODEBASE')

const score = [
  ['File grandi (> 350 rig.)',   largeFiles.filter(f => f.lineCount > 350).length, 0, 5],
  ['console.log / warn',         consolesAll.length, 0, 10],
  ['TODO / FIXME',               todosAll.length, 2, 8],
  ['useEffect sospetti',         effectIssuesAll.length, 0, 5],
  ['Async scoperte (delta > 2)', uncoveredAll.length, 0, 5],
]

for (const [label, val, warn, err] of score) {
  const b = badge(val, warn, err)
  console.log(`  ${label.padEnd(30)} ${b}`)
}

const issues = score.reduce((s, [,v,,e]) => s + (v >= e ? 1 : 0), 0)
console.log()
if (issues === 0) {
  console.log(`  ${c.green}${c.bold}Codebase in buona salute.${c.reset}`)
} else if (issues <= 2) {
  console.log(`  ${c.yellow}${c.bold}Qualche punto da rivedere (${issues} categoria/e).${c.reset}`)
} else {
  console.log(`  ${c.red}${c.bold}Attenzione — ${issues} categorie critiche.${c.reset}`)
}

console.log()
console.log(`  ${c.dim}Per output JSON: node scripts/analyze.mjs --json > report.json${c.reset}`)
console.log()
