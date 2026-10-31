/**
 * seed-demo-lipedema.mjs
 *
 * Crea su rankex-dev un'organizzazione "Demo Lipedema" con utenti per ruolo, pazienti e
 * valutazioni (2MWT, 30s-STS, Handgrip) per vedere il modulo con dati realistici.
 * Le valutazioni passano dalle Cloud Functions vere (creaCliente, aggiungiValutazione),
 * quindi risultati e validazioni sono quelli del server. Mai contro la produzione.
 *
 * Uso:
 *   node scripts/seed-demo-lipedema.mjs <service-account-rankex-dev.json> [--reset]
 *
 * --reset cancella prima l'org demo, i suoi utenti Auth e /users, poi la ricrea.
 */

import { readFileSync }                         from 'fs'
import { randomBytes }                          from 'crypto'
import { initializeApp as initAdmin, cert }     from 'firebase-admin/app'
import { getAuth as getAdminAuth }              from 'firebase-admin/auth'
import { getFirestore, FieldValue }             from 'firebase-admin/firestore'
import { initializeApp }                        from 'firebase/app'
import { getAuth, signInWithEmailAndPassword }  from 'firebase/auth'
import { getFunctions, httpsCallable }          from 'firebase/functions'

const ORG_ID   = 'demo-lipedema'
const REGION   = 'europe-west1'
const PASSWORD = `Demo${randomBytes(4).toString('hex')}9`
const USERS    = [
  { key: 'admin', email: 'demo.lipedema.admin@test.rankex', name: 'Dott.ssa Demo Admin', role: 'org_admin' },
  { key: 'staff', email: 'demo.lipedema.staff@test.rankex', name: 'Demo Staff',          role: 'staff_readonly' },
]

const [saPath, flag] = process.argv.slice(2)
if (!saPath) {
  console.error('Uso: node scripts/seed-demo-lipedema.mjs <service-account-rankex-dev.json> [--reset]')
  process.exit(1)
}
const serviceAccount = JSON.parse(readFileSync(saPath, 'utf8'))
if (serviceAccount.project_id !== 'rankex-dev') {
  console.error(`Rifiutato: il service account è di "${serviceAccount.project_id}", non di rankex-dev`)
  process.exit(1)
}

initAdmin({ credential: cert(serviceAccount) })
const db        = getFirestore()
const adminAuth = getAdminAuth()

const env = Object.fromEntries(
  readFileSync(new URL('../.env.development', import.meta.url), 'utf8')
    .split('\n').map(line => line.match(/^([^#=]+)=(.*)$/)).filter(Boolean)
    .map(([, key, value]) => [key.trim(), value.trim()]),
)
if (env.VITE_FIREBASE_PROJECT_ID !== 'rankex-dev') {
  console.error('Rifiutato: .env.development non punta a rankex-dev')
  process.exit(1)
}

const orgRef = db.doc(`organizations/${ORG_ID}`)

if (flag === '--reset') await resetDemo()
if ((await orgRef.get()).exists) {
  console.error(`L'org ${ORG_ID} esiste già: rilancia con --reset per ricrearla`)
  process.exit(1)
}

// ── Org e staff (come CreateOrgForm + creaMembroTeam) ─────────────────────────
await orgRef.set({
  name: 'Demo Lipedema', moduleType: 'lipedema', terminologyVariant: 'lipedema',
  plan: 'pro', status: 'active', ownerId: null,
  memberCount: 0, clientCount: 0, createdAt: FieldValue.serverTimestamp(),
})
const uids = {}
for (const user of USERS) {
  const { uid } = await adminAuth.createUser({ email: user.email, password: PASSWORD, displayName: user.name })
  uids[user.key] = uid
  const batch = db.batch()
  batch.set(db.doc(`users/${uid}`), {
    role: user.role, orgId: ORG_ID, name: user.name, email: user.email,
    moduleType: 'lipedema', terminologyVariant: 'lipedema', mustChangePassword: false,
  })
  batch.set(db.doc(`organizations/${ORG_ID}/members/${uid}`), {
    role: user.role, name: user.name, email: user.email, joinedAt: FieldValue.serverTimestamp(),
  })
  batch.update(orgRef, { memberCount: FieldValue.increment(1) })
  await batch.commit()
}

// ── Pazienti e valutazioni via Cloud Functions, come il professionista ───────
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID, appId: env.VITE_FIREBASE_APP_ID,
})
await signInWithEmailAndPassword(getAuth(app), USERS[0].email, PASSWORD)
const functions   = getFunctions(app, REGION)
const creaCliente = httpsCallable(functions, 'creaCliente')
const aggiungi    = httpsCallable(functions, 'aggiungiValutazione')

const NOTICE = { informativaVersion: 'v1.0', deliveredAt: '2026-09-01' }

const giulia = await createPatient({ name: 'Giulia Demo', dataNascita: '1988-04-12', sesso: 'F', peso: 72, altezza: 165, privacyNotice: NOTICE })
await visit(giulia, [walk('2026-09-03T10:00', 4, 2),  sts('2026-09-03T10:20', 9),        grip('2026-09-03T10:40', [24, 22, 25, 21.5, 24.5, 22])])
await visit(giulia, [walk('2026-10-01T10:00', 4, 14), sts('2026-10-01T10:20', 11, true), grip('2026-10-01T10:40', [25.5, 23, 26, 23.5, 25, 22.5])])
await visit(giulia, [walk('2026-10-29T10:00', 4, 26), sts('2026-10-29T10:20', 13),       grip('2026-10-29T10:40', [27, 24, 26.5, 25, 27.5, 24.5])])

const marta = await createPatient({ name: 'Marta Demo', dataNascita: '1979-11-02', sesso: 'F', peso: 81, altezza: 168, privacyNotice: NOTICE })
await visit(marta, [walk('2026-09-10T09:00', 3, 20), sts('2026-09-10T09:20', 8)])
await visit(marta, [walk('2026-10-08T09:00', 5, 3, 20)])                                 // variante percorso 20 m
await visit(marta, [sts('2026-10-08T09:20', 6, false, { usedArms: true })])               // invalidata (uso braccia)
await visit(marta, [walk('2026-10-27T09:00', 3, 18, 30, { stoppedEarly: true, stopTimeS: 95 }, { stopReasonCode: 'lower_limb_pain' })])

await createPatient({ name: 'Sara Demo (senza informativa)', dataNascita: '1992-06-20', sesso: 'F', peso: 68, altezza: 160 })

console.log('\nOrg demo creata su rankex-dev: https://rankex-app-dev.web.app')
for (const user of USERS) console.log(`  ${user.role.padEnd(15)} ${user.email}`)
console.log(`  password (entrambi): ${PASSWORD}`)
process.exit(0)

// ── helper ────────────────────────────────────────────────────────────────────

async function createPatient(formData) {
  const { data } = await creaCliente({ orgId: ORG_ID, trainerId: uids.admin, formData })
  console.log(`paziente: ${formData.name}`)
  return data.clientId ?? data.id
}

async function visit(clientId, tests) {
  await aggiungi({ orgId: ORG_ID, clientId, tests })
}

function walk(performedAt, fullLengths, partialDistanceM, courseLengthM = 30, events = {}, clinical = {}) {
  return {
    testId: 'lipedema_2mwt', performedAt,
    setup: { courseLengthM, assistiveDevice: 'none', ...(courseLengthM !== 30 ? { variantConfirmed: true } : {}) },
    trial: { fullLengths, partialDistanceM },
    events: { stoppedEarly: false, pauseCount: 0, ...events },
    clinical, deviation: { present: false },
  }
}

function sts(performedAt, completeRepetitions, partialRepCounted = false, events = {}) {
  return {
    testId: 'lipedema_30s_sts', performedAt,
    setup: { chairHeightCm: 43.2, chairHasArmrests: false, armsCrossed: true },
    trial: { completeRepetitions, partialRepCounted: events.usedArms ? false : partialRepCounted },
    events: { usedArms: false, stoppedEarly: false, technicalError: false, familiarizationDone: true, pauseCount: 0, ...events },
    clinical: {}, deviation: { present: false },
  }
}

function grip(performedAt, kgf) {
  const sides = ['R', 'L', 'R', 'L', 'R', 'L']
  return {
    testId: 'lipedema_handgrip', performedAt,
    setup: { dominantSide: 'R', device: { brand: 'Jamar', model: 'Plus+' }, gripSetting: 'Posizione 2', nativeUnit: 'kgf' },
    trials: kgf.map((nativeValue, i) => ({ seq: i + 1, side: sides[i], valid: true, nativeValue })),
    events: { stoppedEarly: false }, clinical: {}, deviation: { present: false },
  }
}

async function resetDemo() {
  const users = await db.collection('users').where('orgId', '==', ORG_ID).get()
  for (const userDoc of users.docs) {
    await adminAuth.deleteUser(userDoc.id).catch(() => {})
    await userDoc.ref.delete()
  }
  for (const user of USERS) {
    await adminAuth.getUserByEmail(user.email).then(({ uid }) => adminAuth.deleteUser(uid)).catch(() => {})
  }
  await db.recursiveDelete(orgRef)
  console.log(`reset: org ${ORG_ID} e utenti demo cancellati`)
}
