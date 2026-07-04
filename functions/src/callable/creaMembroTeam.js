import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth }           from 'firebase-admin/auth'
import { requireOrgAdmin }   from '../shared/auth.js'

const REGION = 'europe-west1'

export const creaMembroTeam = onCall({ region: REGION }, async (request) => {
  const { orgId, role, name, email, password } = request.data

  if (!orgId || !role || !name || !email || !password) {
    throw new HttpsError('invalid-argument', 'orgId, role, name, email e password sono obbligatori')
  }

  const ALLOWED_ROLES = ['org_admin', 'trainer', 'staff_readonly']
  if (!ALLOWED_ROLES.includes(role)) {
    throw new HttpsError('invalid-argument', `Ruolo non valido: ${role}`)
  }

  await requireOrgAdmin(request, orgId)

  const db  = getFirestore()
  const org = await db.doc(`organizations/${orgId}`).get()
  if (!org.exists) throw new HttpsError('not-found', 'Organizzazione non trovata')

  const orgData = org.data()

  // Crea account Firebase Auth con Admin SDK
  let uid
  try {
    const userRecord = await getAuth().createUser({ email, password, displayName: name })
    uid = userRecord.uid
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Email già in uso')
    }
    throw new HttpsError('internal', `Errore creazione account: ${err.message}`)
  }

  const now = new Date().toISOString()

  try {
    const batch = db.batch()

    batch.set(db.doc(`users/${uid}`), {
      role,
      orgId,
      name,
      email,
      moduleType: orgData.moduleType ?? null,
      mustChangePassword: true,
    })

    batch.set(db.doc(`organizations/${orgId}/members/${uid}`), {
      role,
      name,
      email,
      joinedAt: now,
    })

    batch.update(db.doc(`organizations/${orgId}`), {
      memberCount: FieldValue.increment(1),
    })

    await batch.commit()
  } catch (err) {
    // Rollback: elimina l'utente Auth creato
    try { await getAuth().deleteUser(uid) } catch {}
    throw new HttpsError('internal', `Errore salvataggio Firestore: ${err.message}`)
  }

  return { uid, name, email, role }
})
