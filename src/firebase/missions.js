import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where,
} from 'firebase/firestore'
import { db } from './db'

export const getMissions    = async (clientId) => {
  const q    = query(collection(db, 'missions'), where('clientId', '==', clientId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const addMission    = (data)     => addDoc(collection(db, 'missions'), data)
export const updateMission = (id, data) => updateDoc(doc(db, 'missions', id), data)
export const deleteMission = (id)       => deleteDoc(doc(db, 'missions', id))

export const getCustomTemplates = async (trainerId) => {
  const q    = query(collection(db, 'missionTemplates'), where('trainerId', '==', trainerId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const saveTemplate = (trainerId, data) =>
  addDoc(collection(db, 'missionTemplates'), { ...data, trainerId })
