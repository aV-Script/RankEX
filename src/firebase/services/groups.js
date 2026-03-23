import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where,
} from 'firebase/firestore'
import { db } from './db'

// Struttura gruppo: { id, name, trainerId, clientIds: [] }

export const getGroups = async (trainerId) => {
  const q    = query(collection(db, 'groups'), where('trainerId', '==', trainerId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const addGroup = (data) =>
  addDoc(collection(db, 'groups'), data)

export const updateGroup = (id, data) =>
  updateDoc(doc(db, 'groups', id), data)

export const deleteGroup = (id) =>
  deleteDoc(doc(db, 'groups', id))

export async function removeClientFromAllGroups(trainerId, clientId) {
  const groups = await getGroups(trainerId)
  const promises = groups
    .filter(g => g.clientIds.includes(clientId))
    .map(g => updateGroup(g.id, {
      clientIds: g.clientIds.filter(id => id !== clientId)
    }))
  await Promise.all(promises)
}