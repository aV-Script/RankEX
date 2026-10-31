import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }       from 'firebase-admin/firestore'
import { requireOrgAccess }   from '../shared/auth.js'
import { requireId }          from '../shared/validate.js'
import { getOrgCapabilities, requireCapability } from '../shared/orgModule.js'
import { validateVoidReason, ASSESSMENT_STATUS } from '../shared/lipedema.js'
import { getActorName, writeAudit, AUDIT_ASSESSMENT_VOIDED } from '../shared/actor.js'

const REGION = 'europe-west1'

/**
 * Annulla una valutazione (ADR-011): resta nello storico con stato 'voided',
 * motivo e autore, ed è esclusa da delta e confronti. Mai cancellata, mai
 * ripristinata. Qualunque professionista dell'org può annullare, non solo
 * l'autore (come per le note). Per una correzione con reinserimento si usa
 * aggiungiValutazione con `supersedes`, che annulla e salva insieme.
 */
export const annullaValutazione = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, assessmentId, voidReason } = request.data ?? {}
  const profile = await requireOrgAccess(request, orgId)
  requireId(clientId, 'clientId')
  requireId(assessmentId, 'assessmentId')
  const { error, value: reason } = validateVoidReason(voidReason)
  if (error) throw new HttpsError('invalid-argument', error)

  const db = getFirestore()
  requireCapability(await getOrgCapabilities(db, orgId), 'hasAssessments')

  const ref = db.doc(`organizations/${orgId}/clients/${clientId}/assessments/${assessmentId}`)
  const uid = request.auth.uid

  const voided = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw new HttpsError('not-found', 'Valutazione non trovata')
    const assessment = snap.data()
    if (assessment.status !== ASSESSMENT_STATUS.VALID) {
      throw new HttpsError('failed-precondition', 'La valutazione è già annullata')
    }
    const update = {
      status:       ASSESSMENT_STATUS.VOIDED,
      voidedAt:     new Date().toISOString(),
      voidedBy:     uid,
      voidedByName: getActorName(profile, request),
      voidReason:   reason,
    }
    tx.update(ref, update)
    return { testId: assessment.testId, ...update }
  })

  // Soli identificativi: motivo, valori e note possono contenere dati sanitari
  writeAudit(db, request, AUDIT_ASSESSMENT_VOIDED, { orgId, clientId, assessmentId, testId: voided.testId })

  return { ok: true, ...voided }
})
