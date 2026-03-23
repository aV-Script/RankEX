import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail,
} from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import app from '../config'

export const auth = getAuth(app)  // ← ora è esportabile

// App secondaria per creare account cliente senza fare logout del trainer
// Usa le stesse env vars del config principale
const SECONDARY_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}
const secondaryApp  = initializeApp(SECONDARY_CONFIG, 'secondary')
const secondaryAuth = getAuth(secondaryApp)

export const login         = (email, pw) => signInWithEmailAndPassword(auth, email, pw)
export const register      = (email, pw) => createUserWithEmailAndPassword(auth, email, pw)
export const logout        = ()          => signOut(auth)
export const resetPassword = (email)     => sendPasswordResetEmail(auth, email)
export const onAuthChange  = (cb)        => onAuthStateChanged(auth, cb)
export const getCurrentUser = ()         => auth.currentUser

export async function createClientAccount(email, password) {
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
  await signOut(secondaryAuth)
  return cred.user.uid
}
