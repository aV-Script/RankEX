import {
  collection, getDocs,
  query, orderBy,
} from 'firebase/firestore'
import { db }              from './db'
import { assessmentsPath } from '../paths'

/**
 * Tutte le valutazioni del paziente, valide e annullate, dalla più recente.
 * Indice single-field automatico su performedAt: niente indici composti, il
 * raggruppamento per test avviene lato client (ADR-009 §5). Sola lettura: le
 * scritture passano da aggiungiValutazione / annullaValutazione.
 */
export const getAssessments = async (orgId, clientId) => {
  const q    = query(collection(db, assessmentsPath(orgId, clientId)), orderBy('performedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
}
