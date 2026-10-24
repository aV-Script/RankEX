import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth }                             from 'firebase/auth'
import { db }                                  from '../firebase/services/db'
import app                                     from '../firebase/config'
import { ENV }                                 from './env'

export const AUDIT_ACTIONS = {
  // Auth
  LOGIN:            'auth.login',
  LOGOUT:           'auth.logout',
  LOGIN_FAILED:     'auth.login_failed',
  PASSWORD_CHANGED: 'auth.password_changed',
  EMAIL_CHANGED:    'auth.email_changed',

  // Clienti
  CLIENT_CREATED:  'client.created',
  CLIENT_DELETED:  'client.deleted',
  CAMPIONAMENTO:   'client.campionamento',
  BIA_RECORDED:    'client.bia',

  // Organizzazione
  ORG_CREATED:     'org.created',
  ORG_SUSPENDED:   'org.suspended',
  ORG_DELETED:     'org.deleted',
  MEMBER_ADDED:    'org.member_added',
  MEMBER_REMOVED:  'org.member_removed',
  ROLE_CHANGED:    'org.role_changed',
}

/**
 * Scrive un evento immutabile in /audit_logs.
 * Non lancia mai — un fallimento dell'audit non deve bloccare il flusso.
 *
 * @param {string} action   — uno dei valori AUDIT_ACTIONS
 * @param {object} [details] — dettagli specifici dell'azione
 */
export async function auditLog(action, details = {}) {
  const user = getAuth(app).currentUser
  if (!user) return

  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      uid:       user.uid,
      email:     user.email,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      details,
      env:       ENV,
    })
  } catch {
    // Silenzioso: l'audit non deve mai bloccare l'operazione principale
  }
}
