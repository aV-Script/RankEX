/**
 * repair-data-week2.mjs
 *
 * Verifica (e, con --apply, ripara) i dati scritti dai bug corretti nella
 * settimana 2 dell'audit (ott 2026). Di default è in SOLA LETTURA.
 *
 * Controlli:
 *   1. Campionamento fantasma — buildNewClient salvava un campionamento con
 *      stats {} alla creazione del cliente.            → --apply lo rimuove.
 *      Gli XP già assegnati (+50) non vengono toccati.
 *   2. rankColor E+/E — il server salvava i rossi di errore (#f87171/#ef4444)
 *      tolti lato client.                              → --apply li allinea.
 *   3. sessionCount — nuovo campo per i trofei di sessione. Valore calcolato
 *      dagli slot chiusi in cui il cliente è tra i presenti (fonte completa,
 *      a differenza del log troncato a 200 voci).      → --apply lo scrive.
 *   4. Esplosività corrotta da recalcolaCampionamenti — per Health (sit_to_stand)
 *      e Athlete (cmj) ricalcola il percentile dell'ultimo campionamento con il
 *      test giusto e segnala le differenze. SOLO REPORT: il ripristino va deciso
 *      a mano, perché il valore salvato potrebbe essere legittimo.
 *
 * L'output riporta solo id (org/cliente) e conteggi, nessun nome.
 *
 * Prerequisiti: service-account.json del progetto (Firebase Console → Project
 * Settings → Service Accounts). Il pattern service-account*.json è in .gitignore.
 *
 * Uso: node scripts/repair-data-week2.mjs <service-account.json> [--apply]
 */

import { readFileSync } from 'fs'
import admin            from 'firebase-admin'
import { RANKS }        from '../functions/src/shared/constants.js'
import { calcAge, calcPercentileEx } from '../functions/src/shared/percentile.js'

const saPath = process.argv[2]
const APPLY  = process.argv.includes('--apply')
if (!saPath) {
  console.error('Uso: node scripts/repair-data-week2.mjs <service-account.json> [--apply]')
  process.exit(1)
}

const saJson = JSON.parse(readFileSync(saPath, 'utf-8'))
admin.initializeApp({ credential: admin.credential.cert(saJson) })
const db = admin.firestore()

const OLD_RANK_COLORS = { 'E+': '#f87171', 'E': '#ef4444' }
const RANK_COLOR      = Object.fromEntries(RANKS.map(r => [r.label, r.color]))
// Test che misura 'esplosivita' per categoria (constants/tests.js)
const ESPLOSIVITA_TEST = { health: 'sit_to_stand', athlete: 'cmj' }

const isPhantom = camp => !camp?.stats || Object.keys(camp.stats).length === 0

async function main() {
  console.log(`🔑  Progetto: ${saJson.project_id}   modalità: ${APPLY ? 'APPLY (scrive)' : 'dry-run (sola lettura)'}`)

  const totals = { clients: 0, phantom: 0, rankColor: 0, sessionCount: 0, esplosivita: 0, written: 0 }
  const esplosivitaHits = []

  const orgsSnap = await db.collection('organizations').get()
  for (const orgDoc of orgsSnap.docs) {
    const orgId = orgDoc.id

    // Presenze per cliente dagli slot chiusi
    const slotsSnap = await db.collection(`organizations/${orgId}/slots`).where('status', '==', 'completed').get()
    const attended  = {}
    slotsSnap.docs.forEach(s => (s.data().attendees ?? []).forEach(id => { attended[id] = (attended[id] ?? 0) + 1 }))

    const clientsSnap = await db.collection(`organizations/${orgId}/clients`).get()
    for (const clientDoc of clientsSnap.docs) {
      totals.clients++
      const c     = clientDoc.data()
      const patch = {}

      // 1. Campionamento fantasma
      const camps = c.campionamenti ?? []
      if (camps.some(isPhantom)) {
        totals.phantom++
        patch.campionamenti = camps.filter(camp => !isPhantom(camp))
      }

      // 2. rankColor E+/E
      if (OLD_RANK_COLORS[c.rank] && c.rankColor === OLD_RANK_COLORS[c.rank]) {
        totals.rankColor++
        patch.rankColor = RANK_COLOR[c.rank]
      }

      // 3. sessionCount
      const sessions = attended[clientDoc.id] ?? 0
      if ((c.sessionCount ?? null) !== sessions) {
        totals.sessionCount++
        patch.sessionCount = sessions
      }

      // 4. Esplosività (solo report)
      const testKey = ESPLOSIVITA_TEST[c.categoria]
      const latest  = camps.find(camp => !isPhantom(camp))
      const raw     = latest?.tests?.esplosivita
      const stored  = latest?.stats?.esplosivita
      if (testKey && raw !== undefined && raw !== '' && typeof stored === 'number') {
        const age      = calcAge(c.dataNascita) ?? c.eta
        const expected = age ? calcPercentileEx('esplosivita', Number(raw), c.sesso ?? 'M', age, testKey).value : null
        if (expected !== null && Math.abs(expected - stored) > 1) {
          totals.esplosivita++
          esplosivitaHits.push(`${orgId}/${clientDoc.id} (${c.categoria}): salvato ${stored}, atteso ${expected}`)
        }
      }

      if (APPLY && Object.keys(patch).length > 0) {
        await clientDoc.ref.update(patch)
        totals.written++
      }
    }
  }

  console.log(`\n📊  Clienti controllati: ${totals.clients}`)
  console.log(`   1. campionamento fantasma: ${totals.phantom}`)
  console.log(`   2. rankColor E+/E vecchio: ${totals.rankColor}`)
  console.log(`   3. sessionCount da allineare: ${totals.sessionCount}`)
  console.log(`   4. esplosività diversa dal ricalcolo corretto (solo report): ${totals.esplosivita}`)
  esplosivitaHits.forEach(h => console.log(`      - ${h}`))
  console.log(APPLY ? `\n✅  Documenti aggiornati: ${totals.written}` : '\nℹ️   Dry-run: nessuna scrittura. Rilanciare con --apply per riparare 1-3.')
}

main().catch(err => { console.error(err); process.exit(1) })
