// Chi esegue una callable lipedema e cosa resta tracciato: nome denormalizzato
// (examinerName, recordedByName, voidedByName), informativa registrata e audit
// con soli identificativi (ADR-011, ADR-015 §1-2). Usato da creaCliente,
// registraInformativaPaziente, aggiungiValutazione, annullaValutazione.

import { HttpsError } from 'firebase-functions/v2/https'
import { validatePrivacyNoticeInput, formatLocalDateTime } from './lipedema.js'

// Ora locale degli studi (ADR-009: performedAt è in ora locale Europe/Rome).
// Stesso valore di LOCAL_TIME_ZONE in src/utils/lipedema.js (test di parità).
export const LOCAL_TIME_ZONE = 'Europe/Rome'

export const AUDIT_PRIVACY_NOTICE_RECORDED = 'PRIVACY_NOTICE_RECORDED'
export const AUDIT_ASSESSMENT_VOIDED       = 'ASSESSMENT_VOIDED'

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
 * Audit fire-and-forget. `details` solo identificativi (e versione
 * dell'informativa): mai nomi, valori, motivi o note — nome + org = diagnosi.
 */
export function writeAudit(db, request, action, details) {
  db.collection('audit_logs').add({
    action,
    uid:       request.auth?.uid ?? null,
    email:     request.auth?.token?.email ?? null,
    timestamp: new Date().toISOString(),
    details,
    env:       'functions',
  }).catch(() => {})
}
