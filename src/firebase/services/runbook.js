import {
  collection, addDoc, getDocs, query, orderBy, limit as fsLimit,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db }      from './db'
import app         from '../config'

/**
 * Storico esecuzioni del runbook manuale — solo super_admin (vedi firestore.rules).
 * I casi/suite sono definiti in src/config/runbook.config.js (data statica) — qui
 * vive solo il risultato di ogni giro di verifica, come audit_logs ma per QA
 * anziché per azioni utente. Scrittura diretta (non Cloud Function): a differenza
 * di note/obiettivi, l'unico ruolo che può toccare questa collection è già il più
 * fidato dell'app (super_admin, isSuperAdmin() nelle rules) — non c'è nessun
 * trainer/client da cui difendersi qui.
 */

const COLLECTION = 'qa_runs'

export async function getRuns(max = 50) {
  try {
    const q    = query(collection(db, COLLECTION), orderBy('finishedAt', 'desc'), fsLimit(max))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch {
    return []
  }
}

/**
 * @param {string[]} suiteIds
 * @param {Record<string, { status: 'pass'|'fail'|'skip', note?: string }>} results
 * @param {{ pass: number, fail: number, skip: number, total: number }} counts
 */
export async function saveRun(suiteIds, results, counts) {
  const user = getAuth(app).currentUser
  const runData = {
    suiteIds,
    results,
    counts,
    runBy:      user?.uid ?? null,
    runByEmail: user?.email ?? null,
    finishedAt: new Date().toISOString(),
  }
  const ref = await addDoc(collection(db, COLLECTION), runData)
  return { id: ref.id, ...runData }
}
