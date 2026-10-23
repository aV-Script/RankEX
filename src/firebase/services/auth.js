import {
  getAuth,
  browserLocalPersistence, browserSessionPersistence, setPersistence,
  signInWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail,
  updatePassword, verifyBeforeUpdateEmail,
  reauthenticateWithCredential, EmailAuthProvider,
} from 'firebase/auth'
import app              from '../config'
import { auditLog, AUDIT_ACTIONS } from '../../utils/auditLog'
import { isAdminDomain }           from '../../utils/env'

export const auth = getAuth(app)

// Admin domain → session persistence (logout alla chiusura del browser)
// Tutti gli altri → local persistence (rimane loggato)
setPersistence(auth, isAdminDomain() ? browserSessionPersistence : browserLocalPersistence)

export const login         = (email, pw) => signInWithEmailAndPassword(auth, email, pw)
export const logout        = async ()    => { await auditLog(AUDIT_ACTIONS.LOGOUT); return signOut(auth) }
export const resetPassword = (email)     => sendPasswordResetEmail(auth, email)
export const onAuthChange  = (cb)        => onAuthStateChanged(auth, cb)

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

