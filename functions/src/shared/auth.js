import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError }   from 'firebase-functions/v2/https'

/**
 * Verifica che il chiamante sia autenticato e restituisce il suo profilo Firestore.
 * Lancia HttpsError se non autenticato.
 */
export async function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Autenticazione richiesta')
  const db      = getFirestore()
  const userDoc = await db.collection('users').doc(request.auth.uid).get()
  if (!userDoc.exists) throw new HttpsError('not-found', 'Profilo utente non trovato')
  return { uid: request.auth.uid, ...userDoc.data() }
}

/**
 * Come requireAuth, ma lancia se il ruolo non è tra quelli consentiti.
 */
export async function requireRole(request, allowedRoles) {
  const profile = await requireAuth(request)
  if (!allowedRoles.includes(profile.role)) {
    throw new HttpsError('permission-denied', `Ruolo richiesto: ${allowedRoles.join(' | ')}`)
  }
  return profile
}

/**
 * Verifica che il caller appartеnga all'org su cui sta operando.
 * super_admin può operare su qualsiasi org.
 */
export async function requireOrgAccess(request, orgId) {
  const profile = await requireAuth(request)
  if (profile.role === 'super_admin') return profile
  if (!['org_admin', 'trainer'].includes(profile.role)) {
    throw new HttpsError('permission-denied', 'Permessi insufficienti')
  }
  if (profile.orgId !== orgId) {
    throw new HttpsError('permission-denied', 'Accesso negato a questa organizzazione')
  }
  return profile
}
