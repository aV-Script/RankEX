/**
 * backfill-badges.mjs
 *
 * Assegna i trofei automatici già maturati ma mai scritti. Fino a ott 2026 li
 * assegnava il browser del trainer solo quando apriva la scheda del cliente:
 * chi non è mai stato aperto dopo aver maturato un trofeo non lo ha. Da allora li
 * assegnano chiudiSessione e salvaCampionamento; questo script sistema il pregresso.
 * Di default in SOLA LETTURA; scrive solo con --apply.
 *
 * L'output riporta solo id e trofei, nessun nome.
 *
 * Uso: node scripts/backfill-badges.mjs <service-account.json> [--apply]
 */

import { readFileSync }     from 'fs'
import admin                from 'firebase-admin'
import { autoBadgeFields }  from '../functions/src/shared/badges.js'

const saPath = process.argv[2]
const APPLY  = process.argv.includes('--apply')
if (!saPath) {
  console.error('Uso: node scripts/backfill-badges.mjs <service-account.json> [--apply]')
  process.exit(1)
}

const saJson = JSON.parse(readFileSync(saPath, 'utf-8'))
admin.initializeApp({ credential: admin.credential.cert(saJson) })
const db = admin.firestore()

async function main() {
  console.log(`🔑  Progetto: ${saJson.project_id}   modalità: ${APPLY ? 'APPLY (scrive)' : 'dry-run (sola lettura)'}`)
  let total = 0
  const changes = []

  for (const orgDoc of (await db.collection('organizations').get()).docs) {
    for (const clientDoc of (await db.collection(`organizations/${orgDoc.id}/clients`).get()).docs) {
      total++
      const fields = autoBadgeFields(clientDoc.data(), {})
      const ids    = Object.keys(fields).map(k => k.replace('badges.', ''))
      if (ids.length === 0) continue
      changes.push(`${orgDoc.id}/${clientDoc.id}: ${ids.join(', ')}`)
      if (APPLY) await clientDoc.ref.update(fields)
    }
  }

  console.log(`\n📊  Clienti: ${total} · con trofei da assegnare: ${changes.length}`)
  changes.forEach(c => console.log(`   - ${c}`))
  console.log(APPLY ? `\n✅  Aggiornati: ${changes.length}` : '\nℹ️   Dry-run: nessuna scrittura. Rilanciare con --apply.')
}

main().catch(err => { console.error(err); process.exit(1) })
