/**
 * Migrazione dataNascita — RankEX
 *
 * Per ogni client in tutte le organizzazioni:
 *   - Ha già dataNascita + eta → rimuove solo eta
 *   - Ha eta ma non dataNascita → stima dataNascita = (annoCorrente - eta)-07-01
 *     + flag dataNascitaEstimata: true, poi rimuove eta
 *   - Non ha nessuno dei due → avviso, nessuna scrittura
 *
 * Utilizzo:
 *   node scripts/migrate-dataNascita.mjs <email> <password> [--prod] [--dry-run]
 *
 * Flag:
 *   --prod     usa .env.production (default: .env.development)
 *   --dry-run  simula senza scrivere su Firestore
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  writeBatch,
  deleteField,
} from 'firebase/firestore'

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
  console.error('Utilizzo: node scripts/migrate-dataNascita.mjs <email> <password> [--prod] [--dry-run]')
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

// ── Stima dataNascita da eta ──────────────────────────────────────────────────
// Anno = annoCorrente - eta, giorno = 1 luglio (mezza-anno, errore medio ±6 mesi).

function stimaDataNascita(eta) {
  const anno = new Date().getFullYear() - eta
  return `${anno}-07-01`
}

// ── Commit batch con flush ogni 499 operazioni ─────────────────────────────────

async function flushBatch(batch, count) {
  if (!dryRun && count > 0) await batch.commit()
  return writeBatch(db)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔧  Migrazione dataNascita`)
  console.log(`    Progetto : ${env.VITE_FIREBASE_PROJECT_ID}`)
  console.log(`    Env file : ${envFile}`)
  console.log(`    Modalità : ${dryRun ? 'DRY-RUN (nessuna scrittura)' : 'LIVE'}`)
  console.log()

  // Auth
  console.log(`🔑  Login come ${email}…`)
  await signInWithEmailAndPassword(auth, email, pass)
  console.log(`    ✓ autenticato\n`)

  // Leggi tutte le organizzazioni
  const orgsSnap = await getDocs(collection(db, 'organizations'))
  console.log(`📦  Trovate ${orgsSnap.size} organizzazioni\n`)

  const stats = {
    orgs:       orgsSnap.size,
    clients:    0,
    stimati:    0,   // eta → dataNascita stimata
    soloEta:    0,   // già aveva dataNascita, rimosso solo eta
    saltati:    0,   // già ok (nessun eta)
    senzaDati:  0,   // né eta né dataNascita → warning
    scritture:  0,
  }

  let batch      = writeBatch(db)
  let batchCount = 0

  for (const orgDoc of orgsSnap.docs) {
    const orgId    = orgDoc.id
    const orgName  = orgDoc.data().name ?? orgId
    const clientsSnap = await getDocs(collection(db, 'organizations', orgId, 'clients'))

    if (clientsSnap.empty) continue

    console.log(`  Org: ${orgName} (${orgId}) — ${clientsSnap.size} clienti`)

    for (const clientDoc of clientsSnap.docs) {
      stats.clients++
      const data      = clientDoc.data()
      const hasEta    = data.eta != null
      const hasDN     = !!data.dataNascita
      const clientRef = doc(db, 'organizations', orgId, 'clients', clientDoc.id)

      // Già migrato e pulito → niente da fare
      if (!hasEta && hasDN) {
        stats.saltati++
        continue
      }

      // Nessun dato disponibile → warning
      if (!hasEta && !hasDN) {
        stats.senzaDati++
        console.warn(`    ⚠  ${data.name ?? clientDoc.id} — nessun dato età (eta né dataNascita)`)
        continue
      }

      const update = {}

      if (!hasDN) {
        // Stima dataNascita da eta
        update.dataNascita         = stimaDataNascita(data.eta)
        update.dataNascitaEstimata = true
        stats.stimati++
        console.log(`    ✦  ${data.name ?? clientDoc.id} — eta ${data.eta} → ${update.dataNascita} (stimata)`)
      } else {
        // Ha già dataNascita, rimuove solo eta
        stats.soloEta++
        console.log(`    ✓  ${data.name ?? clientDoc.id} — dataNascita già presente, rimosso eta`)
      }

      // Rimuovi sempre eta
      update.eta = deleteField()

      if (!dryRun) {
        batch.update(clientRef, update)
        batchCount++
        stats.scritture++

        // Flush ogni 499 operazioni (limite Firestore: 500)
        if (batchCount >= 499) {
          await batch.commit()
          batch      = writeBatch(db)
          batchCount = 0
        }
      } else {
        stats.scritture++
      }
    }
  }

  // Flush finale
  if (!dryRun && batchCount > 0) {
    await batch.commit()
  }

  // Report
  console.log()
  console.log('─'.repeat(50))
  console.log('📊  Report migrazione')
  console.log(`    Organizzazioni : ${stats.orgs}`)
  console.log(`    Clienti totali : ${stats.clients}`)
  console.log(`    Già migrati    : ${stats.saltati}`)
  console.log(`    Stimati        : ${stats.stimati}  ← verificare dataNascita`)
  console.log(`    Solo eta rimosso: ${stats.soloEta}`)
  console.log(`    Senza dati     : ${stats.senzaDati}  ← intervento manuale`)
  console.log(`    Scritture${dryRun ? ' (sim)' : ''}   : ${stats.scritture}`)
  console.log('─'.repeat(50))

  if (stats.stimati > 0) {
    console.log()
    console.log(`⚠   ${stats.stimati} client hanno dataNascita stimata (flag dataNascitaEstimata: true).`)
    console.log(`    Il trainer deve verificare e correggere la data di nascita reale.`)
  }

  if (dryRun) {
    console.log()
    console.log('🔵  DRY-RUN completato — nessuna scrittura effettuata.')
    console.log('    Rilancia senza --dry-run per applicare le modifiche.')
  } else {
    console.log()
    console.log('✅  Migrazione completata.')
  }
}

main().catch(err => {
  console.error('\n❌  Errore:', err.message)
  process.exit(1)
})
