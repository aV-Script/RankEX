/** Teardown della QA automatica (STORY-041): cancella i dati E2E- creati dagli spec e dal setup */
import { rmSync }            from 'fs'
import { cleanupE2EData, cleanupE2EFixtures } from './cleanup.js'
import { adminServices }     from './global.setup.js'
import { E2E_FIXTURES_PATH } from './qaDev.config.js'

export default async function globalTeardown() {
  const [db, adminAuth] = adminServices()
  const removed = await cleanupE2EData(db, adminAuth)
  console.log(`pulizia finale: ${removed} clienti E2E- cancellati`)
  const removedFixtures = await cleanupE2EFixtures(db)
  console.log(`pulizia finale: ${removedFixtures} gruppi/slot E2E- cancellati`)
  rmSync(E2E_FIXTURES_PATH, { force: true })
}
