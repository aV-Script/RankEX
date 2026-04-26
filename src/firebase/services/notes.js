import {
  collection, getDocs, addDoc, deleteDoc,
  doc, query, orderBy,
} from 'firebase/firestore'
import { db }        from './db'
import { notesPath } from '../paths'

export const getNotes = async (orgId, clientId) => {
  try {
    const q    = query(collection(db, notesPath(orgId, clientId)), orderBy('createdAt', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch {
    return []
  }
}

export const addNote = (orgId, clientId, data) =>
  addDoc(collection(db, notesPath(orgId, clientId)), {
    ...data,
    createdAt: new Date().toISOString(),
  })

export const deleteNoteItem = (orgId, clientId, noteId) =>
  deleteDoc(doc(db, notesPath(orgId, clientId), noteId))
