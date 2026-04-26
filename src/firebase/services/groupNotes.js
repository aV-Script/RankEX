import {
  collection, getDocs, addDoc, deleteDoc,
  doc, query, orderBy,
} from 'firebase/firestore'
import { db }             from './db'
import { groupNotesPath } from '../paths'

export const getGroupNotes = async (orgId, groupId) => {
  try {
    const q    = query(collection(db, groupNotesPath(orgId, groupId)), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch {
    return []
  }
}

export const addGroupNote = (orgId, groupId, data) =>
  addDoc(collection(db, groupNotesPath(orgId, groupId)), {
    ...data,
    createdAt: new Date().toISOString(),
  })

export const deleteGroupNote = (orgId, groupId, noteId) =>
  deleteDoc(doc(db, groupNotesPath(orgId, groupId), noteId))
