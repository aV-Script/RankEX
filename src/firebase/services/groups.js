import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, writeBatch,
} from 'firebase/firestore'
import { db }         from './db'
import { groupsPath } from '../paths'

// Struttura gruppo: { id, name, clientIds: [] }

export const getGroups = async (orgId) => {
  const q    = query(collection(db, groupsPath(orgId)))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const addGroup = (orgId, data) =>
  addDoc(collection(db, groupsPath(orgId)), data)

export const updateGroup = (orgId, id, data) =>
  updateDoc(doc(db, groupsPath(orgId), id), data)

export const deleteGroup = (orgId, id) =>
  deleteDoc(doc(db, groupsPath(orgId), id))

export async function removeClientFromAllGroups(orgId, clientId) {
  const groups    = await getGroups(orgId)
  const toUpdate  = groups.filter(g => g.clientIds.includes(clientId))
  if (toUpdate.length === 0) return
  const batch = writeBatch(db)
  toUpdate.forEach(g => {
    batch.update(doc(db, groupsPath(orgId), g.id), {
      clientIds: g.clientIds.filter(id => id !== clientId),
    })
  })
  await batch.commit()
}
