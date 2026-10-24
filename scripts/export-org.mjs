/**
 * export-org.mjs
 *
 * Esporta tutti i dati di un'organizzazione, per consegnarli all'org a fine
 * contratto o su sua richiesta (DPA, sezione 7). SOLA LETTURA: non modifica nulla.
 *
 * Produce in <cartella-output>/<orgId>-<data>/:
 *   - completo.json      tutto l'albero organizations/{orgId} (ogni subcollection,
 *                        a ogni profondità) + profili /users e email degli account
 *   - clienti.csv        una riga per cliente: anagrafica, rank, livello, ultime stat
 *   - campionamenti.csv  una riga per campionamento (valori dei test e percentili)
 *   - bia.csv            una riga per misurazione BIA
 *   - staff.csv          membri dello staff con ruolo ed email
 * I CSV usano ";" come separatore (Excel in italiano li apre direttamente).
 *
 * I file contengono dati personali: la cartella exports/ è esclusa da git.
 * Da consegnare all'org con un canale protetto e poi cancellare.
 *
 * Uso: node scripts/export-org.mjs <service-account.json> <orgId> [cartella-output]
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join }                                   from 'path'
import admin                                      from 'firebase-admin'

const [saPath, orgId, outRoot = 'exports'] = process.argv.slice(2)
if (!saPath || !orgId) {
  console.error('Uso: node scripts/export-org.mjs <service-account.json> <orgId> [cartella-output]')
  process.exit(1)
}

const saJson = JSON.parse(readFileSync(saPath, 'utf-8'))
admin.initializeApp({ credential: admin.credential.cert(saJson) })
const db = admin.firestore()

// Campi tecnici che non sono dati dell'interessato e non vanno consegnati
const OMIT_FIELDS = ['fcmTokens', 'accessToken']

async function main() {
  const orgRef  = db.doc(`organizations/${orgId}`)
  const orgSnap = await orgRef.get()
  if (!orgSnap.exists) {
    console.error(`Organizzazione ${orgId} non trovata in ${saJson.project_id}`)
    process.exit(1)
  }

  const tree      = await exportDoc(orgSnap)
  const usersSnap = await db.collection('users').where('orgId', '==', orgId).get()
  const users     = Object.fromEntries(usersSnap.docs.map(d => [d.id, clean(d.data())]))
  const emails    = await authEmails(Object.keys(users))

  const date   = new Date().toISOString().slice(0, 10)
  const outDir = join(outRoot, `${orgId}-${date}`)
  mkdirSync(outDir, { recursive: true })

  writeFileSync(join(outDir, 'completo.json'), JSON.stringify({
    esportatoIl:    new Date().toISOString(),
    progetto:       saJson.project_id,
    organizzazione: tree,
    utenti:         users,
    emailAccount:   emails,
  }, null, 2))

  const clients = Object.entries(tree.collections.clients ?? {})
  const members = Object.entries(tree.collections.members ?? {})

  writeCsv(join(outDir, 'clienti.csv'), clients.map(([id, c]) => ({
    id,
    email: emails[c.fields.clientAuthUid] ?? '',
    ...omit(c.fields, ['campionamenti', 'biaHistory', 'log', 'misureHistory', 'badges', 'wearable']),
  })))
  writeCsv(join(outDir, 'campionamenti.csv'), clients.flatMap(([id, c]) =>
    (c.fields.campionamenti ?? []).map(camp => ({ clienteId: id, nome: c.fields.name, ...camp })),
  ))
  writeCsv(join(outDir, 'bia.csv'), clients.flatMap(([id, c]) =>
    (c.fields.biaHistory ?? []).map(bia => ({ clienteId: id, nome: c.fields.name, ...bia })),
  ))
  writeCsv(join(outDir, 'staff.csv'), members.map(([uid, m]) => ({
    uid, email: emails[uid] ?? m.fields.email ?? '', ...m.fields,
  })))

  console.log(`🔑  Progetto: ${saJson.project_id}`)
  console.log(`📦  Esportati: ${clients.length} clienti, ${members.length} membri staff, ${Object.keys(users).length} profili utente`)
  console.log(`📁  Cartella: ${outDir}`)
  console.log('⚠️   Contiene dati personali: consegnare con un canale protetto, poi cancellare la cartella.')
}

/** Documento + tutte le sue subcollection, ricorsivamente */
async function exportDoc(snap) {
  const node = { id: snap.id, fields: clean(snap.data()), collections: {} }
  for (const col of await snap.ref.listCollections()) {
    node.collections[col.id] = {}
    for (const child of (await col.get()).docs) {
      node.collections[col.id][child.id] = await exportDoc(child)
    }
  }
  return node
}

async function authEmails(uids) {
  const out = {}
  for (let i = 0; i < uids.length; i += 100) {
    const { users } = await admin.auth().getUsers(uids.slice(i, i + 100).map(uid => ({ uid })))
    for (const u of users) out[u.uid] = u.email ?? ''
  }
  return out
}

/** Timestamp → ISO; toglie i campi tecnici (token push, eventuale token wearable legacy) */
function clean(value) {
  if (value instanceof admin.firestore.Timestamp) return value.toDate().toISOString()
  if (Array.isArray(value)) return value.map(clean)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      if (!OMIT_FIELDS.includes(k)) out[k] = clean(v)
    }
    return out
  }
  return value
}

const omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)))

/** Oggetti annidati → colonne "stats.forza"; array → JSON nella cella */
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out)
    else out[key] = Array.isArray(v) ? JSON.stringify(v) : v
  }
  return out
}

function writeCsv(path, rows) {
  const flat    = rows.map(r => flatten(r))
  const headers = [...new Set(flat.flatMap(r => Object.keys(r)))]
  const cell    = v => {
    const s = v == null ? '' : String(v)
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(';'), ...flat.map(r => headers.map(h => cell(r[h])).join(';'))]
  // BOM: così Excel legge l'UTF-8 (accenti nei nomi)
  writeFileSync(path, '﻿' + lines.join('\n'))
}

main().catch(err => { console.error(err); process.exit(1) })
