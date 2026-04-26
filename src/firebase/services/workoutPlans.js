import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, where,
} from 'firebase/firestore'
import { db }               from './db'
import { workoutPlansPath } from '../paths'

export const getWorkoutPlans = async (orgId) => {
  try {
    const q    = query(collection(db, workoutPlansPath(orgId)), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch {
    return []
  }
}

// Fetch schede di un singolo cliente (usato dal lato client — single-field index automatico)
// Tutte le schede di un cliente (attive + archiviate), ordinate per data
export const getClientPlans = async (orgId, clientId) => {
  try {
    const q    = query(collection(db, workoutPlansPath(orgId)), where('clientId', '==', clientId))
    const snap = await getDocs(q)
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } catch {
    return []
  }
}

// Scheda attiva di un cliente (usato dal lato client)
export const getWorkoutPlanForClient = async (orgId, clientId) => {
  const plans = await getClientPlans(orgId, clientId)
  return plans.find(p => p.status === 'active') ?? null
}

export const addWorkoutPlan = (orgId, data) =>
  addDoc(collection(db, workoutPlansPath(orgId)), {
    ...data,
    status:    'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

export const updateWorkoutPlan = (orgId, planId, data) =>
  updateDoc(doc(db, workoutPlansPath(orgId), planId), {
    ...data,
    updatedAt: new Date().toISOString(),
  })

export const deleteWorkoutPlan = (orgId, planId) =>
  deleteDoc(doc(db, workoutPlansPath(orgId), planId))
