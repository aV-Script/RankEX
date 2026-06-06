/**
 * seed-test-accounts.mjs
 *
 * Crea gli account e i dati Firestore necessari per i test E2E.
 * Usa solo Firebase Auth REST API + Firestore REST API (no SDK, no service account).
 *
 * Prerequisiti:
 *   - .env.development con le credenziali Firebase rankex-dev
 *   - Un account super_admin già esistente nel progetto rankex-dev
 *
 * Uso:
 *   node scripts/seed-test-accounts.mjs \
 *     --admin-email admin@test.rankex \
 *     --admin-password "TuaPassword"
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname }               from 'path'
import { fileURLToPath }               from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// ── Leggi .env.development ────────────────────────────────────────────────────
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

const env       = loadEnv('.env.development')
const API_KEY   = env.VITE_FIREBASE_API_KEY
const PROJECT   = env.VITE_FIREBASE_PROJECT_ID

if (!API_KEY || !PROJECT) {
  console.error('❌  VITE_FIREBASE_API_KEY o VITE_FIREBASE_PROJECT_ID mancanti in .env.development')
  process.exit(1)
}

// ── Argomenti CLI ─────────────────────────────────────────────────────────────
const args       = process.argv.slice(2)
const getArg     = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null }
const ADMIN_EMAIL = getArg('--admin-email')
const ADMIN_PWD   = getArg('--admin-password')

if (!ADMIN_EMAIL || !ADMIN_PWD) {
  console.error('Uso: node scripts/seed-test-accounts.mjs --admin-email EMAIL --admin-password PASSWORD')
  process.exit(1)
}

// ── Firebase REST helpers ─────────────────────────────────────────────────────
const AUTH_BASE = `https://identitytoolkit.googleapis.com/v1`
const FS_BASE   = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`

async function signIn(email, password) {
  const r = await fetch(`${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password, returnSecureToken: true }),
  })
  if (!r.ok) {
    const e = await r.json()
    throw new Error(`signIn fallito per ${email}: ${e.error?.message}`)
  }
  return r.json()
}

async function signUp(email, password) {
  const r = await fetch(`${AUTH_BASE}/accounts:signUp?key=${API_KEY}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password, returnSecureToken: true }),
  })
  const data = await r.json()
  if (!r.ok) {
    // Prova il login — account già esistente
    if (data.error?.message === 'EMAIL_EXISTS') {
      console.log(`  ℹ️  Account già esistente: ${email}`)
      return signIn(email, password)
    }
    throw new Error(`signUp fallito per ${email}: ${data.error?.message}`)
  }
  return data
}

function fsValue(val) {
  if (val === null)             return { nullValue: null }
  if (typeof val === 'boolean') return { booleanValue: val }
  if (typeof val === 'number')  return { integerValue: String(val) }
  if (typeof val === 'string')  return { stringValue: val }
  if (Array.isArray(val))       return { arrayValue: { values: val.map(fsValue) } }
  if (typeof val === 'object')  return { mapValue: { fields: Object.fromEntries(Object.entries(val).map(([k,v]) => [k, fsValue(v)])) } }
  return { stringValue: String(val) }
}

function toFsDoc(obj) {
  return { fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fsValue(v)])) }
}

async function fsWrite(path, data, idToken) {
  const r = await fetch(`${FS_BASE}/${path}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body:    JSON.stringify(toFsDoc(data)),
  })
  if (!r.ok) {
    const e = await r.json()
    console.warn(`  ⚠️  Firestore write fallita su ${path}: ${JSON.stringify(e.error?.message)}`)
  }
}

// ── Configurazione account di test ────────────────────────────────────────────
const ORG_PT     = 'test-org-pt'
const ORG_SOCCER = 'test-org-soccer'

const ACCOUNTS = [
  { key: 'orgAdmin', email: 'orgadmin@test.rankex',  password: 'OrgAdminTest1',  role: 'org_admin',      orgId: ORG_PT },
  { key: 'trainer',  email: 'trainer@test.rankex',   password: 'TrainerTest1',   role: 'trainer',         orgId: ORG_PT },
  { key: 'staff',    email: 'staff@test.rankex',     password: 'StaffTest1',     role: 'staff_readonly',  orgId: ORG_PT },
  { key: 'coach',    email: 'coach@test.rankex',     password: 'CoachTest1',     role: 'trainer',         orgId: ORG_SOCCER },
  { key: 'client',   email: 'client@test.rankex',    password: 'ClientTest1',    role: 'client',          orgId: ORG_PT },
]

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀  Seed test accounts → progetto: ${PROJECT}\n`)

  // 1. Login super_admin
  console.log('1. Login come super_admin…')
  let adminToken
  try {
    const adminSession = await signIn(ADMIN_EMAIL, ADMIN_PWD)
    adminToken = adminSession.idToken
    console.log('   ✅  super_admin autenticato')
  } catch (e) {
    console.error(`   ❌  ${e.message}`)
    process.exit(1)
  }

  // 2. Crea organizzazioni di test
  console.log('\n2. Crea organizzazioni di test…')

  await fsWrite(`organizations/${ORG_PT}`, {
    name:             'Test Org PT',
    moduleType:       'personal_training',
    terminologyVariant: 'personal_training',
    plan:             'pro',
    status:           'active',
    memberCount:      0,
    clientCount:      0,
    createdAt:        new Date().toISOString(),
  }, adminToken)
  console.log(`   ✅  ${ORG_PT}`)

  await fsWrite(`organizations/${ORG_SOCCER}`, {
    name:             'Test Org Soccer',
    moduleType:       'soccer_academy',
    terminologyVariant: 'soccer_academy',
    plan:             'pro',
    status:           'active',
    memberCount:      0,
    clientCount:      0,
    createdAt:        new Date().toISOString(),
  }, adminToken)
  console.log(`   ✅  ${ORG_SOCCER}`)

  // 3. Crea account utente e profili Firestore
  console.log('\n3. Crea account utenti…')
  const uids = {}

  for (const acc of ACCOUNTS) {
    process.stdout.write(`   • ${acc.email} (${acc.role})… `)
    try {
      const session = await signUp(acc.email, acc.password)
      uids[acc.key] = session.localId

      if (acc.role === 'client') {
        // Il client ha struttura speciale
        const clientId = `test-client-${Date.now()}`
        await fsWrite(`users/${session.localId}`, {
          role:               'client',
          orgId:              acc.orgId,
          clientId,
          mustChangePassword: false,
          createdAt:          new Date().toISOString(),
        }, adminToken)

        // Documento cliente
        await fsWrite(`organizations/${acc.orgId}/clients/${clientId}`, {
          name:          'Mario Rossi (Test)',
          eta:           30,
          sesso:         'M',
          peso:          75,
          altezza:       180,
          email:         acc.email,
          clientAuthUid: session.localId,
          categoria:     'active',
          profileType:   'complete',
          level:         3,
          xp:            120,
          xpNext:        583,
          rank:          'C',
          rankColor:     '#facc15',
          media:         46,
          stats:         { velocita: 50, forza: 45, resistenza: 42 },
          campionamenti: [],
          log:           [],
          biaHistory:    [],
          lastBia:       null,
          sessionsPerWeek: 3,
          createdAt:     new Date().toISOString(),
        }, adminToken)

        // Membro nell'org
        await fsWrite(`organizations/${acc.orgId}/members/${session.localId}`, {
          role:     acc.role,
          email:    acc.email,
          name:     'Mario Rossi (Test)',
          joinedAt: new Date().toISOString(),
        }, adminToken)

      } else {
        // Trainer, org_admin, staff
        await fsWrite(`users/${session.localId}`, {
          role:               acc.role,
          orgId:              acc.orgId,
          moduleType:         acc.orgId === ORG_SOCCER ? 'soccer_academy' : 'personal_training',
          terminologyVariant: acc.orgId === ORG_SOCCER ? 'soccer_academy' : 'personal_training',
          mustChangePassword: false,
          createdAt:          new Date().toISOString(),
        }, adminToken)

        await fsWrite(`organizations/${acc.orgId}/members/${session.localId}`, {
          role:     acc.role,
          email:    acc.email,
          name:     `${acc.key} (Test)`,
          joinedAt: new Date().toISOString(),
        }, adminToken)
      }

      console.log(`✅  (uid: ${session.localId.slice(0, 8)}…)`)
    } catch (e) {
      console.log(`\n     ❌  ${e.message}`)
    }
  }

  // 4. Genera .env.test
  console.log('\n4. Genera .env.test…')
  const envTest = `# Generato da seed-test-accounts.mjs — ${new Date().toISOString()}
PLAYWRIGHT_BASE_URL=http://localhost:5173
PLAYWRIGHT_ADMIN_URL=http://localhost:5174

E2E_TRAINER_EMAIL=${ACCOUNTS.find(a => a.key === 'trainer').email}
E2E_TRAINER_PASSWORD=${ACCOUNTS.find(a => a.key === 'trainer').password}

E2E_ORGADMIN_EMAIL=${ACCOUNTS.find(a => a.key === 'orgAdmin').email}
E2E_ORGADMIN_PASSWORD=${ACCOUNTS.find(a => a.key === 'orgAdmin').password}

E2E_CLIENT_EMAIL=${ACCOUNTS.find(a => a.key === 'client').email}
E2E_CLIENT_PASSWORD=${ACCOUNTS.find(a => a.key === 'client').password}

E2E_STAFF_EMAIL=${ACCOUNTS.find(a => a.key === 'staff').email}
E2E_STAFF_PASSWORD=${ACCOUNTS.find(a => a.key === 'staff').password}

E2E_SUPERADMIN_EMAIL=${ADMIN_EMAIL}
E2E_SUPERADMIN_PASSWORD=${ADMIN_PWD}

E2E_ORG_PT=${ORG_PT}
E2E_ORG_SOCCER=${ORG_SOCCER}
`
  writeFileSync(join(__dir, '..', '.env.test'), envTest, 'utf8')
  console.log('   ✅  .env.test creato')

  console.log(`
✅  Seed completato!

Account creati:
  Trainer:    ${ACCOUNTS.find(a => a.key === 'trainer').email}   / TrainerTest1
  Org Admin:  ${ACCOUNTS.find(a => a.key === 'orgAdmin').email}  / OrgAdminTest1
  Staff:      ${ACCOUNTS.find(a => a.key === 'staff').email}     / StaffTest1
  Coach:      ${ACCOUNTS.find(a => a.key === 'coach').email}     / CoachTest1
  Client:     ${ACCOUNTS.find(a => a.key === 'client').email}    / ClientTest1

Prossimi passi:
  1. npm run dev            (avvia il dev server)
  2. npm run test:e2e:setup (salva le sessioni auth)
  3. npm run test:e2e       (esegui i test)
`)
}

main().catch(e => { console.error(e); process.exit(1) })
