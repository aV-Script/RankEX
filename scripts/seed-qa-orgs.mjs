/**
 * seed-qa-orgs.mjs — STORY-041
 *
 * Crea o riallinea su rankex-dev le 3 org fisse della QA automatica (qa-pt, qa-soccer,
 * qa-lipedema), ognuna con org_admin, trainer, staff_readonly e un cliente/paziente
 * di base. Idempotente: rilanciarlo non duplica nulla, reimposta solo le password.
 * Cancella anche i residui E2E- di esecuzioni interrotte.
 *
 * Rifiuta qualsiasi progetto diverso da rankex-dev (service account e .env.development).
 * I clienti passano dalla Cloud Function vera (creaCliente), come dall'app.
 *
 * Uso:
 *   node scripts/seed-qa-orgs.mjs [service-account-rankex-dev.json]
 * Senza argomento usa QA_DEV_SERVICE_ACCOUNT da .env.test. Scrive in .env.test
 * QA_DEV_SERVICE_ACCOUNT e QA_DEV_PASSWORD (password unica degli utenti QA).
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { randomBytes }                            from 'crypto'
import { initializeApp as initAdmin, cert }       from 'firebase-admin/app'
import { getAuth as getAdminAuth }                from 'firebase-admin/auth'
import { getFirestore, FieldValue }               from 'firebase-admin/firestore'
import { initializeApp, deleteApp }               from 'firebase/app'
import { getAuth, signInWithEmailAndPassword }    from 'firebase/auth'
import { getFunctions, httpsCallable }            from 'firebase/functions'
import {
  QA_ORGS, qaUsers, ENV_TEST_PATH, QA_BASE_URL,
  loadDevServiceAccount, loadDevClientEnv, readEnvTest,
} from '../e2e/qa-dev/qaDev.config.js'
import { cleanupE2EData } from '../e2e/qa-dev/cleanup.js'

const REGION    = 'europe-west1'
const ENV_BLOCK = '# QA automatica rankex-dev (scripts/seed-qa-orgs.mjs)'

// ── Guardie: solo rankex-dev ──────────────────────────────────────────────────
const envTest        = readEnvTest()
const saPath         = process.argv[2] ?? envTest.QA_DEV_SERVICE_ACCOUNT
const serviceAccount = loadDevServiceAccount(saPath)
const clientEnv      = loadDevClientEnv()

initAdmin({ credential: cert(serviceAccount) })
const db        = getFirestore()
const adminAuth = getAdminAuth()

const password = envTest.QA_DEV_PASSWORD || `QaDev${randomBytes(5).toString('hex')}7`
writeEnvTest({ QA_DEV_SERVICE_ACCOUNT: saPath, QA_DEV_PASSWORD: password })

const removed = await cleanupE2EData(db, adminAuth)
if (removed) console.log(`pulizia: ${removed} clienti E2E- di esecuzioni precedenti`)

for (const [moduleKey, org] of Object.entries(QA_ORGS)) {
  const users = await ensureOrgAndStaff(moduleKey, org)
  await ensureBaseClient(moduleKey, org, users)
  await syncCounters(org.orgId)
  console.log(`✓ ${org.orgId}`)
}

console.log(`\nOrg QA pronte su rankex-dev: ${QA_BASE_URL}`)
for (const moduleKey of Object.keys(QA_ORGS)) {
  for (const user of qaUsers(moduleKey)) console.log(`  ${user.role.padEnd(15)} ${user.email}`)
}
console.log('  password: QA_DEV_PASSWORD in .env.test')
process.exit(0)

// ── helper ────────────────────────────────────────────────────────────────────

/** Org (creata solo se manca) e staff per ruolo, come CreateOrgForm + creaMembroTeam */
async function ensureOrgAndStaff(moduleKey, org) {
  const orgRef = db.doc(`organizations/${org.orgId}`)
  if (!(await orgRef.get()).exists) {
    await orgRef.set({
      name: org.name, moduleType: org.moduleType, terminologyVariant: org.terminologyVariant,
      plan: 'pro', status: 'active', ownerId: null,
      memberCount: 0, clientCount: 0, createdAt: FieldValue.serverTimestamp(),
    })
  }

  const users = {}
  for (const user of qaUsers(moduleKey)) {
    const uid = await upsertAuthUser(user.email, user.name, org.orgId)
    users[user.role] = uid
    const batch = db.batch()
    batch.set(db.doc(`users/${uid}`), {
      role: user.role, orgId: org.orgId, name: user.name, email: user.email,
      moduleType: org.moduleType, terminologyVariant: org.terminologyVariant, mustChangePassword: false,
    })
    batch.set(db.doc(`organizations/${org.orgId}/members/${uid}`), {
      role: user.role, name: user.name, email: user.email, joinedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
    await batch.commit()
  }
  if (!(await orgRef.get()).data().ownerId) await orgRef.update({ ownerId: users.org_admin })
  return users
}

/**
 * Crea l'utente o ne reimposta la password. Un account esistente di un'altra org non
 * si tocca mai: il seed si ferma (password e profilo di qualcun altro non vanno riscritti)
 */
async function upsertAuthUser(email, displayName, orgId) {
  const existing = await adminAuth.getUserByEmail(email).catch(err => {
    if (err.code === 'auth/user-not-found') return null
    throw err
  })
  if (!existing) {
    const { uid } = await adminAuth.createUser({ email, password, displayName })
    return uid
  }
  const profile = (await db.doc(`users/${existing.uid}`).get()).data()
  if (profile && profile.orgId !== orgId) {
    throw new Error(`Rifiutato: ${email} esiste già nell'org "${profile.orgId}", non in ${orgId}. Nessuna modifica all'account`)
  }
  await adminAuth.updateUser(existing.uid, { password, displayName })
  return existing.uid
}

/** Il cliente/paziente di base, creato da creaCliente come org_admin se non c'è */
async function ensureBaseClient(moduleKey, org, users) {
  const { email: clientEmail, ...formData } = org.baseClient
  const existing = await db.collection(`organizations/${org.orgId}/clients`)
    .where('name', '==', formData.name).limit(1).get()

  if (!existing.empty) {
    const { clientAuthUid } = existing.docs[0].data()
    if (clientAuthUid) await adminAuth.updateUser(clientAuthUid, { password })
    return
  }

  const hasLogin = Boolean(clientEmail)
  // Un account Auth rimasto da un seed interrotto bloccherebbe creaCliente (email già in uso)
  if (hasLogin) await adminAuth.getUserByEmail(clientEmail).then(({ uid }) => adminAuth.deleteUser(uid)).catch(() => {})

  const app = initializeApp({
    apiKey: clientEnv.VITE_FIREBASE_API_KEY, authDomain: clientEnv.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: clientEnv.VITE_FIREBASE_PROJECT_ID, appId: clientEnv.VITE_FIREBASE_APP_ID,
  }, `seed-${moduleKey}`)
  try {
    const admin = qaUsers(moduleKey).find(user => user.role === 'org_admin')
    await signInWithEmailAndPassword(getAuth(app), admin.email, password)
    const creaCliente = httpsCallable(getFunctions(app, REGION), 'creaCliente')
    await creaCliente({
      orgId: org.orgId, trainerId: users.trainer,
      formData: hasLogin ? { ...formData, email: clientEmail, password } : formData,
    })
    console.log(`  cliente di base: ${formData.name}`)
  } finally {
    await deleteApp(app)
  }
}

/** I counter riflettono i documenti reali: il seed non deve spostarli a ogni esecuzione */
async function syncCounters(orgId) {
  const orgRef = db.doc(`organizations/${orgId}`)
  const [members, clients] = await Promise.all([
    orgRef.collection('members').count().get(),
    orgRef.collection('clients').count().get(),
  ])
  await orgRef.update({ memberCount: members.data().count, clientCount: clients.data().count })
}

/** Riscrive solo il blocco QA di .env.test, lasciando intatto il resto */
function writeEnvTest(values) {
  const current = existsSync(ENV_TEST_PATH) ? readFileSync(ENV_TEST_PATH, 'utf8') : ''
  const kept    = current.split(/\r?\n/)
    .filter(line => line !== ENV_BLOCK && !Object.keys(values).some(key => line.startsWith(`${key}=`)))
    .join('\n').replace(/\n+$/, '')
  const block = [ENV_BLOCK, ...Object.entries(values).map(([key, value]) => `${key}=${value}`)].join('\n')
  writeFileSync(ENV_TEST_PATH, `${kept ? `${kept}\n\n` : ''}${block}\n`)
}
