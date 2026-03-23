import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'
import { db } from './db'

export const getUserProfile    = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export const updateUserProfile = (uid, data) => updateDoc(doc(db, 'users', uid), data)

export const createUserProfile = (uid, data) => setDoc(doc(db, 'users', uid), data)
