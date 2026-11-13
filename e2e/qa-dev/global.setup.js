/**
 * Setup della QA automatica (STORY-041): guardie su progetto e host, pulizia dei
 * residui E2E- di esecuzioni interrotte, poi un login via UI per ogni utente QA
 * (sessioni salvate in e2e/.auth/qa-dev/, riusate dagli spec). Crea anche un gruppo e uno
 * slot E2E nell'org qa-pt (id in e2e/.auth/qa-dev/e2e-fixtures.json) per i casi di sola lettura.
 */
import { mkdirSync, writeFileSync }           from 'fs'
import { chromium }                           from '@playwright/test'
import { initializeApp, cert, getApps }       from 'firebase-admin/app'
import { getAuth }                            from 'firebase-admin/auth'
import { getFirestore }                       from 'firebase-admin/firestore'
import {
  QA_ORGS, QA_BASE_URL, AUTH_DIR, E2E_FIXTURES_PATH, qaUsers, qaClientUsers, authStatePath,
  assertQaBaseUrl, loadDevServiceAccount, readEnvTest,
} from './qaDev.config.js'
import { cleanupE2EData, cleanupE2EFixtures, createE2EFixtures } from './cleanup.js'

export default async function globalSetup(config) {
  // Ogni progetto, non solo il primo: un baseURL diverso in un progetto aggiunto passerebbe
  for (const project of config.projects) assertQaBaseUrl(project.use.baseURL ?? '')

  const env = readEnvTest()
  if (!env.QA_DEV_PASSWORD) throw new Error('QA_DEV_PASSWORD mancante in .env.test: lancia prima npm run qa:dev:seed')

  const [db, adminAuth] = adminServices(env)
  const removed = await cleanupE2EData(db, adminAuth)
  if (removed) console.log(`pulizia iniziale: ${removed} clienti E2E- rimasti`)
  const removedFixtures = await cleanupE2EFixtures(db)
  if (removedFixtures) console.log(`pulizia iniziale: ${removedFixtures} gruppi/slot E2E- rimasti`)

  // Gruppo + slot per i casi di sola lettura di roles.spec.js; gli id arrivano agli spec dal file
  mkdirSync(AUTH_DIR, { recursive: true })
  const fixtures = await createE2EFixtures(db, Date.now().toString(36))
  writeFileSync(E2E_FIXTURES_PATH, JSON.stringify(fixtures, null, 2))

  const browser = await chromium.launch()
  try {
    for (const moduleKey of Object.keys(QA_ORGS)) {
      for (const user of [...qaUsers(moduleKey), ...qaClientUsers(moduleKey)]) {
        const context = await browser.newContext()
        const page    = await context.newPage()
        await page.goto(`${QA_BASE_URL}/login`)
        await page.getByLabel(/email/i).first().fill(user.email)
        await page.getByLabel(/password/i).first().fill(env.QA_DEV_PASSWORD)
        await page.getByRole('button', { name: /accedi/i }).click()
        await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 30_000 })
        await context.storageState({ path: authStatePath(user.key) })
        await context.close()
      }
    }
  } finally {
    await browser.close()
  }
}

/** Admin SDK su rankex-dev; il service account è verificato prima di inizializzare */
export function adminServices(env = readEnvTest()) {
  const serviceAccount = loadDevServiceAccount(env.QA_DEV_SERVICE_ACCOUNT)
  if (!getApps().length) initializeApp({ credential: cert(serviceAccount) })
  return [getFirestore(), getAuth()]
}
