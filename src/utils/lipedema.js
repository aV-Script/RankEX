// Lipedema Edition — valutazioni e informativa (ADR-009/011/012/015).
// Il blocco "CORE" è speculare a functions/src/shared/lipedema.js (fonte del
// valore salvato): qui serve per l'anteprima e la validazione del form, così
// l'utente vede gli stessi errori e la stessa distanza che il server salverà.
// Coperto dal test di parità in src/__tests__/parity/clientServerParity.test.js:
// se cambi il CORE, aggiorna entrambe le copie e ridistribuisci le functions.
// Dopo il CORE, solo lato client: comparabilità e delta per lo storico (ADR-012
// — calcolati alla lettura da uno snapshot salvato dal server, nessun mirror).
// Funzioni pure, nessuna dipendenza da firebase.

// ── CORE (identico in functions/src/shared/lipedema.js) ──────────────────────

export const LIPEDEMA_TEST_IDS = {
  TWO_MINUTE_WALK: 'lipedema_2mwt',
}

export const ASSESSMENT_STATUS = {
  VALID:  'valid',
  VOIDED: 'voided',
}

export const ASSESSMENT_OUTCOME = {
  COMPLETE:      'complete',
  STOPPED_EARLY: 'stopped_early',
}

// Test 01 — protocollo 1.0 (docx 01, ADR-015 §7)
export const TWO_MINUTE_WALK = {
  protocolVersion:       '1.0',
  durationS:             120,
  standardCourseLengthM: 30,
  maxCourseLengthM:      100,
  maxFullLengths:        1000,
  // Anti-refuso, non un giudizio clinico: oltre 500 m in 2 minuti non si cammina
  maxDistanceM:          500,
  maxPauseCount:         50,
}

export const ASSISTIVE_DEVICES = ['none', 'cane', 'crutch', 'rollator', 'other']

// Catalogo chiuso dei motivi di stop anticipato: i codici sono stabili, le
// etichette stanno in config/lipedemaTests.config.js (client)
export const STOP_REASON_CODES = [
  'chest_pain', 'dyspnea', 'dizziness', 'lower_limb_pain',
  'instability', 'patient_request', 'examiner_decision', 'other',
]

export const PAIN_SCALE = 'nrs_0_10'

// details.reason dell'errore failed-precondition quando manca l'informativa:
// il client lo riconosce senza dipendere dal testo del messaggio
export const PRIVACY_NOTICE_MISSING = 'privacy_notice_missing'

// Intervalli solo anti-refuso: nessuna soglia di stop o di idoneità (docx 01 §19-20)
const PAIN_RANGE = { min: 0,  max: 10,  step: 1 }
const BORG_RANGE = { min: 0,  max: 10,  step: 0.5 }
const HR_RANGE   = { min: 30, max: 250, step: 1 }
const SPO2_RANGE = { min: 50, max: 100, step: 1 }
const SYS_RANGE  = { min: 60, max: 260, step: 1 }
const DIA_RANGE  = { min: 30, max: 160, step: 1 }

export const CLINICAL_RANGES = {
  painPre:     PAIN_RANGE, painPost:    PAIN_RANGE,
  dyspneaPre:  BORG_RANGE, dyspneaPost: BORG_RANGE,
  fatiguePre:  BORG_RANGE, fatiguePost: BORG_RANGE,
  hrPreBpm:    HR_RANGE,   hrPostBpm:   HR_RANGE,
  spo2PrePct:  SPO2_RANGE, spo2PostPct: SPO2_RANGE,
  bpSysPre:    SYS_RANGE,  bpDiaPre:    DIA_RANGE,
  bpSysPost:   SYS_RANGE,  bpDiaPost:   DIA_RANGE,
}

export const TEXT_LIMITS = {
  notes:               1000,
  deviationNote:       1000,
  conditionsNote:      1000,
  assistiveDeviceNote: 200,
  stopReasonNote:      500,
  voidReason:          500,
  informativaVersion:  40,
}

export const MAX_TESTS_PER_VISIT = 5

// Tolleranza sull'orologio del dispositivo rispetto al server
const FUTURE_TOLERANCE_MIN = 5
const MIN_YEAR             = 2000
const MS_PER_MINUTE        = 60000

const DATE_TIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
const DATE_RE      = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Le valutazioni e la BIA richiedono l'informativa registrata solo nei moduli in
 * cui ogni dato è sanitario (lipedema, ADR-015 §1).
 * @param {object} capabilities — getModule / resolveModuleCapabilities
 */
export function requiresPrivacyNotice(capabilities) {
  return capabilities?.hasAssessments === true
}

/**
 * Distanza del 2MWT dai tratti cono→cono: tratti × lunghezza + frazione,
 * arrotondata al metro più vicino (docx 01 §11/§16). Calcolo in decimi di metro:
 * gli input hanno al massimo un decimale, così 107,5 non diventa 107,4999.
 */
export function computeTwoMinuteWalkResult({ courseLengthM, fullLengths, partialDistanceM, durationS }) {
  const tenths     = fullLengths * Math.round(courseLengthM * 10) + Math.round(partialDistanceM * 10)
  const distanceM  = Math.round(tenths / 10)
  const avgSpeedMs = Math.round((distanceM / durationS) * 100) / 100
  return { distanceM, avgSpeedMs, durationS }
}

/**
 * Valida l'input di una valutazione e ne restituisce la forma normalizzata da
 * salvare (senza i campi che imposta solo il server: id, esaminatore, date).
 * @param {object} input
 * @param {{ nowLocal: string, birthDate?: string|null }} context —
 *   nowLocal 'YYYY-MM-DDTHH:mm' nell'ora locale dello studio
 * @returns {{ errors: Object<string,string>, value: object|null }}
 */
export function validateAssessmentInput(input, context) {
  const validator = ASSESSMENT_VALIDATORS[input?.testId]
  if (!validator) return { errors: { testId: 'Test non supportato' }, value: null }
  return validator(input, context)
}

/**
 * Registrazione dell'informativa consegnata (ADR-015 §1).
 * @param {{ informativaVersion, deliveredAt }} input
 * @param {{ today: string, birthDate?: string|null }} context — today 'YYYY-MM-DD'
 */
export function validatePrivacyNoticeInput(input, context) {
  const errors = {}
  const fail   = makeFail(errors)
  const src    = asObject(input)

  const informativaVersion = readText(src.informativaVersion, TEXT_LIMITS.informativaVersion, 'informativaVersion', fail)
  if (!informativaVersion && !errors.informativaVersion) {
    fail('informativaVersion', "Inserisci la versione dell'informativa")
  }

  const deliveredAt = src.deliveredAt
  const delivered   = parseDate(deliveredAt)
  if (!delivered) {
    fail('deliveredAt', 'Inserisci la data di consegna')
  } else if (delivered.getUTCFullYear() < MIN_YEAR) {
    fail('deliveredAt', 'Data di consegna non valida')
  } else if (deliveredAt > context.today) {
    fail('deliveredAt', 'La data non può essere futura')
  } else if (context.birthDate && deliveredAt < context.birthDate) {
    fail('deliveredAt', 'La data non può precedere la data di nascita')
  }

  return hasErrors(errors)
    ? { errors, value: null }
    : { errors, value: { informativaVersion, deliveredAt } }
}

/** Motivo di annullamento: obbligatorio, max 500 caratteri (ADR-011) */
export function validateVoidReason(reason) {
  const errors = {}
  const value  = readText(reason, TEXT_LIMITS.voidReason, 'voidReason', makeFail(errors))
  if (errors.voidReason) return { error: errors.voidReason, value: null }
  if (!value) return { error: "Inserisci il motivo dell'annullamento", value: null }
  return { error: null, value }
}

/** Età in anni compiuti alla data della valutazione, o null senza data di nascita */
export function patientAgeAt(birthDate, performedAt) {
  const birth = parseDate(birthDate)
  if (!birth || typeof performedAt !== 'string') return null
  const [year, month, day] = performedAt.slice(0, 10).split('-').map(Number)
  let age = year - birth.getUTCFullYear()
  if (month < birth.getUTCMonth() + 1 || (month === birth.getUTCMonth() + 1 && day < birth.getUTCDate())) age -= 1
  return age
}

/**
 * Data e ora locali 'YYYY-MM-DDTHH:mm'. timeZone assente = ora del dispositivo
 * (client); il server passa 'Europe/Rome'.
 */
export function formatLocalDateTime(date, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).map(part => [part.type, part.value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

// ── Validatori per test ───────────────────────────────────────────────────────

function validateTwoMinuteWalk(input, context) {
  const errors = {}
  const fail   = makeFail(errors)
  const src        = asObject(input)
  const setup      = asObject(src.setup)
  const trial      = asObject(src.trial)
  const events     = asObject(src.events)
  const clinicalIn = asObject(src.clinical)
  const deviation  = asObject(src.deviation)

  const performedAt = readPerformedAt(src.performedAt, context, fail)

  // Setup
  const courseLengthM = setup.courseLengthM
  let isCourseValid = false
  if (!isFiniteNumber(courseLengthM) || courseLengthM <= 0) {
    fail('setup.courseLengthM', 'La lunghezza del percorso deve essere maggiore di 0')
  } else if (courseLengthM > TWO_MINUTE_WALK.maxCourseLengthM) {
    fail('setup.courseLengthM', `La lunghezza del percorso non può superare ${TWO_MINUTE_WALK.maxCourseLengthM} m`)
  } else if (!hasMaxDecimals(courseLengthM, 1)) {
    fail('setup.courseLengthM', 'Inserisci la lunghezza con al massimo un decimale')
  } else {
    isCourseValid = true
  }
  const isStandardCourse = courseLengthM === TWO_MINUTE_WALK.standardCourseLengthM
  if (isCourseValid && !isStandardCourse && setup.variantConfirmed !== true) {
    fail('setup.variantConfirmed', 'Conferma la variante di percorso')
  }

  const assistiveDevice = setup.assistiveDevice
  if (!ASSISTIVE_DEVICES.includes(assistiveDevice)) fail('setup.assistiveDevice', "Seleziona l'ausilio")
  const deviceNote = readText(setup.assistiveDeviceNote, TEXT_LIMITS.assistiveDeviceNote, 'setup.assistiveDeviceNote', fail)
  if (assistiveDevice === 'other' && !deviceNote) fail('setup.assistiveDeviceNote', "Descrivi l'ausilio")

  // Stop anticipato: un test interrotto non è mai trattato come completo
  const stoppedEarly = events.stoppedEarly
  if (typeof stoppedEarly !== 'boolean') fail('events.stoppedEarly', 'Indica se la prova è stata interrotta')
  const maxStopTimeS = TWO_MINUTE_WALK.durationS - 1
  let stopTimeS = null
  if (stoppedEarly === true) {
    if (!isIntegerInRange(events.stopTimeS, 1, maxStopTimeS)) {
      fail('events.stopTimeS', `Inserisci il tempo raggiunto (1–${maxStopTimeS} s)`)
    } else {
      stopTimeS = events.stopTimeS
    }
  }
  const durationS = stopTimeS ?? TWO_MINUTE_WALK.durationS

  let stopReasonCode = null
  let stopReasonNote = null
  if (stoppedEarly === true) {
    stopReasonCode = clinicalIn.stopReasonCode
    if (!STOP_REASON_CODES.includes(stopReasonCode)) {
      fail('clinical.stopReasonCode', "Seleziona il motivo dell'interruzione")
      stopReasonCode = null
    }
    stopReasonNote = readText(clinicalIn.stopReasonNote, TEXT_LIMITS.stopReasonNote, 'clinical.stopReasonNote', fail)
    if (stopReasonCode === 'other' && !stopReasonNote) fail('clinical.stopReasonNote', 'Descrivi il motivo')
  }

  // Prova: tratti cono→cono + frazione finale (ADR-015 §7)
  const fullLengths = trial.fullLengths
  if (!isIntegerInRange(fullLengths, 0, TWO_MINUTE_WALK.maxFullLengths)) {
    fail('trial.fullLengths', 'Inserisci un numero intero di tratti (0 o più)')
  }
  const partialDistanceM = trial.partialDistanceM
  if (!isFiniteNumber(partialDistanceM) || partialDistanceM < 0) {
    fail('trial.partialDistanceM', 'Inserisci la frazione finale (0 o più)')
  } else if (!hasMaxDecimals(partialDistanceM, 1)) {
    fail('trial.partialDistanceM', 'Inserisci la frazione con al massimo un decimale')
  } else if (isCourseValid && partialDistanceM >= courseLengthM) {
    fail('trial.partialDistanceM', `La frazione deve essere inferiore a ${formatDecimal(courseLengthM)} m: altrimenti è un tratto completo`)
  }

  let result = null
  if (isCourseValid && !errors['trial.fullLengths'] && !errors['trial.partialDistanceM'] && !errors['events.stopTimeS']) {
    result = computeTwoMinuteWalkResult({ courseLengthM, fullLengths, partialDistanceM, durationS })
    if (result.distanceM > TWO_MINUTE_WALK.maxDistanceM) {
      fail('trial.fullLengths', `Distanza non plausibile per un test di cammino (oltre ${TWO_MINUTE_WALK.maxDistanceM} m)`)
    }
  }

  // Pause: il cronometro ufficiale non si ferma
  const pauseCount = events.pauseCount
  let pauseDurationS = 0
  if (!isIntegerInRange(pauseCount, 0, TWO_MINUTE_WALK.maxPauseCount)) {
    fail('events.pauseCount', 'Inserisci il numero di pause (0 o più)')
  } else if (pauseCount > 0) {
    if (!isIntegerInRange(events.pauseDurationS, 1, durationS)) {
      fail('events.pauseDurationS', `Inserisci la durata totale delle pause (1–${durationS} s)`)
    } else {
      pauseDurationS = events.pauseDurationS
    }
  }

  const clinical = readClinical(clinicalIn, fail)
  const conditionsNote = readText(clinicalIn.conditionsNote, TEXT_LIMITS.conditionsNote, 'clinical.conditionsNote', fail)

  // Deviazione dal protocollo: sì/no + descrizione (tutti i docx)
  const deviationPresent = deviation.present
  if (typeof deviationPresent !== 'boolean') fail('deviation.present', 'Indica se ci sono state deviazioni dal protocollo')
  const deviationNote = readText(deviation.note, TEXT_LIMITS.deviationNote, 'deviation.note', fail)
  if (deviationPresent === true && !deviationNote) fail('deviation.note', 'Descrivi la deviazione')

  const notes = readText(src.notes, TEXT_LIMITS.notes, 'notes', fail)

  if (hasErrors(errors)) return { errors, value: null }

  const { protocolVersion } = TWO_MINUTE_WALK
  return {
    errors,
    value: {
      testId:   LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK,
      protocolVersion,
      performedAt,
      outcome:  stoppedEarly ? ASSESSMENT_OUTCOME.STOPPED_EARLY : ASSESSMENT_OUTCOME.COMPLETE,
      setup: {
        courseLengthM,
        isStandardCourse,
        assistiveDevice,
        assistiveDeviceNote: assistiveDevice === 'other' ? deviceNote : null,
      },
      trials: [{ seq: 1, side: null, valid: true, fullLengths, partialDistanceM, value: result.distanceM }],
      events: { pauseCount, pauseDurationS, stopTimeS },
      result,
      comparability: { protocolVersion, courseLengthM, assistiveDevice },
      clinical: { painScale: PAIN_SCALE, ...clinical, stopReasonCode, stopReasonNote, conditionsNote },
      deviation: { present: deviationPresent, note: deviationPresent ? deviationNote : null },
      notes,
    },
  }
}

const ASSESSMENT_VALIDATORS = {
  [LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK]: validateTwoMinuteWalk,
}

// ── Helper ────────────────────────────────────────────────────────────────────

function readPerformedAt(value, context, fail) {
  const parsed = parseDateTime(value)
  if (!parsed || parsed.getUTCFullYear() < MIN_YEAR) {
    fail('performedAt', 'Inserisci data e ora della valutazione')
    return null
  }
  const now = parseDateTime(context.nowLocal)
  if (now && parsed.getTime() > now.getTime() + FUTURE_TOLERANCE_MIN * MS_PER_MINUTE) {
    fail('performedAt', 'La data non può essere futura')
  } else if (context.birthDate && value.slice(0, 10) < context.birthDate) {
    fail('performedAt', 'La data non può precedere la data di nascita')
  }
  return value
}

/** Parametri clinici pre/post: tutti facoltativi, null se assenti */
function readClinical(src, fail) {
  const clinical = {}
  for (const [key, range] of Object.entries(CLINICAL_RANGES)) {
    const value = src[key]
    if (value === undefined || value === null) {
      clinical[key] = null
    } else if (!isFiniteNumber(value) || value < range.min || value > range.max || !isMultipleOf(value, range.step)) {
      fail(`clinical.${key}`, `Valore non valido (${formatDecimal(range.min)}–${formatDecimal(range.max)}${range.step < 1 ? `, passo ${formatDecimal(range.step)}` : ''})`)
      clinical[key] = null
    } else {
      clinical[key] = value
    }
  }
  for (const moment of ['Pre', 'Post']) {
    const sysKey = `bpSys${moment}`
    const diaKey = `bpDia${moment}`
    const hasSys = src[sysKey] !== undefined && src[sysKey] !== null
    const hasDia = src[diaKey] !== undefined && src[diaKey] !== null
    const sys = clinical[sysKey]
    const dia = clinical[diaKey]
    if (hasSys !== hasDia) {
      fail(hasSys ? `clinical.${diaKey}` : `clinical.${sysKey}`, 'Inserisci sia la sistolica sia la diastolica')
    } else if (sys !== null && dia !== null && sys <= dia) {
      fail(`clinical.${sysKey}`, 'La sistolica deve essere maggiore della diastolica')
    }
  }
  return clinical
}

/** Testo facoltativo: senza spazi ai bordi, null se vuoto */
function readText(value, maxLength, field, fail) {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') {
    fail(field, 'Deve essere un testo')
    return null
  }
  const text = value.trim()
  if (text.length > maxLength) {
    fail(field, `Massimo ${maxLength} caratteri`)
    return null
  }
  return text || null
}

function parseDateTime(value) {
  const match = typeof value === 'string' ? DATE_TIME_RE.exec(value) : null
  if (!match) return null
  const [, y, mo, d, h, mi] = match.map(Number)
  const date = new Date(Date.UTC(y, mo - 1, d, h, mi))
  const isSame = date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d &&
    date.getUTCHours() === h && date.getUTCMinutes() === mi
  return isSame ? date : null
}

function parseDate(value) {
  const match = typeof value === 'string' ? DATE_RE.exec(value) : null
  if (!match) return null
  const [, y, mo, d] = match.map(Number)
  const date = new Date(Date.UTC(y, mo - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d ? date : null
}

function makeFail(errors) {
  return (field, message) => { if (!errors[field]) errors[field] = message }
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function hasErrors(errors) {
  return Object.keys(errors).length > 0
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function isIntegerInRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max
}

function hasMaxDecimals(value, decimals) {
  const scaled = value * 10 ** decimals
  return Math.abs(scaled - Math.round(scaled)) < 1e-9
}

function isMultipleOf(value, step) {
  const ratio = value / step
  return Math.abs(ratio - Math.round(ratio)) < 1e-9
}

function formatDecimal(value) {
  return String(value).replace('.', ',')
}

// ── Fine CORE ─────────────────────────────────────────────────────────────────

// ── Solo client: storico, comparabilità e delta (ADR-012) ────────────────────

// Fuso degli studi: stesso valore di functions/src/shared/actor.js (test di
// parità). Default, "adesso" e "non futura" si calcolano qui come sul server,
// anche se il dispositivo ha un altro fuso.
export const LOCAL_TIME_ZONE = 'Europe/Rome'

/** Data/ora locale dello studio, 'YYYY-MM-DDTHH:mm' */
export function nowLocalDateTime() {
  return formatLocalDateTime(new Date(), LOCAL_TIME_ZONE)
}

/** Data locale dello studio, 'YYYY-MM-DD' */
export function todayLocalDate() {
  return nowLocalDateTime().slice(0, 10)
}

// Campi di una valutazione che vengono dall'input (validateAssessmentInput):
// gli altri (id, esaminatore, stato, date) li scrive il server
const ASSESSMENT_INPUT_KEYS = [
  'testId', 'protocolVersion', 'performedAt', 'outcome', 'setup', 'trials',
  'events', 'result', 'comparability', 'clinical', 'deviation', 'notes',
]

/**
 * Una correzione identica all'originale non corregge nulla (ADR-011): confronto
 * profondo, indipendente dall'ordine delle chiavi (Firestore non lo conserva).
 * @param {object} value      — validateAssessmentInput(...).value
 * @param {object} assessment — documento salvato
 */
export function isSameAssessmentData(value, assessment) {
  return ASSESSMENT_INPUT_KEYS.every(key => isDeepEqual(value?.[key] ?? null, assessment?.[key] ?? null))
}

// Parametri che, se diversi, rendono due valutazioni dello stesso test non
// confrontabili. `reason` è la chiave dell'etichetta in lipedemaTests.config.js.
export const COMPARABILITY_RULES = {
  [LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK]: [
    { key: 'protocolVersion', reason: 'protocol' },
    { key: 'courseLengthM',   reason: 'course' },
    { key: 'assistiveDevice', reason: 'device' },
  ],
}

// Valore primario di ogni test, già arrotondato alla precisione mostrata: il
// delta si calcola su questo, così è coerente con i due numeri a schermo
const PRIMARY_RESULT_KEY = {
  [LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK]: 'distanceM',
}

export function isValidAssessment(assessment) {
  return assessment?.status === ASSESSMENT_STATUS.VALID
}

export function getPrimaryResult(assessment) {
  return assessment?.result?.[PRIMARY_RESULT_KEY[assessment.testId]] ?? null
}

/**
 * Motivi di non comparabilità tra due valutazioni dello stesso test, dagli
 * snapshot `comparability` scritti dal server.
 * @returns {string[]} es. ['course', 'device'] — vuoto se confrontabili
 */
export function getComparabilityIssues(current, reference) {
  const rules = COMPARABILITY_RULES[current?.testId] ?? []
  const a = current?.comparability ?? {}
  const b = reference?.comparability ?? {}
  return rules.filter(rule => a[rule.key] !== b[rule.key]).map(rule => rule.reason)
}

/**
 * Storico di un test dalla più recente. Per ogni valutazione valida:
 * - `nonComparable`: motivi se la precedente valida immediata non è confrontabile
 * - `delta`: differenza con la precedente valida E confrontabile (`reference`)
 * - `deltaUnavailable: 'stopped_early'` se uno dei due estremi è interrotto
 * Le annullate restano nello storico ma non entrano in nessun confronto (ADR-011).
 * @param {object[]} assessments
 * @param {string}   testId
 */
export function buildTestHistory(assessments, testId) {
  const ofTest = assessments.filter(assessment => assessment.testId === testId).sort(byMostRecent)
  const valid  = ofTest.filter(isValidAssessment)

  return ofTest.map(assessment => {
    const entry = { assessment, nonComparable: null, reference: null, delta: null, deltaUnavailable: null }
    if (!isValidAssessment(assessment)) return entry

    const older = valid.slice(valid.indexOf(assessment) + 1)
    if (older.length === 0) return entry

    const immediateIssues = getComparabilityIssues(assessment, older[0])
    if (immediateIssues.length > 0) entry.nonComparable = immediateIssues

    const reference = older.find(candidate => getComparabilityIssues(assessment, candidate).length === 0)
    if (!reference) return entry
    entry.reference = reference

    const isStopped = [assessment, reference].some(item => item.outcome === ASSESSMENT_OUTCOME.STOPPED_EARLY)
    if (isStopped) {
      entry.deltaUnavailable = ASSESSMENT_OUTCOME.STOPPED_EARLY
      return entry
    }
    entry.delta = getPrimaryResult(assessment) - getPrimaryResult(reference)
    return entry
  })
}

/** Ultima valutazione valida per ciascun test: { [testId]: assessment } */
export function getLatestValidByTest(assessments) {
  const latest = {}
  for (const assessment of [...assessments].sort(byMostRecent)) {
    if (isValidAssessment(assessment) && !latest[assessment.testId]) latest[assessment.testId] = assessment
  }
  return latest
}

function isDeepEqual(a, b) {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  return keysA.length === keysB.length && keysA.every(key => Object.hasOwn(b, key) && isDeepEqual(a[key], b[key]))
}

function byMostRecent(a, b) {
  if (a.performedAt !== b.performedAt) return a.performedAt < b.performedAt ? 1 : -1
  const createdA = a.createdAt ?? ''
  const createdB = b.createdAt ?? ''
  if (createdA === createdB) return 0
  return createdA < createdB ? 1 : -1
}

/** Errore di una callable rifiutata perché manca l'informativa del paziente */
export function isPrivacyNoticeMissingError(err) {
  return err?.code === 'functions/failed-precondition' && err?.details?.reason === PRIVACY_NOTICE_MISSING
}
