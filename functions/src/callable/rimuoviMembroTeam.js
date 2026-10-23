import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth }           from 'firebase-admin/auth'
import { requireOrgAdmin }   from '../shared/auth.js'

const REGION = 'europe-west1'

export const rimuoviMembroTeam = onCall({ region: REGION }, async (request) => {
  const { orgId, uid } = request.data

  if (!orgId || !uid) {
    throw new HttpsError('invalid-argument', 'orgId e uid sono obbligatori')
  }

  await requireOrgAdmin(request, orgId)

  if (uid === request.auth.uid) {
    throw new HttpsError('failed-precondition', 'Non puoi rimuovere te stesso dal team')
  }

  const db        = getFirestore()
  const memberRef = db.doc(`organizations/${orgId}/members/${uid}`)

  // requireOrgAdmin verifica solo il chiamante: senza questo controllo un org_admin
  // poteva cancellare /users e l'account Auth di un utente di un'altra org.
  const memberSnap = await memberRef.get()
  if (!memberSnap.exists) {
    throw new HttpsError('not-found', 'Membro non trovato in questa organizzazione')
  }

  const batch = db.batch()
  batch.delete(memberRef)
  batch.delete(db.doc(`users/${uid}`))
  batch.update(db.doc(`organizations/${orgId}`), {
    memberCount: FieldValue.increment(-1),
  })

  await batch.commit()

  // Elimina l'account Firebase Auth (best-effort: il membro è già fuori dall'org)
  try {
    await getAuth().deleteUser(uid)
  } catch (err) {
    if (err?.code !== 'auth/user-not-found') {
      console.error('rimuoviMembroTeam: deleteUser fallito', uid, err)
    }
  }

  return { ok: true }
})
