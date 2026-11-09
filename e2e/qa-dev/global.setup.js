/**
 * Setup della QA automatica (STORY-041): guardie su progetto e host, pulizia dei
 * residui E2E- di esecuzioni interrotte, poi un login via UI per ogni utente QA
 * (sessioni salvate in e2e/.auth/qa-dev/, riusate dagli spec).
 */
import { mkdirSync }                          from 'fs'
import { chromium }                           from '@playwright/test'
import { initializeApp, cert, getApps }       from 'firebase-admin/app'
import { getAuth }                            from 'firebase-admin/auth'
import { getFirestore }                       from 'firebase-admin/firestore'
import {
  QA_ORGS, QA_BASE_URL, AUTH_DIR, qaUsers, authStatePath,
  assertQaBaseUrl, loadDevServiceAccount, readEnvTest,
} from './qaDev.config.js'
import { cleanupE2EData } from './cleanup.js'

export default async function globalSetup(config) {
  const baseURL = config.projects[0].use.baseURL
  assertQaBaseUrl(baseURL)

  const env = readEnvTest()
  if (!env.QA_DEV_PASSWORD) throw new Error('QA_DEV_PASSWORD mancante in .env.test: lancia prima npm run qa:dev:seed')

  const removed = await cleanupE2EData(...adminServices(env))
  if (removed) console.log(`pulizia iniziale: ${removed} clienti E2E- rimasti`)

  mkdirSync(AUTH_DIR, { recursive: true })
  const browser = await chromium.launch()
  try {
    for (const moduleKey of Object.keys(QA_ORGS)) {
      for (const user of qaUsers(moduleKey)) {
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
