/**
 * sync-fasce-soccer.mjs
 *
 * Allinea client.categoria dei clienti soccer all'età attuale (Pulcini 7-9 →
 * Esordienti 10-13 → Senior 14+). Fino a ott 2026 la fascia veniva calcolata
 * solo alla creazione del cliente; da allora salvaCampionamento la ricalcola a
 * ogni campionamento, e questo script sistema i clienti già esistenti.
 * Di default in SOLA LETTURA; scrive solo con --apply.
 *
 * L'output riporta solo id e fasce, nessun nome.
 *
 * Uso: node scripts/sync-fasce-soccer.mjs <service-account.json> [--apply]
 */

import { readFileSync } from 'fs'
import admin            from 'firebase-admin'
import { resolveCategoria } from '../functions/src/shared/soccer.js'

const saPath = process.argv[2]
const APPLY  = process.argv.includes('--apply')
if (!saPath) {
  console.error('Uso: node scripts/sync-fasce-soccer.mjs <service-account.json> [--apply]')
  process.exit(1)
}

const saJson = JSON.parse(readFileSync(saPath, 'utf-8'))
admin.initializeApp({ credential: admin.credential.cert(saJson) })
const db = admin.firestore()

async function main() {
  console.log(`🔑  Progetto: ${saJson.project_id}   modalità: ${APPLY ? 'APPLY (scrive)' : 'dry-run (sola lettura)'}`)
  let soccer = 0
  const changes = []

  for (const orgDoc of (await db.collection('organizations').get()).docs) {
    for (const clientDoc of (await db.collection(`organizations/${orgDoc.id}/clients`).get()).docs) {
      const c = clientDoc.data()
      if (!c.categoria?.startsWith('soccer')) continue
      soccer++
      const expected = resolveCategoria(c)
      if (expected === c.categoria) continue
      changes.push(`${orgDoc.id}/${clientDoc.id}: ${c.categoria} → ${expected}`)
      if (APPLY) await clientDoc.ref.update({ categoria: expected })
    }
  }

  console.log(`\n📊  Clienti soccer: ${soccer} · fascia da aggiornare: ${changes.length}`)
  changes.forEach(c => console.log(`   - ${c}`))
  console.log(APPLY ? `\n✅  Aggiornati: ${changes.length}` : '\nℹ️   Dry-run: nessuna scrittura. Rilanciare con --apply.')
}

main().catch(err => { console.error(err); process.exit(1) })
