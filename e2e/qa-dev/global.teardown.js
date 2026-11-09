/** Teardown della QA automatica (STORY-041): cancella i dati E2E- creati dagli spec */
import { cleanupE2EData } from './cleanup.js'
import { adminServices }  from './global.setup.js'

export default async function globalTeardown() {
  const removed = await cleanupE2EData(...adminServices())
  console.log(`pulizia finale: ${removed} clienti E2E- cancellati`)
}
