import {
  collection, getDocs,
  query, where,
} from 'firebase/firestore'
import { db }               from './db'
import { workoutPlansPath } from '../paths'
import { pickActivePlan, sortPlansByCreatedAtDesc } from '../../utils/workoutPlans'

// Fetch schede di un singolo cliente (usato dal lato client — single-field index automatico)
// Tutte le schede di un cliente (attive + archiviate), ordinate per data
export const getClientPlans = async (orgId, clientId) => {
  const q    = query(collection(db, workoutPlansPath(orgId)), where('clientId', '==', clientId))
  const snap = await getDocs(q)
  return sortPlansByCreatedAtDesc(snap.docs.map(d => ({ id: d.id, ...d.data() })))
}

// Scheda attiva di un cliente (usato dal lato client)
export const getWorkoutPlanForClient = async (orgId, clientId) => {
  const plans = await getClientPlans(orgId, clientId)
  return pickActivePlan(plans)
}
