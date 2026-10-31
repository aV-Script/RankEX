import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }       from 'firebase-admin/firestore'
import { requireOrgAccess }   from '../shared/auth.js'
import { requireId }          from '../shared/validate.js'
import { getOrgCapabilities, requireCapability } from '../shared/orgModule.js'
import { buildPrivacyNotice, writeAudit, AUDIT_PRIVACY_NOTICE_RECORDED } from '../shared/actor.js'

const REGION = 'europe-west1'

/**
 * Registra (o aggiorna con una nuova versione) l'informativa consegnata al
 * paziente (ADR-015 §1). `client.privacyNotice` non è nella whitelist di update
 * diretto delle rules: lo scrive solo l'Admin SDK, qui o in creaCliente.
 * Lo storico delle versioni vive in audit_logs (PRIVACY_NOTICE_RECORDED, soli id).
 * Solo trainer/org_admin (requireOrgAccess esclude staff_readonly).
 */
export const registraInformativaPaziente = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, informativaVersion, deliveredAt } = request.data ?? {}
  const profile = await requireOrgAccess(request, orgId)
  requireId(clientId, 'clientId')

  const db = getFirestore()
  requireCapability(await getOrgCapabilities(db, orgId), 'hasAssessments')

  const clientRef = db.doc(`organizations/${orgId}/clients/${clientId}`)

  const privacyNotice = await db.runTransaction(async (tx) => {
    const snap = await tx.get(clientRef)
    if (!snap.exists) throw new HttpsError('not-found', 'Paziente non trovato')

    const notice = buildPrivacyNotice({ informativaVersion, deliveredAt }, snap.data().dataNascita, { profile, request })
    tx.update(clientRef, { privacyNotice: notice })
    return notice
  })

  writeAudit(db, request, AUDIT_PRIVACY_NOTICE_RECORDED, {
    orgId, clientId, informativaVersion: privacyNotice.informativaVersion,
  })

  return { privacyNotice }
})
