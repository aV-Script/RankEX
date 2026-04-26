/**
 * Seed script — Soccer Academy Demo
 *
 * Crea un'associazione mock con:
 *   - 1 organizzazione soccer_academy (piano pro)
 *   - 2 membri (org_admin + trainer) — solo documenti Firestore, no Auth reale
 *   - 24 giocatori (2 GK · 8 DEF · 8 MID · 6 FWD)
 *   - 10 campionamenti mensili per giocatore (ultimi 10 mesi)
 *
 * Utilizzo:
 *   node scripts/seed-soccer.mjs <email> <password> [orgId]
 *
 *   email/password: credenziali di un account super_admin nel progetto dev
 *   orgId: opzionale — di default genera "soccer-demo-<timestamp>"
 *
 * Esempio:
 *   node scripts/seed-soccer.mjs admin@rankex.dev password123
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  doc,
  writeBatch,
} from 'firebase/firestore'

// ── Resolve project root ──────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = resolve(__dirname, '..')

// ── Parse .env.development ────────────────────────────────────────────────────

function parseEnvFile(filePath) {
  const text = readFileSync(filePath, 'utf8')
  const env  = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    env[key] = val
  }
  return env
}

const env = parseEnvFile(resolve(ROOT, '.env.development'))

const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
}

// ── Init Firebase ─────────────────────────────────────────────────────────────

const app  = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db   = getFirestore(app)

// ── Stat keys soccer ──────────────────────────────────────────────────────────

const SOCCER_STATS = ['stabilita', 'esplosivita', 'agilita', 'velocita', 'resistenza']

// ── Profili medi per ruolo (percentili finali) ────────────────────────────────

const ROLE_PROFILES = {
  goalkeeper: { stabilita: 83, esplosivita: 63, agilita: 67, velocita: 57, resistenza: 64 },
  defender:   { stabilita: 72, esplosivita: 65, agilita: 72, velocita: 63, resistenza: 67 },
  midfielder: { stabilita: 65, esplosivita: 65, agilita: 73, velocita: 67, resistenza: 80 },
  forward:    { stabilita: 60, esplosivita: 79, agilita: 68, velocita: 82, resistenza: 64 },
}

// ── Roster (24 giocatori) ─────────────────────────────────────────────────────
// v: offset ±8 applicato uniformemente a tutte le stat del profilo ruolo

const PLAYERS = [
  // 2 portieri
  { name: 'Luca Ferretti',     eta: 22, peso: 82, altezza: 188, ruolo: 'goalkeeper', v:  5 },
  { name: 'Marco Conti',       eta: 25, peso: 85, altezza: 190, ruolo: 'goalkeeper', v: -4 },
  // 8 difensori
  { name: 'Alessandro Rossi',  eta: 24, peso: 78, altezza: 181, ruolo: 'defender',   v:  6 },
  { name: 'Matteo Bruno',      eta: 21, peso: 75, altezza: 178, ruolo: 'defender',   v: -3 },
  { name: 'Simone Ricci',      eta: 26, peso: 80, altezza: 183, ruolo: 'defender',   v:  8 },
  { name: 'Davide Greco',      eta: 23, peso: 77, altezza: 179, ruolo: 'defender',   v: -7 },
  { name: 'Federico Gallo',    eta: 20, peso: 72, altezza: 177, ruolo: 'defender',   v:  4 },
  { name: 'Andrea Moretti',    eta: 28, peso: 81, altezza: 182, ruolo: 'defender',   v: -2 },
  { name: 'Giovanni Neri',     eta: 19, peso: 70, altezza: 176, ruolo: 'defender',   v:  7 },
  { name: 'Stefano Bianchi',   eta: 25, peso: 79, altezza: 180, ruolo: 'defender',   v: -5 },
  // 8 centrocampisti
  { name: 'Lorenzo Costa',     eta: 22, peso: 73, altezza: 175, ruolo: 'midfielder', v:  5 },
  { name: 'Riccardo Marini',   eta: 24, peso: 76, altezza: 178, ruolo: 'midfielder', v: -4 },
  { name: 'Nicolò Ferrari',    eta: 21, peso: 71, altezza: 174, ruolo: 'midfielder', v:  7 },
  { name: 'Cristiano Leone',   eta: 26, peso: 79, altezza: 180, ruolo: 'midfielder', v: -6 },
  { name: 'Emanuele Russo',    eta: 23, peso: 74, altezza: 176, ruolo: 'midfielder', v:  8 },
  { name: 'Filippo Riva',      eta: 20, peso: 70, altezza: 172, ruolo: 'midfielder', v: -3 },
  { name: 'Roberto Fontana',   eta: 27, peso: 77, altezza: 179, ruolo: 'midfielder', v:  4 },
  { name: 'Diego Serra',       eta: 22, peso: 72, altezza: 174, ruolo: 'midfielder', v: -7 },
  // 6 attaccanti
  { name: 'Antonio Esposito',  eta: 23, peso: 74, altezza: 178, ruolo: 'forward',    v:  7 },
  { name: 'Francesco Poli',    eta: 25, peso: 76, altezza: 180, ruolo: 'forward',    v: -5 },
  { name: 'Gabriele Caruso',   eta: 21, peso: 71, altezza: 176, ruolo: 'forward',    v:  8 },
  { name: "Michele D'Angelo",  eta: 24, peso: 75, altezza: 179, ruolo: 'forward',    v: -4 },
  { name: 'Daniele Ferri',     eta: 22, peso: 73, altezza: 177, ruolo: 'forward',    v:  6 },
  { name: 'Enrico Mancini',    eta: 20, peso: 69, altezza: 174, ruolo: 'forward',    v: -8 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(val, min = 10, max = 98) {
  return Math.round(Math.max(min, Math.min(max, val)))
}

function rand(min, max) {
  return Math.random() * (max - min) + min
}

function getRank(media) {
  const RANKS = [
    { min: 95, label: 'EX',  color: '#ffd700' },
    { min: 90, label: 'SS+', color: '#ff4560' },
    { min: 85, label: 'SS',  color: '#ff7043' },
    { min: 80, label: 'S+',  color: '#1aff6e' },
    { min: 75, label: 'S',   color: '#0fd65a' },
    { min: 70, label: 'A+',  color: '#00c8ff' },
    { min: 65, label: 'A',   color: '#4db8ff' },
    { min: 60, label: 'B+',  color: '#38bdf8' },
    { min: 55, label: 'B',   color: '#0066cc' },
    { min: 50, label: 'C+',  color: '#a3e635' },
    { min: 45, label: 'C',   color: '#facc15' },
    { min: 40, label: 'D+',  color: '#fb923c' },
    { min: 35, label: 'D',   color: '#f97316' },
    { min: 30, label: 'E+',  color: '#f87171' },
    { min: 25, label: 'E',   color: '#ef4444' },
    { min: 20, label: 'F+',  color: '#8a9bb0' },
    { min: 0,  label: 'F',   color: '#4a5568' },
  ]
  return RANKS.find(r => media >= r.min) ?? RANKS[RANKS.length - 1]
}

function calcLevelProgression(totalXP) {
  let xp = totalXP, xpNext = 500, level = 1
  while (xp >= xpNext) {
    xp -= xpNext
    xpNext = Math.round(xpNext * 1.08)
    level++
  }
  return { xp, xpNext, level }
}

function generateCampionamenti(ruolo, variation) {
  const profile = ROLE_PROFILES[ruolo]

  const targetStats = {}
  SOCCER_STATS.forEach(stat => {
    targetStats[stat] = clamp(profile[stat] + variation)
  })

  const camps = []
  const today = new Date()

  for (let monthAgo = 9; monthAgo >= 0; monthAgo--) {
    const date = new Date(today)
    date.setDate(1)
    date.setMonth(date.getMonth() - monthAgo)
    const dateStr = date.toISOString().slice(0, 10)

    const progress = (9 - monthAgo) / 9
    const stats = {}

    SOCCER_STATS.forEach(stat => {
      const start  = targetStats[stat] * 0.70
      const interp = start + (targetStats[stat] - start) * progress
      stats[stat]  = clamp(interp + rand(-6, 6))
    })

    const media = Math.round(SOCCER_STATS.reduce((s, k) => s + stats[k], 0) / SOCCER_STATS.length)
    camps.push({ date: dateStr, stats, media, tests: {} })
  }

  camps.reverse()

  let campXP = 0
  camps.forEach((camp, idx) => {
    const isFirst = idx === camps.length - 1
    if (isFirst) {
      campXP += 50
    } else {
      const prev     = camps[idx + 1].stats
      const improved = SOCCER_STATS.filter(k => camp.stats[k] > (prev[k] ?? 0)).length
      if (improved >= 4)      campXP += 100
      else if (improved >= 2) campXP += 60
      else if (improved >= 1) campXP += 30
      else                    campXP += 10
    }
  })

  const totalXP = 2000 + campXP
  const { xp, xpNext, level } = calcLevelProgression(totalXP)

  return { camps, xp, xpNext, level }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const [,, email, password, orgIdArg] = process.argv

  if (!email || !password) {
    console.error('Utilizzo: node scripts/seed-soccer.mjs <email> <password> [orgId]')
    process.exit(1)
  }

  const orgId   = orgIdArg ?? `soccer-demo-${Date.now().toString(36)}`
  const orgName = 'ASD Calcio Demo'

  console.log(`Progetto Firebase: ${firebaseConfig.projectId}`)
  console.log(`OrgId: ${orgId}`)
  console.log()

  // ── Login ────────────────────────────────────────────────────────────────────
  console.log(`Login come ${email}...`)
  await signInWithEmailAndPassword(auth, email, password)
  console.log(`Login OK`)
  console.log()

  // ── Batch write ──────────────────────────────────────────────────────────────
  // Firestore batch limit: 500 operazioni. Con 24 clienti × ~1 doc = 24 + 3 = 27 — ok.

  const batch = writeBatch(db)

  // Organizzazione
  const orgRef = doc(db, 'organizations', orgId)
  batch.set(orgRef, {
    name:               orgName,
    moduleType:         'soccer_academy',
    terminologyVariant: 'soccer_academy',
    plan:               'pro',
    ownerId:            'seed-admin-uid',
    status:             'active',
    createdAt:          new Date().toISOString(),
    memberCount:        2,
    clientCount:        PLAYERS.length,
  })

  // Membri (solo Firestore, senza Auth reale)
  const MEMBERS = [
    { uid: 'seed-admin-uid',   role: 'org_admin', name: 'Admin Demo',  email: 'admin@soccer-demo.it' },
    { uid: 'seed-trainer-uid', role: 'trainer',   name: 'Coach Demo',  email: 'coach@soccer-demo.it' },
  ]

  MEMBERS.forEach(m => {
    batch.set(doc(db, `organizations/${orgId}/members`, m.uid), {
      role:     m.role,
      name:     m.name,
      email:    m.email,
      joinedAt: new Date().toISOString(),
    })
  })

  // Clienti
  PLAYERS.forEach(player => {
    const { camps, xp, xpNext, level } = generateCampionamenti(player.ruolo, player.v)
    const latestStats = camps[0].stats
    const latestMedia = camps[0].media
    const rankObj     = getRank(latestMedia)

    const clientRef = doc(collection(db, `organizations/${orgId}/clients`))
    batch.set(clientRef, {
      name:           player.name,
      eta:            player.eta,
      sesso:          'M',
      peso:           player.peso,
      altezza:        player.altezza,
      email:          '',
      clientAuthUid:  null,
      categoria:      'soccer',
      profileType:    'tests_only',
      ruolo:          player.ruolo,
      level,
      xp,
      xpNext,
      rank:           rankObj.label,
      rankColor:      rankObj.color,
      media:          latestMedia,
      stats:          latestStats,
      campionamenti:  camps,
      log: [{
        date:   new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
        action: 'Seed dati demo',
        xp:     0,
      }],
      sessionsPerWeek: 3,
      biaHistory:      [],
      lastBia:         null,
      createdAt:       new Date().toISOString(),
    })
  })

  console.log(`Scrittura ${PLAYERS.length} giocatori + org + 2 membri...`)
  await batch.commit()

  // ── Output ───────────────────────────────────────────────────────────────────
  console.log()
  console.log(`✅  Seed completato!`)
  console.log()
  console.log(`   orgId     : ${orgId}`)
  console.log(`   Giocatori : ${PLAYERS.length}  (2 GK · 8 DEF · 8 MID · 6 FWD)`)
  console.log(`   Campion.  : 10 per giocatore (ultimi 10 mesi)`)
  console.log()
  console.log(`Prossimi passi:`)
  console.log(`  1. Vai su Firebase Console → Authentication (progetto ${firebaseConfig.projectId})`)
  console.log(`     Crea (o usa) un account reale e copia il suo UID`)
  console.log(`  2. Aggiorna /users/{uid}:`)
  console.log(`     { role: 'trainer', orgId: '${orgId}', moduleType: 'soccer_academy', terminologyVariant: 'soccer_academy' }`)
  console.log(`  3. Aggiorna /organizations/${orgId}/members/{uid} con il tuo UID reale`)
  console.log(`  4. Accedi come trainer → vedrai i 24 giocatori`)

  process.exit(0)
}

main().catch(err => {
  console.error('Errore:', err.message ?? err)
  process.exit(1)
})
