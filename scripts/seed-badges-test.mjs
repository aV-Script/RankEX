/**
 * seed-badges-test.mjs
 *
 * Aggiunge un set di badge di test al client "client@test.rankex"
 * nell'organizzazione test-org-pt su rankex-dev.
 *
 * Uso:
 *   node scripts/seed-badges-test.mjs
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

function loadEnv(file) {
  const content = readFileSync(join(__dir, '..', file), 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim()
  }
  return env
}

const env     = loadEnv('.env.development')
const API_KEY = env.VITE_FIREBASE_API_KEY
const PROJECT = env.VITE_FIREBASE_PROJECT_ID
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`

if (!API_KEY || !PROJECT) {
  console.error('❌  credenziali mancanti in .env.development'); process.exit(1)
}

// ── REST helpers ──────────────────────────────────────────────────────────────

async function signIn(email, password) {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }) }
  )
  if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message) }
  return r.json()
}

async function fsGet(path, token) {
  const r = await fetch(`${FS_BASE}/${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!r.ok) { const e = await r.json(); throw new Error(JSON.stringify(e.error)) }
  return r.json()
}

async function fsList(path, token) {
  const r = await fetch(`${FS_BASE}/${path}?pageSize=100`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!r.ok) { const e = await r.json(); throw new Error(JSON.stringify(e.error)) }
  return r.json()
}

async function fsPatch(path, fields, token) {
  const updateMask = Object.keys(fields).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&')
  const r = await fetch(`${FS_BASE}/${path}?${updateMask}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ fields }),
  })
  if (!r.ok) { const e = await r.json(); throw new Error(JSON.stringify(e.error)) }
  return r.json()
}

// ── Firestore value helpers ────────────────────────────────────────────────────

function fsInt(n)  { return { integerValue: String(n) } }
function fsStr(s)  { return { stringValue: s } }
function fsMap(o)  { return { mapValue: { fields: o } } }
function fsArr(a)  { return { arrayValue: { values: a } } }

// ── Badge data da aggiungere ──────────────────────────────────────────────────

const now = Date.now()

const BADGES_TO_ADD = {
  'prima_sessione':    { awardedAt: now - 1000 * 60 * 60 * 24 * 30, awardedBy: 'system' },
  'primo_campionamento': { awardedAt: now - 1000 * 60 * 60 * 24 * 25, awardedBy: 'system' },
  'striscia_5':        { awardedAt: now - 1000 * 60 * 60 * 24 * 18, awardedBy: 'system' },
  'striscia_10':       { awardedAt: now - 1000 * 60 * 60 * 24 * 10, awardedBy: 'system' },
  'primo_rank_up':     { awardedAt: now - 1000 * 60 * 60 * 24 * 7,  awardedBy: 'system' },
  'campione':          { awardedAt: now - 1000 * 60 * 60 * 24 * 3,  awardedBy: 'trainer', note: 'Ottima prestazione al torneo!' },
  'perseveranza':      { awardedAt: now - 1000 * 60 * 60 * 24 * 1,  awardedBy: 'trainer', note: 'Non si arrende mai.' },
}

// Showcase iniziale: i 3 badge più visivi
const SHOWCASE = ['campione', 'striscia_10', 'primo_rank_up']

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🏅  Seed badges test → progetto: ${PROJECT}\n`)

  // 1. Sign in come trainer (ha accesso in scrittura ai client)
  console.log('1. Sign in come trainer…')
  const { idToken } = await signIn('trainer@test.rankex', 'TrainerTest1')
  console.log('   ✅  autenticato')

  // 2. Lista clienti in test-org-pt
  console.log('2. Cerco clienti in organizations/test-org-pt/clients…')
  const list = await fsList('organizations/test-org-pt/clients', idToken)

  if (!list.documents?.length) {
    console.error('   ❌  Nessun cliente trovato in test-org-pt')
    process.exit(1)
  }

  // Prendi il primo (o cerca per nome "Client Test")
  let targetDoc = list.documents.find(d => {
    const name = d.fields?.name?.stringValue ?? ''
    return name.toLowerCase().includes('client') || name.toLowerCase().includes('test')
  }) ?? list.documents[0]

  const clientPath = targetDoc.name.split('/documents/')[1]
  const clientName = targetDoc.fields?.name?.stringValue ?? '(senza nome)'
  console.log(`   ✅  Target: "${clientName}" → ${clientPath}`)

  // 3. Costruisci la mappa badges nested corretta
  console.log('3. Scrivo badges su Firestore…')

  // La REST API richiede che i field annidati siano strutturati come mapValue,
  // NON come chiavi con punto (quelle vengono interpretate come nomi letterali).
  const innerBadgesMap = {}
  for (const [id, data] of Object.entries(BADGES_TO_ADD)) {
    const mapFields = {
      awardedAt: fsInt(data.awardedAt),
      awardedBy: fsStr(data.awardedBy),
    }
    if (data.note) mapFields.note = fsStr(data.note)
    innerBadgesMap[id] = fsMap(mapFields)
  }

  // Scrivi come mappa top-level: badges → { prima_sessione: {...}, ... }
  const fieldsToWrite = {
    badges:        fsMap(innerBadgesMap),
    badgeShowcase: fsArr(SHOWCASE.map(fsStr)),
  }

  await fsPatch(clientPath, fieldsToWrite, idToken)

  console.log(`   ✅  ${Object.keys(BADGES_TO_ADD).length} badge aggiunti`)
  console.log(`   📌  Showcase impostato: ${SHOWCASE.join(', ')}`)

  console.log('\n🎉  Done!\n')
  console.log('   Badge aggiunti:')
  for (const [id, data] of Object.entries(BADGES_TO_ADD)) {
    const daysAgo = Math.round((now - data.awardedAt) / (1000 * 60 * 60 * 24))
    console.log(`     • ${id} (${daysAgo}gg fa, by: ${data.awardedBy})${data.note ? ` — "${data.note}"` : ''}`)
  }
  console.log()
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
