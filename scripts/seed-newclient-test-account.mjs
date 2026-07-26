/**
 * seed-newclient-test-account.mjs
 *
 * Crea UN account cliente con mustChangePassword=true, per il test e2e
 * TP-003 (schermata cambio password obbligatorio al primo accesso) —
 * gli altri account seedati da seed-test-accounts.mjs hanno tutti
 * mustChangePassword=false, quindi quel test skippava sempre.
 *
 * Usa Firebase Auth REST API + Firestore REST API (stesso pattern di
 * seed-test-accounts.mjs), leggendo le credenziali super_admin da .env.test
 * invece che da CLI args.
 *
 * Prerequisiti:
 *   - .env.development con le credenziali Firebase rankex-dev
 *   - .env.test con E2E_SUPERADMIN_EMAIL/PASSWORD e E2E_ORG_PT già valorizzati
 *     (generati da seed-test-accounts.mjs)
 *
 * Uso:
 *   node scripts/seed-newclient-test-account.mjs
 */

import { readFileSync, appendFileSync } from 'fs'
import { join, dirname }                 from 'path'
import { fileURLToPath }                 from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

function loadEnv(file) {
  const path    = join(__dir, '..', file)
  const content = readFileSync(path, 'utf8')
  const env     = {}
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim()
  }
  return env
}

const devEnv  = loadEnv('.env.development')
const testEnv = loadEnv('.env.test')

const API_KEY = devEnv.VITE_FIREBASE_API_KEY
const PROJECT = devEnv.VITE_FIREBASE_PROJECT_ID
const ADMIN_EMAIL = testEnv.E2E_SUPERADMIN_EMAIL
const ADMIN_PWD   = testEnv.E2E_SUPERADMIN_PASSWORD
const ORG_PT       = testEnv.E2E_ORG_PT || 'test-org-pt'

if (!API_KEY || !PROJECT) {
  console.error('❌  VITE_FIREBASE_API_KEY o VITE_FIREBASE_PROJECT_ID mancanti in .env.development')
  process.exit(1)
}
if (!ADMIN_EMAIL || !ADMIN_PWD) {
  console.error('❌  E2E_SUPERADMIN_EMAIL/PASSWORD mancanti in .env.test (esegui prima seed-test-accounts.mjs)')
  process.exit(1)
}

const AUTH_BASE = `https://identitytoolkit.googleapis.com/v1`
const FS_BASE   = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`

async function signIn(email, password) {
  const r = await fetch(`${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
  if (!r.ok) { const e = await r.json(); throw new Error(`signIn fallito: ${e.error?.message}`) }
  return r.json()
}

async function signUp(email, password) {
  const r = await fetch(`${AUTH_BASE}/accounts:signUp?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
  const data = await r.json()
  if (!r.ok) {
    if (data.error?.message === 'EMAIL_EXISTS') {
      console.log(`  ℹ️  Account già esistente: ${email}`)
      return signIn(email, password)
    }
    throw new Error(`signUp fallito: ${data.error?.message}`)
  }
  return data
}

function fsValue(val) {
  if (val === null)             return { nullValue: null }
  if (typeof val === 'boolean') return { booleanValue: val }
  if (typeof val === 'number')  return { integerValue: String(val) }
  if (typeof val === 'string')  return { stringValue: val }
  if (Array.isArray(val))       return { arrayValue: { values: val.map(fsValue) } }
  if (typeof val === 'object')  return { mapValue: { fields: Object.fromEntries(Object.entries(val).map(([k, v]) => [k, fsValue(v)])) } }
  return { stringValue: String(val) }
}
function toFsDoc(obj) {
  return { fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fsValue(v)])) }
}
async function fsWrite(path, data, idToken) {
  const r = await fetch(`${FS_BASE}/${path}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(toFsDoc(data)),
  })
  if (!r.ok) {
    const e = await r.json()
    console.warn(`  ⚠️  Firestore write fallita su ${path}: ${JSON.stringify(e.error?.message)}`)
  }
}

const NEWCLIENT_EMAIL    = 'newclient@test.rankex'
const NEWCLIENT_PASSWORD = 'TempPass1'

async function main() {
  console.log(`\n🚀  Seed account mustChangePassword=true → progetto: ${PROJECT}\n`)

  const adminSession = await signIn(ADMIN_EMAIL, ADMIN_PWD)
  const adminToken   = adminSession.idToken
  console.log('   ✅  super_admin autenticato')

  const session  = await signUp(NEWCLIENT_EMAIL, NEWCLIENT_PASSWORD)
  const clientId = `test-newclient-${Date.now()}`

  await fsWrite(`users/${session.localId}`, {
    role:               'client',
    orgId:              ORG_PT,
    clientId,
    mustChangePassword: true,
    createdAt:          new Date().toISOString(),
  }, adminToken)

  await fsWrite(`organizations/${ORG_PT}/clients/${clientId}`, {
    name:            'E2E Onboarding (Test)',
    eta:             25,
    sesso:           'F',
    peso:            60,
    altezza:         165,
    email:           NEWCLIENT_EMAIL,
    clientAuthUid:   session.localId,
    categoria:       'health',
    profileType:     'tests_only',
    level:           1,
    xp:              0,
    xpNext:          500,
    rank:            null,
    rankColor:       null,
    media:           null,
    stats:           {},
    campionamenti:   [],
    log:             [],
    biaHistory:      [],
    lastBia:         null,
    sessionsPerWeek: 2,
    createdAt:       new Date().toISOString(),
  }, adminToken)

  await fsWrite(`organizations/${ORG_PT}/members/${session.localId}`, {
    role:     'client',
    email:    NEWCLIENT_EMAIL,
    name:     'E2E Onboarding (Test)',
    joinedAt: new Date().toISOString(),
  }, adminToken)

  console.log(`   ✅  ${NEWCLIENT_EMAIL} (uid: ${session.localId.slice(0, 8)}…, mustChangePassword: true)`)

  const envTestPath = join(__dir, '..', '.env.test')
  const already = readFileSync(envTestPath, 'utf8').includes('E2E_NEWCLIENT_EMAIL')
  if (!already) {
    appendFileSync(envTestPath, `\nE2E_NEWCLIENT_EMAIL=${NEWCLIENT_EMAIL}\nE2E_NEWCLIENT_PASSWORD=${NEWCLIENT_PASSWORD}\n`)
    console.log('   ✅  E2E_NEWCLIENT_EMAIL/PASSWORD aggiunti a .env.test')
  } else {
    console.log('   ℹ️  .env.test ha già E2E_NEWCLIENT_EMAIL — non sovrascritto')
  }

  console.log('\n✅  Fatto. TP-003 (cambio password obbligatorio) ora ha un account reale.\n')
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
