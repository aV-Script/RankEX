import {
  getAuth,
  browserLocalPersistence, browserSessionPersistence, setPersistence,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail,
  updatePassword, verifyBeforeUpdateEmail,
  reauthenticateWithCredential, EmailAuthProvider,
  deleteUser,
} from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import app              from '../config'
import { auditLog, AUDIT_ACTIONS } from '../../utils/auditLog'
import { isAdminDomain }           from '../../utils/env'

export const auth = getAuth(app)

// Admin domain → session persistence (logout alla chiusura del browser)
// Tutti gli altri → local persistence (rimane loggato)
setPersistence(auth, isAdminDomain() ? browserSessionPersistence : browserLocalPersistence)

// App secondaria per creare account membro senza fare logout del trainer corrente.
// Usata da CreateMemberForm. La creazione cliente è migrata a Cloud Function (creaCliente).
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
export const logout        = async ()    => { await auditLog(AUDIT_ACTIONS.LOGOUT); return signOut(auth) }
export const resetPassword = (email)     => sendPasswordResetEmail(auth, email)
export const onAuthChange  = (cb)        => onAuthStateChanged(auth, cb)
export const getCurrentUser = ()         => auth.currentUser

export async function changeTrainerPassword(currentPw, newPw) {
  const user       = auth.currentUser
  const credential = EmailAuthProvider.credential(user.email, currentPw)
  await reauthenticateWithCredential(user, credential)
  await updatePassword(user, newPw)
  await auditLog(AUDIT_ACTIONS.PASSWORD_CHANGED)
}

export async function changeUserEmail(currentPw, newEmail) {
  const user       = auth.currentUser
  const credential = EmailAuthProvider.credential(user.email, currentPw)
  await reauthenticateWithCredential(user, credential)
  await verifyBeforeUpdateEmail(user, newEmail)
  await auditLog(AUDIT_ACTIONS.EMAIL_CHANGED, { newEmail })
}

export async function createClientAccount(email, password) {
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
  return cred.user.uid
}

export async function finalizeClientAccount() {
  await signOut(secondaryAuth)
}

export async function rollbackClientAccount() {
  const user = secondaryAuth.currentUser
  if (user) {
    try { await deleteUser(user) } catch {}
  }
  try { await signOut(secondaryAuth) } catch {}
}

