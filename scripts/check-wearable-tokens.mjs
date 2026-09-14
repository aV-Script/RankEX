/**
 * check-wearable-tokens.mjs
 *
 * Diagnostica di SOLA LETTURA (nessuna scrittura, nessuna modifica) — verifica se
 * esistono client con un wearable.accessToken già salvato da collegamenti Google Fit
 * precedenti alla rimozione della feature (RX-62/RX-63, audit round 4).
 *
 * Usa solo Firebase Auth REST API + Firestore REST API (no SDK, no service account) —
 * stesso pattern di seed-test-accounts.mjs.
 *
 * Prerequisiti: .env.development (config progetto) + .env.test (credenziali super_admin)
 *
 * Uso: node scripts/check-wearable-tokens.mjs
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

function loadEnv(file) {
  const path    = join(__dir, '..', file)
  const content = readFileSync(path, 'utf8')
  const env     = {}
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim()
  }
  return env
}

const devEnv  = loadEnv('.env.development')
const testEnv = loadEnv('.env.test')

const API_KEY = devEnv.VITE_FIREBASE_API_KEY
const PROJECT = devEnv.VITE_FIREBASE_PROJECT_ID
const ADMIN_EMAIL = testEnv.E2E_SUPERADMIN_EMAIL
const ADMIN_PWD   = testEnv.E2E_SUPERADMIN_PASSWORD

if (!API_KEY || !PROJECT || !ADMIN_EMAIL || !ADMIN_PWD) {
  console.error('❌  Config o credenziali mancanti in .env.development / .env.test')
  process.exit(1)
}

const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1'
const FS_BASE   = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`

async function signIn(email, password) {
  const r = await fetch(`${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password, returnSecureToken: true }),
  })
  if (!r.ok) {
    const e = await r.json()
    throw new Error(`signIn fallito: ${e.error?.message}`)
  }
  return r.json()
}

async function fsList(path, idToken) {
  const out = []
  let pageToken = null
  do {
    const url = new URL(`${FS_BASE}/${path}`)
    url.searchParams.set('pageSize', '300')
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    const r = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } })
    if (!r.ok) {
      const e = await r.json().catch(() => ({}))
      console.warn(`  ⚠️  Lettura fallita su ${path}: ${e.error?.message ?? r.status}`)
      return out
    }
    const data = await r.json()
    out.push(...(data.documents ?? []))
    pageToken = data.nextPageToken ?? null
  } while (pageToken)
  return out
}

function docId(doc) {
  return doc.name.split('/').pop()
}

async function main() {
  console.log(`🔑  Login super_admin su ${PROJECT}…`)
  const { idToken } = await signIn(ADMIN_EMAIL, ADMIN_PWD)

  console.log('📂  Lettura organizzazioni…')
  const orgs = await fsList('organizations', idToken)
  console.log(`   trovate ${orgs.length} org`)

  let totalClients = 0
  const hits = []

  for (const org of orgs) {
    const orgId   = docId(org)
    const orgName = org.fields?.name?.stringValue ?? orgId
    const clients = await fsList(`organizations/${orgId}/clients`, idToken)
    totalClients += clients.length

    for (const client of clients) {
      const wearable = client.fields?.wearable?.mapValue?.fields
      const token    = wearable?.accessToken?.stringValue
      if (token) {
        hits.push({
          orgId, orgName,
          clientId:  docId(client),
          clientName: client.fields?.name?.stringValue ?? '(senza nome)',
          linkedAt:  wearable?.linkedAt?.timestampValue ?? '—',
          lastSync:  wearable?.lastSync?.timestampValue ?? '—',
        })
      }
    }
  }

  console.log(`\n📊  ${totalClients} client totali su ${orgs.length} org — controllati per wearable.accessToken\n`)

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
