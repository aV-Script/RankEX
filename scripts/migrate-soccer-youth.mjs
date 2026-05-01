/**
 * Migrazione fasce soccer — RankEX
 *
 * I client soccer_youth campionati prima dell'introduzione delle 3 fasce
 * hanno statistiche basate sui vecchi test Senior (y_balance, 505_cod_agility,
 * beep_test, sprint_20m, standing_long_jump). Questi test non fanno più parte
 * del protocollo Pulcini, quindi i campionamenti esistenti vengono eliminati.
 *
 * Questo script:
 *   1. Trova tutti i client con categoria === 'soccer_youth'
 *   2. Se hanno campionamenti legacy, azzera stats, campionamenti e media
 *
 * Utilizzo:
 *   node scripts/migrate-soccer-youth.mjs <email> <password> [--prod] [--dry-run]
 *
 * Flag:
 *   --prod     usa .env.production (default: .env.development)
 *   --dry-run  simula senza scrivere su Firestore
 */

import { readFileSync }                           from 'fs'
import { resolve, dirname }                       from 'path'
import { fileURLToPath }                          from 'url'
import { initializeApp }                          from 'firebase/app'
import { getAuth, signInWithEmailAndPassword }    from 'firebase/auth'
import { getFirestore, collection, getDocs,
         doc, writeBatch }                        from 'firebase/firestore'

// ── Resolve root ──────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = resolve(__dirname, '..')

// ── Args ──────────────────────────────────────────────────────────────────────

const args   = process.argv.slice(2)
const email  = args.find(a => !a.startsWith('--'))
const pass   = args.filter(a => !a.startsWith('--'))[1]
const isProd = args.includes('--prod')
const dryRun = args.includes('--dry-run')

if (!email || !pass) {
  console.error('Utilizzo: node scripts/migrate-soccer-youth.mjs <email> <password> [--prod] [--dry-run]')
  process.exit(1)
}

// ── Firebase config ───────────────────────────────────────────────────────────

function parseEnvFile(filePath) {
  const text = readFileSync(filePath, 'utf8')
  const env  = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return env
}

const envFile = isProd ? '.env.production' : '.env.development'
const env     = parseEnvFile(resolve(ROOT, envFile))

const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
}

// ── Init ──────────────────────────────────────────────────────────────────────

const app  = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db   = getFirestore(app)

// ── Identifica campionamenti legacy (test Senior, non Pulcini) ────────────────
// I vecchi test soccer usavano 'stabilita' (da y_balance).
// I nuovi test Pulcini usano 'equilibrio'. Se ha 'stabilita' ma non 'equilibrio'
// il campionamento è stato fatto con i vecchi test Senior.
function hasLegacyStats(campionamento) {
  const s = campionamento?.stats ?? {}
  return ('stabilita' in s) && !('equilibrio' in s)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔧  Migrazione fasce soccer — Pulcini (soccer_youth)')
  console.log(`    Progetto : ${env.VITE_FIREBASE_PROJECT_ID}`)
  console.log(`    Env file : ${envFile}`)
  console.log(`    Modalità : ${dryRun ? 'DRY-RUN (nessuna scrittura)' : 'LIVE'}`)
  console.log()

  console.log(`🔑  Login come ${email}…`)
  await signInWithEmailAndPassword(auth, email, pass)
  console.log('    ✓ autenticato\n')

  const orgsSnap = await getDocs(collection(db, 'organizations'))
  console.log(`📦  Trovate ${orgsSnap.size} organizzazioni\n`)

  const stats = {
    orgs: orgsSnap.size,
    clientiYouth: 0,
    migrati: 0, saltati: 0, giaOk: 0,
    campionamentiEliminati: 0,
  }

  let batch      = writeBatch(db)
  let batchCount = 0

  for (const orgDoc of orgsSnap.docs) {
    const orgId     = orgDoc.id
    const orgName   = orgDoc.data().name ?? orgId
    const orgModule = orgDoc.data().moduleType

    if (orgModule !== 'soccer_academy') continue

    const clientsSnap = await getDocs(collection(db, 'organizations', orgId, 'clients'))
    if (clientsSnap.empty) continue

    console.log(`  Org: ${orgName} (${orgId}) — ${clientsSnap.size} clienti`)

    for (const clientDoc of clientsSnap.docs) {
      const data      = clientDoc.data()
      if (data.categoria !== 'soccer_youth') { stats.saltati++; continue }

      stats.clientiYouth++
      const campionamenti = data.campionamenti ?? []

      if (campionamenti.length === 0) {
        stats.giaOk++
        console.log(`    ○  ${data.name ?? clientDoc.id} — nessun campionamento (ok)`)
        continue
      }

      const legacy = campionamenti.filter(hasLegacyStats)
      if (legacy.length === 0) {
        stats.giaOk++
        console.log(`    ○  ${data.name ?? clientDoc.id} — ${campionamenti.length} camp. già con nuovi test (ok)`)
        continue
      }

      console.log(`    ✓  ${data.name ?? clientDoc.id} — elimino ${legacy.length}/${campionamenti.length} campionamento/i`)
      stats.migrati++
      stats.campionamentiEliminati += legacy.length

      if (!dryRun) {
        const nuoviCamp = campionamenti.filter(c => !hasLegacyStats(c))
        batch.update(doc(db, 'organizations', orgId, 'clients', clientDoc.id), {
          stats:         {},
          campionamenti: nuoviCamp,
          media:         0,
        })
        batchCount++

        if (batchCount >= 499) {
          await batch.commit()
          batch      = writeBatch(db)
          batchCount = 0
        }
      }
    }
  }

  if (!dryRun && batchCount > 0) await batch.commit()

  console.log()
  console.log('─'.repeat(50))
  console.log('📊  Report')
  console.log(`    Organizzazioni           : ${stats.orgs}`)
  console.log(`    Client soccer_youth      : ${stats.clientiYouth}`)
  console.log(`    Migrati (stats azzerati) : ${stats.migrati}`)
  console.log(`    Campionamenti eliminati  : ${stats.campionamentiEliminati}`)
  console.log(`    Già ok / senza dati      : ${stats.giaOk}`)
  console.log(`    Saltati (altra categoria): ${stats.saltati}`)
  console.log('─'.repeat(50))

  if (dryRun) {
    console.log('\n🔵  DRY-RUN completato — nessuna scrittura effettuata.')
    console.log('    Rilancia senza --dry-run per applicare le modifiche.')
  } else {
    console.log('\n✅  Migrazione completata.')
  }
}

main().catch(err => {
  console.error('\n❌  Errore:', err.message)
  process.exit(1)
})
