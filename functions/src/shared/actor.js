// Chi esegue una callable lipedema e cosa resta tracciato: nome denormalizzato
// (examinerName, recordedByName, voidedByName), informativa registrata e audit
// con soli identificativi (ADR-011, ADR-015 §1-2). Usato da creaCliente,
// registraInformativaPaziente, aggiungiValutazione, annullaValutazione.

import { HttpsError } from 'firebase-functions/v2/https'
import * as logger from 'firebase-functions/logger'
import { validatePrivacyNoticeInput, formatLocalDateTime } from './lipedema.js'
import { LOCAL_TIME_ZONE } from './timezone.js'

export { LOCAL_TIME_ZONE }

export const AUDIT_PRIVACY_NOTICE_RECORDED = 'PRIVACY_NOTICE_RECORDED'
export const AUDIT_ASSESSMENT_VOIDED       = 'ASSESSMENT_VOIDED'
export const AUDIT_CLIENT_CREATED          = 'CLIENT_CREATED'
export const AUDIT_CLIENT_DELETED          = 'CLIENT_DELETED'

/**
 * Nome di chi agisce. Stesso criterio di aggiungiNota → authorName: nome del
 * profilo /users/{uid}, poi email del token, poi uid. Il client mostra lo stesso
 * valore in anteprima (useAuth → profile.name ?? email).
 * @param {object} profile — restituito da requireOrgAccess
 * @param {object} request — request della callable
 */
export function getActorName(profile, request) {
  return profile.name ?? request.auth?.token?.email ?? profile.uid
}

/** Data/ora locale dello studio, 'YYYY-MM-DDTHH:mm' */
export function nowLocal() {
  return formatLocalDateTime(new Date(), LOCAL_TIME_ZONE)
}

/**
 * Informativa consegnata validata e completata con chi la registra e quando
 * (lo decide il server, mai il client). Lancia invalid-argument se non valida.
 * @param {{ informativaVersion, deliveredAt }} input
 * @param {string|null} birthDate
 */
export function buildPrivacyNotice(input, birthDate, { profile, request }) {
  const { errors, value } = validatePrivacyNoticeInput(input, { today: nowLocal().slice(0, 10), birthDate: birthDate ?? null })
  if (!value) throw new HttpsError('invalid-argument', Object.values(errors)[0], { fields: errors })
  return {
    ...value,
    recordedBy:     request.auth.uid,
    recordedByName: getActorName(profile, request),
    recordedAt:     new Date().toISOString(),
  }
}

/**
 * `details` di CLIENT_CREATED / CLIENT_DELETED (TD-009). Il nome del cliente c'è solo
 * se il modulo dell'org lo permette (`hasClientNameInAudit`), mai in base al dato:
 * nei moduli sanitari nome + org = diagnosi in un log letto da super_admin
 * (ADR-015 §2). `capabilities` assente o modulo sconosciuto = niente nome.
 * @param {object|null} capabilities — da getOrgCapabilities
 */
export function buildClientAuditDetails(capabilities, { clientId, orgId, name }) {
  return capabilities?.hasClientNameInAudit === true
    ? { clientId, clientName: name, orgId }
    : { clientId, orgId }
}

/**
 * Audit che non fa mai fallire l'operazione (errore loggato: solo action e code, mai message/details). Restituisce la
 * promessa: chi deve garantire la traccia la attende prima di rispondere, perché
 * dopo il return di una callable l'istanza può essere fermata. `details` solo identificativi (e versione
 * dell'informativa): mai nomi, valori, motivi o note — nome + org = diagnosi.
 * Unica eccezione: buildClientAuditDetails, che decide per modulo.
 */
export function writeAudit(db, request, action, details) {
  return db.collection('audit_logs').add({
    action,
    uid:       request.auth?.uid ?? null,
    email:     request.auth?.token?.email ?? null,
    timestamp: new Date().toISOString(),
    details,
    env:       'functions',
  }).catch(err => logger.error('writeAudit fallito', { action, code: err?.code }))
}
