/**
 * check-wearable-tokens.mjs
 *
 * Diagnostica di SOLA LETTURA (nessuna scrittura, nessuna modifica) — verifica se
 * esistono client con un wearable.accessToken già salvato da collegamenti Google Fit
 * precedenti alla rimozione della feature (RX-62/RX-63, audit round 4).
 *
 * Usa firebase-admin con service account — stesso pattern di
 * recalcolo-campionamenti.mjs — invece della REST API pubblica: funziona anche sui
 * progetti con API key ristretta per HTTP referrer (es. prod), che bloccano le
 * chiamate REST dirette da uno script in locale.
 *
 * Prerequisiti: un file service-account.json scaricato da Firebase Console →
 * Project Settings → Service Accounts → Generate new private key, per il progetto
 * che si vuole controllare (rankex-dev o fitquest-60a09). Il pattern
 * service-account*.json è già in .gitignore — non committarlo mai.
 *
 * Uso: node scripts/check-wearable-tokens.mjs <service-account.json>
 */

import { readFileSync } from 'fs'
import admin            from 'firebase-admin'

const saPath = process.argv[2]
if (!saPath) {
  console.error('Uso: node scripts/check-wearable-tokens.mjs <service-account.json>')
  process.exit(1)
}

const saJson = JSON.parse(readFileSync(saPath, 'utf-8'))
admin.initializeApp({ credential: admin.credential.cert(saJson) })
const db = admin.firestore()

function docId(doc) {
  return doc.id
}

async function main() {
  console.log(`🔑  Progetto: ${saJson.project_id}`)
  console.log('📂  Lettura organizzazioni…')

  const orgsSnap = await db.collection('organizations').get()
  console.log(`   trovate ${orgsSnap.size} org`)

  let totalClients = 0
  const hits = []

  for (const orgDoc of orgsSnap.docs) {
    const orgId   = docId(orgDoc)
    const orgName = orgDoc.data().name ?? orgId
    const clientsSnap = await db.collection(`organizations/${orgId}/clients`).get()
    totalClients += clientsSnap.size

    for (const clientDoc of clientsSnap.docs) {
      const wearable = clientDoc.data().wearable
      const token    = wearable?.accessToken
      if (token) {
        hits.push({
          orgId, orgName,
          clientId:   docId(clientDoc),
          clientName: clientDoc.data().name ?? '(senza nome)',
          linkedAt:   wearable.linkedAt ?? '—',
          lastSync:   wearable.lastSync ?? '—',
        })
      }
    }
  }

  console.log(`\n📊  ${totalClients} client totali su ${orgsSnap.size} org — controllati per wearable.accessToken\n`)

  if (hits.length === 0) {
    console.log('✅  Nessun accessToken trovato — nessun dato legacy da ripulire su questo progetto.')
  } else {
    console.log(`⚠️  ${hits.length} client con accessToken ancora salvato:\n`)
    hits.forEach(h => {
      console.log(`  - org "${h.orgName}" (${h.orgId}) · client "${h.clientName}" (${h.clientId})`)
      console.log(`    collegato: ${h.linkedAt} · ultima sync: ${h.lastSync}`)
    })
  }
}

main().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})
