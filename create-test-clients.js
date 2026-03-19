/**
 * Script per creare clienti di test con profili statistici diversificati.
 *
 * Prerequisito: crea prima il trainer con create-test-user.js
 *
 * Esegui:
 *   node create-test-clients.js
 *
 * Password temporanea per tutti: Client01!
 */

import { initializeApp }                              from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirestore, doc, setDoc, addDoc, getDoc, collection, getDocs } from 'firebase/firestore'

// ── Config ────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyABkp7d91Wb2JG0SsJzDIhrceH_cma0Qc0",
  authDomain:        "fitquest-60a09.firebaseapp.com",
  projectId:         "fitquest-60a09",
  storageBucket:     "fitquest-60a09.firebasestorage.app",
  messagingSenderId: "684894217887",
  appId:             "1:684894217887:web:685adbbd3b67254de3e4aa",
}

const TRAINER_EMAIL   = "trainer@fitquest.test"
const CLIENT_PASSWORD = "Client01!"
const TODAY = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })

const app       = initializeApp(firebaseConfig)
const secondApp = initializeApp(firebaseConfig, 'secondary')
const auth      = getAuth(app)
const authSec   = getAuth(secondApp)
const db        = getFirestore(app)

// ── Utilities ─────────────────────────────────────────────────────────────────

function calcStatMedia(stats) {
  const vals = Object.values(stats).filter(v => typeof v === 'number')
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
}

const RANKS = [
  { min: 95, label: 'EX',  color: '#ffd700' }, { min: 90, label: 'SS+', color: '#ff6b6b' },
  { min: 85, label: 'SS',  color: '#ff8e53' }, { min: 80, label: 'S+',  color: '#ff6fd8' },
  { min: 75, label: 'S',   color: '#c77dff' }, { min: 70, label: 'A+',  color: '#a78bfa' },
  { min: 65, label: 'A',   color: '#60a5fa' }, { min: 60, label: 'B+',  color: '#38bdf8' },
  { min: 55, label: 'B',   color: '#34d399' }, { min: 50, label: 'C+',  color: '#6ee7b7' },
  { min: 45, label: 'C',   color: '#a3e635' }, { min: 40, label: 'D+',  color: '#facc15' },
  { min: 35, label: 'D',   color: '#fb923c' }, { min: 30, label: 'E+',  color: '#f87171' },
  { min: 25, label: 'E',   color: '#f43f5e' }, { min: 20, label: 'F+',  color: '#9ca3af' },
  { min: 0,  label: 'F',   color: '#6b7280' },
]
const getRank = (media) => RANKS.find(r => media >= r.min) ?? RANKS[RANKS.length - 1]

function calcSessionConfig(freq) {
  const monthly = Math.round(freq * 4.33)
  return { sessionsPerWeek: freq, monthlySessions: monthly, xpPerSession: Math.round(500 / monthly) }
}

function buildXPNext(level) {
  let next = 700
  for (let i = 1; i < level; i++) next = Math.round(next * 1.3)
  return next
}

function buildClient(trainerId, data) {
  const { name, email, sesso, eta, peso, altezza, categoria,
          stats, level = 1, sessionsPerWeek = 3 } = data

  const media   = calcStatMedia(stats)
  const rankObj = getRank(media)
  const xpBase  = Math.round(media * 8)
  const xpNext  = buildXPNext(level)

  // ── Log ──────────────────────────────────────────────────────────────────

  const { monthlySessions, xpPerSession } = calcSessionConfig(sessionsPerWeek)

  return {
    trainerId, name, email, sesso, eta, peso, altezza, categoria,
    stats,
    rank:            rankObj.label,
    rankColor:       rankObj.color,
    media,
    level,
    xp:              xpBase,
    xpNext,
    sessionsPerWeek,
    campionamenti:   [{ date: TODAY, stats, tests: {}, media }],
    log:             [{ date: TODAY, action: logMsg, xp: 0 }],
  }
}

// ── Profili clienti di test ───────────────────────────────────────────────────
const TEST_CLIENTS = [
  // Nessuna classe — principiante
  { name: 'Marco Bianchi',    email: 'marco@fitquest.test',
    sesso: 'M', eta: 28, peso: 75, altezza: 178, categoria: 'Amatoriale',
    stats: { mobilita: 42, equilibrio: 38, forza: 45, esplosivita: 40, resistenza: 48 },
    level: 2, sessionsPerWeek: 2, group: 'Amatoriali' },

  // Guerriero
  { name: 'Luca Ferretti',    email: 'luca@fitquest.test',
    sesso: 'M', eta: 32, peso: 88, altezza: 182, categoria: 'Agonista',
    stats: { mobilita: 45, equilibrio: 50, forza: 72, esplosivita: 55, resistenza: 52 },
    level: 4, sessionsPerWeek: 4, group: 'Agonisti' },

  // Danzatore
  { name: 'Sofia Romano',     email: 'sofia@fitquest.test',
    sesso: 'F', eta: 26, peso: 58, altezza: 165, categoria: 'Amatoriale',
    stats: { mobilita: 78, equilibrio: 55, forza: 48, esplosivita: 50, resistenza: 53 },
    level: 3, sessionsPerWeek: 3, group: 'Arti Marziali' },

  // Sentinella
  { name: 'Elena Conti',      email: 'elena@fitquest.test',
    sesso: 'F', eta: 34, peso: 62, altezza: 168, categoria: 'Amatoriale',
    stats: { mobilita: 58, equilibrio: 80, forza: 50, esplosivita: 52, resistenza: 55 },
    level: 3, sessionsPerWeek: 3, group: 'Amatoriali' },

  // Velocista
  { name: 'Andrea Mancini',   email: 'andrea@fitquest.test',
    sesso: 'M', eta: 24, peso: 72, altezza: 175, categoria: 'Agonista',
    stats: { mobilita: 52, equilibrio: 55, forza: 58, esplosivita: 70, resistenza: 50 },
    level: 4, sessionsPerWeek: 5, group: 'Agonisti' },

  // Corridore
  { name: 'Giulia Marini',    email: 'giulia@fitquest.test',
    sesso: 'F', eta: 30, peso: 56, altezza: 163, categoria: 'Amatoriale',
    stats: { mobilita: 60, equilibrio: 55, forza: 45, esplosivita: 52, resistenza: 72 },
    level: 4, sessionsPerWeek: 3, group: 'Amatoriali' },

  // SPEC: Predatore
  { name: 'Davide Esposito',  email: 'davide@fitquest.test',
    sesso: 'M', eta: 27, peso: 82, altezza: 180, categoria: 'Agonista',
    stats: { mobilita: 50, equilibrio: 55, forza: 72, esplosivita: 68, resistenza: 55 },
    level: 5, sessionsPerWeek: 5, group: 'Agonisti' },

  // SPEC: Acrobata
  { name: 'Chiara Ricci',     email: 'chiara@fitquest.test',
    sesso: 'F', eta: 22, peso: 52, altezza: 160, categoria: 'Agonista',
    stats: { mobilita: 82, equilibrio: 78, forza: 50, esplosivita: 55, resistenza: 52 },
    level: 5, sessionsPerWeek: 4, group: 'Arti Marziali' },

  // SPEC: Guerriero d'Élite
  { name: 'Roberto Lombardi', email: 'roberto@fitquest.test',
    sesso: 'M', eta: 38, peso: 90, altezza: 183, categoria: 'Agonista',
    stats: { mobilita: 52, equilibrio: 58, forza: 75, esplosivita: 58, resistenza: 68 },
    level: 6, sessionsPerWeek: 4, group: 'Agonisti' },

  // SPEC: Fantasma
  { name: 'Alessandro Costa', email: 'ale@fitquest.test',
    sesso: 'M', eta: 25, peso: 70, altezza: 176, categoria: 'Agonista',
    stats: { mobilita: 58, equilibrio: 78, forza: 55, esplosivita: 70, resistenza: 55 },
    level: 5, sessionsPerWeek: 5, group: 'Arti Marziali' },

  // SPEC: Maratoneta
  { name: 'Valentina Serra',  email: 'vale@fitquest.test',
    sesso: 'F', eta: 35, peso: 55, altezza: 162, categoria: 'Amatoriale',
    stats: { mobilita: 65, equilibrio: 58, forza: 48, esplosivita: 52, resistenza: 75 },
    level: 5, sessionsPerWeek: 3, group: 'Amatoriali' },

  // SPEC: Titano
  { name: 'Matteo Greco',     email: 'matteo@fitquest.test',
    sesso: 'M', eta: 33, peso: 95, altezza: 185, categoria: 'Agonista',
    stats: { mobilita: 50, equilibrio: 72, forza: 80, esplosivita: 60, resistenza: 55 },
    level: 6, sessionsPerWeek: 4, group: 'Agonisti' },

  // SPEC: Artista Marziale
  { name: 'Yuki Tanaka',      email: 'yuki@fitquest.test',
    sesso: 'F', eta: 29, peso: 57, altezza: 161, categoria: 'Agonista',
    stats: { mobilita: 75, equilibrio: 73, forza: 65, esplosivita: 62, resistenza: 60 },
    level: 7, sessionsPerWeek: 5, group: 'Arti Marziali' },

  // SPEC: Atleta Completo
  { name: 'Francesco De Luca', email: 'frank@fitquest.test',
    sesso: 'M', eta: 31, peso: 78, altezza: 179, categoria: 'Agonista',
    stats: { mobilita: 68, equilibrio: 70, forza: 68, esplosivita: 65, resistenza: 67 },
    level: 8, sessionsPerWeek: 5, group: 'Agonisti' },

  // Multiclasse: Predatore + Guerriero d'Élite
  { name: 'Nicola Barbieri',  email: 'nicola@fitquest.test',
    sesso: 'M', eta: 28, peso: 84, altezza: 181, categoria: 'Agonista',
    stats: { mobilita: 50, equilibrio: 55, forza: 78, esplosivita: 72, resistenza: 68 },
    level: 7, sessionsPerWeek: 5, group: 'Agonisti' },

  // Multiclasse: Acrobata + Fantasma + Artista Marziale
  { name: 'Irene Fontana',    email: 'irene@fitquest.test',
    sesso: 'F', eta: 24, peso: 53, altezza: 164, categoria: 'Agonista',
    stats: { mobilita: 78, equilibrio: 80, forza: 62, esplosivita: 72, resistenza: 58 },
    level: 8, sessionsPerWeek: 5, group: 'Arti Marziali' },

  // Fragile — profilo basso
  { name: 'Anna Gallo',       email: 'anna@fitquest.test',
    sesso: 'F', eta: 62, peso: 68, altezza: 158, categoria: 'Fragile',
    stats: { mobilita: 28, equilibrio: 22, forza: 25, esplosivita: 30, resistenza: 32 },
    level: 1, sessionsPerWeek: 2, group: 'Fragili' },
]

// ── Gestione gruppi ───────────────────────────────────────────────────────────
const groupCache = {}  // nome → { id, clientIds }

async function getOrCreateGroup(trainerId, groupName) {
  if (groupCache[groupName]) return groupCache[groupName]

  // Cerca gruppo esistente
  const snap = await getDocs(collection(db, 'groups'))
  for (const d of snap.docs) {
    const data = d.data()
    if (data.trainerId === trainerId && data.name === groupName) {
      groupCache[groupName] = { id: d.id, clientIds: data.clientIds ?? [] }
      return groupCache[groupName]
    }
  }

  // Crea nuovo
  const ref = await addDoc(collection(db, 'groups'), {
    trainerId, name: groupName, clientIds: [],
  })
  groupCache[groupName] = { id: ref.id, clientIds: [] }
  console.log(`  ✦ Gruppo creato: "${groupName}"`)
  return groupCache[groupName]
}

async function addClientToGroup(groupId, clientId) {
  // Legge il gruppo aggiornato, aggiunge il clientId
  const ref  = doc(db, 'groups', groupId)
  const snap = await getDoc(ref)
  const current = snap.data()?.clientIds ?? []
  if (!current.includes(clientId)) {
    await setDoc(ref, { clientIds: [...current, clientId] }, { merge: true })
  }
}

// ── Creazione cliente ─────────────────────────────────────────────────────────
async function createClient(trainerId, clientData) {
  const { email, group, ...rest } = clientData

  // 1. Auth
  let clientUid
  try {
    const cred = await createUserWithEmailAndPassword(authSec, email, CLIENT_PASSWORD)
    clientUid  = cred.user.uid
    await signOut(authSec)
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      process.stdout.write('  (già esistente) ')
      return null
    }
    throw err
  }

  // 2. Documento cliente
  const clientDoc = buildClient(trainerId, { ...rest, email })
  const ref = await addDoc(collection(db, 'clients'), {
    ...clientDoc, clientAuthUid: clientUid,
  })

  // 3. Profilo utente
  await setDoc(doc(db, 'users', clientUid), {
    role:     'client',
    clientId: ref.id,
    trainerId,
    email,
  })

  // 4. Aggiungi al gruppo
  if (group) {
    const grp = await getOrCreateGroup(trainerId, group)
    await addClientToGroup(grp.id, ref.id)
  }

  return ref.id
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function getTrainerId() {
  const snap = await getDocs(collection(db, 'users'))
  for (const d of snap.docs) {
    const data = d.data()
    if (data.email === TRAINER_EMAIL && data.role === 'trainer') return d.id
  }
  return null
}

console.log('FitQuest — Creazione clienti di test\n')

const trainerId = await getTrainerId()
if (!trainerId) {
  console.error('✗ Trainer non trovato. Esegui prima create-test-user.js')
  process.exit(1)
}
console.log(`Trainer: ${trainerId}\n`)
console.log('Nome                    Freq  Gruppo          Rank  Media  ')
console.log('─'.repeat(80))

let created = 0, skipped = 0

for (const clientData of TEST_CLIENTS) {
  process.stdout.write(`  ${clientData.name.padEnd(22)} ${String(clientData.sessionsPerWeek + '×').padEnd(5)} ${(clientData.group ?? '—').padEnd(15)} `)

  try {
    const clientId = await createClient(trainerId, clientData)
    if (clientId) {
      const doc2    = buildClient(trainerId, clientData)
      console.log(`${doc2.rank.padEnd(5)} ${String(doc2.media).padEnd(6)}`)
      created++
    } else {
      console.log('— saltato')
      skipped++
    }
  } catch (err) {
    console.log(`✗ ${err.message}`)
  }
}

console.log('─'.repeat(80))
console.log(`\nCreati: ${created}  |  Saltati: ${skipped}  |  Totale: ${TEST_CLIENTS.length}`)
console.log(`\nPassword: ${CLIENT_PASSWORD}`)
console.log(`Gruppi creati: ${Object.keys(groupCache).join(', ') || 'nessuno (già esistenti)'}`)

process.exit(0)