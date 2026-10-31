import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore }       from 'firebase-admin/firestore'
import { requireOrgAccess }   from '../shared/auth.js'
import { requireId }          from '../shared/validate.js'
import { getOrgCapabilities, requireCapability } from '../shared/orgModule.js'
import {
  validateAssessmentInput, validateVoidReason, patientAgeAt,
  ASSESSMENT_STATUS, MAX_TESTS_PER_VISIT, PRIVACY_NOTICE_MISSING,
} from '../shared/lipedema.js'
import { getActorName, nowLocal, writeAudit, AUDIT_ASSESSMENT_VOIDED } from '../shared/actor.js'

const REGION = 'europe-west1'

/**
 * Salva i test di una visita (ADR-009 §4): un documento per test in
 * clients/{id}/assessments, con un visitId comune generato qui. Risultato,
 * comparabilità, esaminatore e date li calcola solo il server dai dati grezzi
 * (shared/lipedema.js): il client non li può falsificare.
 *
 * Correzione (ADR-011): con `supersedes` + `voidReason` annulla la valutazione
 * indicata e salva la nuova nella stessa transazione, così non resta mai un buco
 * nello storico se l'utente abbandona a metà. La nuova resta nella stessa visita
 * della vecchia (stesso visitId). I documenti sono immutabili (rules: write
 * false): nessuna modifica in place.
 *
 * Rifiuta con failed-precondition se il paziente non ha l'informativa
 * registrata (ADR-015 §1) o se il modulo dell'org non prevede valutazioni.
 * Nessun XP, notifica o log sul cliente.
 *
 * request.data: { orgId, clientId, tests: [input 1..5], supersedes?, voidReason? }
 */
export const aggiungiValutazione = onCall({ region: REGION }, async (request) => {
  const { orgId, clientId, tests, supersedes = null, voidReason } = request.data ?? {}
  const profile = await requireOrgAccess(request, orgId)
  requireId(clientId, 'clientId')

  validateVisitShape(tests)
  // Prima della transazione: un input malformato è invalid-argument, mai internal.
  // La data di nascita (non futura / non prima della nascita) si ricontrolla
  // dentro la transazione, quando il paziente è letto.
  validateTests(tests, { nowLocal: nowLocal(), birthDate: null })

  let reason = null
  if (supersedes !== null) {
    requireId(supersedes, 'supersedes')
    if (tests.length !== 1) throw new HttpsError('invalid-argument', 'Una correzione sostituisce un solo test')
    const checked = validateVoidReason(voidReason)
    if (checked.error) throw new HttpsError('invalid-argument', checked.error)
    reason = checked.value
  }

  const db = getFirestore()
  requireCapability(await getOrgCapabilities(db, orgId), 'hasAssessments')

  const clientRef      = db.doc(`organizations/${orgId}/clients/${clientId}`)
  const assessmentsCol = db.collection(`organizations/${orgId}/clients/${clientId}/assessments`)
  const supersededRef  = supersedes ? assessmentsCol.doc(supersedes) : null
  const uid            = request.auth.uid
  const actorName      = getActorName(profile, request)

  const saved = await db.runTransaction(async (tx) => {
    const clientSnap = await tx.get(clientRef)
    if (!clientSnap.exists) throw new HttpsError('not-found', 'Paziente non trovato')
    const client = clientSnap.data()

    if (!client.privacyNotice) {
      throw new HttpsError('failed-precondition', 'Informativa non registrata per questo paziente', { reason: PRIVACY_NOTICE_MISSING })
    }

    let supersededVisitId = null
    if (supersededRef) {
      const supersededSnap = await tx.get(supersededRef)
      if (!supersededSnap.exists) throw new HttpsError('not-found', 'Valutazione da correggere non trovata')
      const old = supersededSnap.data()
      if (old.status !== ASSESSMENT_STATUS.VALID) {
        throw new HttpsError('failed-precondition', 'Solo una valutazione valida può essere corretta')
      }
      if (old.testId !== tests[0].testId) {
        throw new HttpsError('invalid-argument', 'La correzione deve riguardare lo stesso test')
      }
      supersededVisitId = old.visitId ?? null
    }

    const values = validateTests(tests, { nowLocal: nowLocal(), birthDate: client.dataNascita ?? null })

    const now     = new Date().toISOString()
    // Solo per generare un id: la visita non ha un documento padre (ADR-009 §1)
    const visitId = supersededVisitId ?? assessmentsCol.doc().id
    const docs = values.map(value => {
      const ref = assessmentsCol.doc()
      const data = {
        ...value,
        visitId,
        examinerId:      uid,
        examinerName:    actorName,
        // Senza data di nascita nessuna stima: l'età salvata alla creazione
        // potrebbe essere vecchia di anni rispetto alla valutazione
        patientAgeYears: patientAgeAt(client.dataNascita, value.performedAt),
        status:          ASSESSMENT_STATUS.VALID,
        supersedes,
        supersededBy:    null,
        createdAt:       now,
        createdBy:       uid,
        voidedAt:        null,
        voidedBy:        null,
        voidedByName:    null,
        voidReason:      null,
      }
      tx.set(ref, data)
      return { id: ref.id, ...data }
    })

    if (supersededRef) {
      tx.update(supersededRef, {
        status:       ASSESSMENT_STATUS.VOIDED,
        voidedAt:     now,
        voidedBy:     uid,
        voidedByName: actorName,
        voidReason:   reason,
        supersededBy: docs[0].id,
      })
    }
    return docs
  })

  if (supersedes) {
    writeAudit(db, request, AUDIT_ASSESSMENT_VOIDED, { orgId, clientId, assessmentId: supersedes, testId: saved[0].testId })
  }

  return { assessments: saved }
})

// ── Helper ────────────────────────────────────────────────────────────────────

/** 1..5 oggetti con un testId testuale, ognuno una sola volta */
function validateVisitShape(tests) {
  if (!Array.isArray(tests) || tests.length === 0 || tests.length > MAX_TESTS_PER_VISIT) {
    throw new HttpsError('invalid-argument', `Una visita contiene da 1 a ${MAX_TESTS_PER_VISIT} test`)
  }
  const isWellFormed = tests.every(test => test && typeof test === 'object' && !Array.isArray(test) && typeof test.testId === 'string')
  if (!isWellFormed) throw new HttpsError('invalid-argument', 'Test non valido')
  if (new Set(tests.map(test => test.testId)).size !== tests.length) {
    throw new HttpsError('invalid-argument', 'Ogni test può comparire una sola volta per visita')
  }
}

/** Valori normalizzati da salvare, o invalid-argument con gli errori per campo */
function validateTests(tests, context) {
  return tests.map(test => {
    const { errors, value } = validateAssessmentInput(test, context)
    if (!value) throw new HttpsError('invalid-argument', Object.values(errors)[0], { fields: errors })
    return value
  })
}
