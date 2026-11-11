/**
 * migrate-org-dates-dev.mjs — Sprint #15
 *
 * Solo rankex-dev. Converte in ISO string i Timestamp Firestore rimasti in
 * organizations/{orgId}.createdAt e organizations/{orgId}/members/{uid}.joinedAt
 * (scritti da vecchi seed). L'app li scrive già come ISO string.
 * Idempotente: le stringhe ISO non si toccano. Di default dry-run; scrive solo con --apply.
 *
 * Rifiuta qualsiasi progetto diverso da rankex-dev (service account e Firestore inizializzato).
 *
 * Uso: node scripts/migrate-org-dates-dev.mjs <service-account-rankex-dev.json> [--apply]
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore }        from 'firebase-admin/firestore'
import { loadDevServiceAccount, assertDevFirestore } from '../e2e/qa-dev/qaDev.config.js'

const saPath = process.argv[2]
const APPLY  = process.argv.includes('--apply')
if (!saPath) {
  console.error('Uso: node scripts/migrate-org-dates-dev.mjs <service-account-rankex-dev.json> [--apply]')
  process.exit(1)
}

// Guardie: service account (project_id + client_email) e Firestore effettivo di rankex-dev
const serviceAccount = loadDevServiceAccount(saPath)
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()
assertDevFirestore(db)

const isTimestamp = value => Boolean(value) && typeof value.toDate === 'function'

/** Converte `field` del doc se è un Timestamp; ritorna true se ha convertito (o convertirebbe) */
async function migrateField(doc, field) {
  const value = doc.get(field)
  if (!isTimestamp(value)) return false
  if (APPLY) await doc.ref.update({ [field]: value.toDate().toISOString() })
  return true
}

async function countRemaining() {
  let remaining = 0
  for (const orgDoc of (await db.collection('organizations').get()).docs) {
    if (isTimestamp(orgDoc.get('createdAt'))) remaining++
    for (const memberDoc of (await orgDoc.ref.collection('members').get()).docs) {
      if (isTimestamp(memberDoc.get('joinedAt'))) remaining++
    }
  }
  return remaining
}

async function main() {
  console.log(`Progetto: ${serviceAccount.project_id}   modalità: ${APPLY ? 'APPLY (scrive)' : 'dry-run (sola lettura)'}`)
  let scanned = 0
  let converted = 0

  for (const orgDoc of (await db.collection('organizations').get()).docs) {
    scanned++
    if (await migrateField(orgDoc, 'createdAt')) converted++
    for (const memberDoc of (await orgDoc.ref.collection('members').get()).docs) {
      scanned++
      if (await migrateField(memberDoc, 'joinedAt')) converted++
    }
  }

  const remaining = await countRemaining()
  console.log(`\nDocumenti controllati: ${scanned}`)
  console.log(`${APPLY ? 'Convertiti' : 'Da convertire'}: ${converted}`)
  console.log(`Timestamp ancora presenti: ${remaining}`)
  if (!APPLY) console.log('Dry-run: nessuna scrittura. Rilanciare con --apply.')
}

main().catch(err => { console.error(err); process.exit(1) })
