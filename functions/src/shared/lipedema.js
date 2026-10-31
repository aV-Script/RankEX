// Lipedema Edition — valutazioni e informativa (ADR-009/011/012/015/016).
// Copia speculare del blocco "CORE" di src/utils/lipedema.js: functions/ non può
// importare da src/. Il client mostra l'anteprima, il server decide il valore
// salvato: stesse validazioni e stesso arrotondamento da entrambi i lati, coperti
// dal test di parità in src/__tests__/parity/clientServerParity.test.js.
// Se cambi qualcosa qui, aggiorna anche src/utils/lipedema.js e ridistribuisci
// le functions. Funzioni pure, nessuna dipendenza da firebase.

// ── CORE (identico in src/utils/lipedema.js) ─────────────────────────────────

export const LIPEDEMA_TEST_IDS = {
  TWO_MINUTE_WALK:  'lipedema_2mwt',
  SIT_TO_STAND_30S: 'lipedema_30s_sts',
  HANDGRIP:         'lipedema_handgrip',
}

export const ASSESSMENT_STATUS = {
  VALID:  'valid',
  VOIDED: 'voided',
}

export const ASSESSMENT_OUTCOME = {
  COMPLETE:      'complete',
  STOPPED_EARLY: 'stopped_early',
  // 30s-STS con uso delle braccia: 0 ripetizioni per regola, distinto da uno 0
  // reale solo da qui, mai dal numero (ADR-016 §6)
  INVALIDATED:   'invalidated',
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

// Test 02 — protocollo 1.0 (docx 02, ADR-016 §6). Limiti solo anti-refuso
export const SIT_TO_STAND_30S = {
  protocolVersion:       '1.0',
  durationS:             30,
  standardChairHeightCm: 43.2,
  chairToleranceCm:      0.5,
  minChairHeightCm:      30,
  maxChairHeightCm:      70,
  maxRepetitions:        60,
  maxPauseCount:         10,
}

// Test 03 — protocollo 1.0 (docx 03, ADR-016 §1). HHD e OLS saranno altre
// specifiche con la stessa forma, lette dalla stessa logica bilaterale
// (readBilateralTrials + computeBilateralResult)
export const HANDGRIP = {
  protocolVersion:    '1.0',
  sides:              ['R', 'L'],      // ordine guidato: si parte da destra
  validTrialsPerSide: 3,
  maxInvalidPerSide:  3,               // prove non valide ammesse oltre le valide
  canonicalUnit:      'N',
  unitFactors:        { N: 1, kgf: 9.80665 },
  inputDecimals:      2,
  maxValue:           1000,            // in unità canonica, solo anti-refuso
  ceiling:            null,
  // Motivi di prova non valida ammessi (sottoinsieme di INVALID_TRIAL_REASONS):
  // appoggio/assistenza è dell'OLS, non della presa
  invalidReasons:     ['technique_error', 'timing_error', 'external_interruption', 'device_error', 'other'],
}

export const ASSISTIVE_DEVICES = ['none', 'cane', 'crutch', 'rollator', 'other']

// Catalogo chiuso dei motivi di stop anticipato: i codici sono stabili, le
// etichette stanno in config/lipedemaTests.config.js (client)
export const STOP_REASON_CODES = [
  'chest_pain', 'dyspnea', 'dizziness', 'lower_limb_pain',
  'instability', 'patient_request', 'examiner_decision', 'other',
]

// Interruzione dei test bilaterali (docx 03 §19, 04 §19, 05 §20): separato da
// STOP_REASON_CODES (2MWT/STS, motivi cardiorespiratori), che non si allarga
export const LIMB_STOP_REASON_CODES = [
  'acute_pain', 'neurological_symptoms', 'dizziness', 'loss_of_control',
  'instability', 'contraindication', 'patient_request', 'examiner_decision', 'other',
]

// Motivi di una prova bilaterale non valida: catalogo chiuso, così il controllo
// qualità può contarli (docx 05 §23). 'other' richiede la nota della prova
export const INVALID_TRIAL_REASONS = [
  'technique_error', 'timing_error', 'support_or_assistance',
  'external_interruption', 'device_error', 'other',
]

// Lato dominante (mano per il 03, gamba per 04/05): dato della valutazione
export const DOMINANT_SIDES = ['R', 'L', 'both']

export const BILATERAL_SIDE_STATUS = {
  COMPLETE:   'complete',
  INCOMPLETE: 'incomplete',
  NOT_TESTED: 'not_tested',
}

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
  technicalErrorNote:  500,
  usedArmsNote:        500,
  trialNote:           200,
  deviceField:         60,
  gripSetting:         40,
}

export const MAX_TESTS_PER_VISIT = 5

// Parametri clinici ammessi per test: le chiavi non previste sono ignorate,
// non salvate come null (ADR-016 §6). Niente FC/SpO₂/PA nel 30s-STS
const ALL_CLINICAL_KEYS          = Object.keys(CLINICAL_RANGES)
const SIT_TO_STAND_CLINICAL_KEYS = ['painPre', 'painPost', 'dyspneaPre', 'dyspneaPost', 'fatiguePre', 'fatiguePost']
const NO_CLINICAL_KEYS           = []

// Il 30s-STS si esegue senza ausili (docx 02 §5): non è un input
const STS_ASSISTIVE_DEVICE   = 'none'
const TENTHS                 = 10
const STS_USED_ARMS_REASON   = 'used_arms'
const SIDE_NAMES             = { R: 'destro', L: 'sinistro' }
const TRIAL_VALID_FIELD_RE   = /^trials\.\d+\.valid$/

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
 * Score del 30s-STS: alzate complete + l'eventuale parziale finale (docx 02
 * §11/§16), contata dal server così non si conta due volte. Con l'uso delle
 * braccia il protocollo non si applica: 0 per regola, durata null.
 */
export function computeSitToStandResult({ completeRepetitions, partialRepCounted, usedArms, stopTimeS }) {
  if (usedArms) return { repetitions: 0, durationS: null }
  return {
    repetitions: completeRepetitions + (partialRepCounted ? 1 : 0),
    durationS:   stopTimeS ?? SIT_TO_STAND_30S.durationS,
  }
}

/**
 * Sedia del 30s-STS entro ±0,5 cm dall'altezza standard. In decimi di cm:
 * 43,7 − 43,2 non diventa 0,5000000001.
 */
export function isStandardChairHeight(heightCm) {
  const { standardChairHeightCm, chairToleranceCm } = SIT_TO_STAND_30S
  return Math.abs(Math.round(heightCm * TENTHS) - Math.round(standardChairHeightCm * TENTHS)) <= Math.round(chairToleranceCm * TENTHS)
}

/** Chiave di confronto (dispositivo, impugnatura): senza spazi ai bordi e senza maiuscole */
export function normalizeKey(text) {
  return (text ?? '').trim().toLowerCase()
}

/**
 * Derivati di un test bilaterale dalle prove (ADR-016 §2-3), per qualunque
 * specifica (Handgrip, HHD, OLS). Best = massimo delle valide, solo con il lato
 * completo (esattamente `validTrialsPerSide` valide): un best di 2 prove
 * confrontato con uno di 3 sembrerebbe un calo che non c'è. Nessun
 * arrotondamento (ADR-012): si arrotonda solo a schermo.
 * @param {object[]} trials — prove normalizzate ({ side, valid, value })
 * @param {object}   spec   — es. HANDGRIP
 */
export function computeBilateralResult(trials, spec) {
  const validCountBySide = {}
  const sideStatus       = {}
  const bestBySide       = {}
  for (const side of spec.sides) {
    const ofSide = trials.filter(trial => trial.side === side)
    const values = ofSide.filter(trial => trial.valid === true && isFiniteNumber(trial.value)).map(trial => trial.value)
    validCountBySide[side] = values.length
    if (values.length === spec.validTrialsPerSide) sideStatus[side] = BILATERAL_SIDE_STATUS.COMPLETE
    else if (ofSide.length === 0) sideStatus[side] = BILATERAL_SIDE_STATUS.NOT_TESTED
    else sideStatus[side] = BILATERAL_SIDE_STATUS.INCOMPLETE
    bestBySide[side] = sideStatus[side] === BILATERAL_SIDE_STATUS.COMPLETE ? Math.max(...values) : null
  }

  const bests          = spec.sides.map(side => bestBySide[side])
  const hasAllSides    = bests.every(best => best !== null)
  const strongestValue = hasAllSides ? Math.max(...bests) : null
  const weakestValue   = hasAllSides ? Math.min(...bests) : null
  // A pari valore nessun lato è "il più forte"
  const strongestSide  = hasAllSides && strongestValue !== weakestValue
    ? spec.sides.find(side => bestBySide[side] === strongestValue)
    : null

  const result = {
    unit: spec.canonicalUnit,
    validCountBySide,
    sideStatus,
    bestBySide,
    strongestSide,
    strongestValue,
    weakestValue,
    symmetryPct: hasAllSides ? (weakestValue / strongestValue) * 100 : null,
  }
  if (hasCeiling(spec)) {
    result.ceilingBySide = Object.fromEntries(spec.sides.map(side => [
      side, bestBySide[side] === null ? null : bestBySide[side] === spec.ceiling,
    ]))
  }
  return result
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
  const { stoppedEarly, stopTimeS } = readTimedStop(events, TWO_MINUTE_WALK.durationS, fail)
  const durationS = stopTimeS ?? TWO_MINUTE_WALK.durationS
  const { stopReasonCode, stopReasonNote } = stoppedEarly === true
    ? readStopReason(clinicalIn, STOP_REASON_CODES, fail)
    : { stopReasonCode: null, stopReasonNote: null }

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
  const { pauseCount, pauseDurationS } = readPauses(events, TWO_MINUTE_WALK.maxPauseCount, durationS, fail)

  const clinical = readClinical(clinicalIn, fail, ALL_CLINICAL_KEYS)
  const conditionsNote = readText(clinicalIn.conditionsNote, TEXT_LIMITS.conditionsNote, 'clinical.conditionsNote', fail)
  const deviation = readDeviation(src.deviation, fail)
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
      deviation,
      notes,
    },
  }
}

function validateSitToStand30s(input, context) {
  const errors = {}
  const fail   = makeFail(errors)
  const src        = asObject(input)
  const setup      = asObject(src.setup)
  const trial      = asObject(src.trial)
  const events     = asObject(src.events)
  const clinicalIn = asObject(src.clinical)
  const spec       = SIT_TO_STAND_30S

  const performedAt = readPerformedAt(src.performedAt, context, fail)

  // Setup sedia: altezza standard ±0,5 cm, altrimenti variante confermata
  const chairHeightCm = setup.chairHeightCm
  let isChairValid = false
  if (!isFiniteNumber(chairHeightCm) || chairHeightCm < spec.minChairHeightCm || chairHeightCm > spec.maxChairHeightCm) {
    fail('setup.chairHeightCm', `Inserisci l'altezza della sedia (${spec.minChairHeightCm}–${spec.maxChairHeightCm} cm)`)
  } else if (!hasMaxDecimals(chairHeightCm, 1)) {
    fail('setup.chairHeightCm', "Inserisci l'altezza con al massimo un decimale")
  } else {
    isChairValid = true
  }
  const isStandardChair = isChairValid && isStandardChairHeight(chairHeightCm)
  if (isChairValid && !isStandardChair && setup.variantConfirmed !== true) {
    fail('setup.variantConfirmed', "Conferma l'altezza della sedia")
  }
  const chairHasArmrests = setup.chairHasArmrests
  if (typeof chairHasArmrests !== 'boolean') fail('setup.chairHasArmrests', 'Indica se la sedia ha i braccioli')
  const armsCrossed = setup.armsCrossed
  if (typeof armsCrossed !== 'boolean') fail('setup.armsCrossed', 'Indica se le braccia erano incrociate sul torace')

  // Uso delle braccia: motivo tecnico che invalida, non un sintomo (docx 02 §19)
  const usedArms = events.usedArms
  if (typeof usedArms !== 'boolean') fail('events.usedArms', 'Indica se ha usato le braccia per alzarsi')
  const usedArmsNote = usedArms === true
    ? readText(events.usedArmsNote, TEXT_LIMITS.usedArmsNote, 'events.usedArmsNote', fail)
    : null

  const { stoppedEarly, stopTimeS } = readTimedStop(events, spec.durationS, fail)
  if (usedArms === true && stoppedEarly === true) {
    fail('events.usedArms', 'Uso delle braccia e interruzione non vanno insieme: un sintomo concomitante va nelle condizioni concomitanti')
  }
  const { stopReasonCode, stopReasonNote } = stoppedEarly === true
    ? readStopReason(clinicalIn, STOP_REASON_CODES, fail)
    : { stopReasonCode: null, stopReasonNote: null }

  // Prova: alzate complete + flag della parziale finale (ADR-016 §6). Con l'uso
  // delle braccia le alzate fatte prima sono un dato grezzo facoltativo
  const completeRepetitions = trial.completeRepetitions
  const hasRepetitions = completeRepetitions !== undefined && completeRepetitions !== null
  if ((usedArms !== true || hasRepetitions) && !isIntegerInRange(completeRepetitions, 0, spec.maxRepetitions)) {
    fail('trial.completeRepetitions', `Inserisci le alzate complete (0–${spec.maxRepetitions})`)
  }
  const partialRepCounted = trial.partialRepCounted
  if (typeof partialRepCounted !== 'boolean') {
    fail('trial.partialRepCounted', 'Indica se la ripetizione parziale finale conta')
  } else if (partialRepCounted && (stoppedEarly === true || usedArms === true)) {
    fail('trial.partialRepCounted', `La ripetizione parziale conta solo se la prova arriva ai ${spec.durationS} s`)
  }

  let result = null
  if (typeof usedArms === 'boolean' && typeof partialRepCounted === 'boolean' &&
      !errors['trial.completeRepetitions'] && !errors['events.stopTimeS']) {
    result = computeSitToStandResult({ completeRepetitions, partialRepCounted, usedArms, stopTimeS })
    if (result.repetitions > spec.maxRepetitions) {
      fail('trial.completeRepetitions', `Ripetizioni non plausibili (oltre ${spec.maxRepetitions})`)
    }
  }

  // Errore tecnico: distinto da deviazione e note, non cambia l'esito
  const technicalError = events.technicalError
  if (typeof technicalError !== 'boolean') fail('events.technicalError', 'Indica se ci sono stati errori tecnici')
  const technicalErrorNote = readText(events.technicalErrorNote, TEXT_LIMITS.technicalErrorNote, 'events.technicalErrorNote', fail)
  if (technicalError === true && !technicalErrorNote) fail('events.technicalErrorNote', "Descrivi l'errore tecnico")

  const familiarizationDone = events.familiarizationDone
  if (typeof familiarizationDone !== 'boolean') fail('events.familiarizationDone', 'Indica se è stata eseguita la familiarizzazione')

  const { pauseCount, pauseDurationS } = readPauses(events, spec.maxPauseCount, stopTimeS ?? spec.durationS, fail)

  const clinical = readClinical(clinicalIn, fail, SIT_TO_STAND_CLINICAL_KEYS)
  const conditionsNote = readText(clinicalIn.conditionsNote, TEXT_LIMITS.conditionsNote, 'clinical.conditionsNote', fail)
  const deviation = readDeviation(src.deviation, fail)
  // Braccioli o braccia libere: fuori protocollo, la deviazione va descritta
  // da chi l'ha vista (il server non la scrive da solo)
  if ((chairHasArmrests === true || armsCrossed === false) && deviation.present === false) {
    fail('deviation.present', 'Sedia con braccioli o braccia non incrociate: registra la deviazione dal protocollo')
  }
  const notes = readText(src.notes, TEXT_LIMITS.notes, 'notes', fail)

  if (hasErrors(errors)) return { errors, value: null }

  let outcome = ASSESSMENT_OUTCOME.COMPLETE
  if (usedArms) outcome = ASSESSMENT_OUTCOME.INVALIDATED
  else if (stoppedEarly) outcome = ASSESSMENT_OUTCOME.STOPPED_EARLY

  const { protocolVersion } = spec
  return {
    errors,
    value: {
      testId: LIPEDEMA_TEST_IDS.SIT_TO_STAND_30S,
      protocolVersion,
      performedAt,
      outcome,
      setup: { chairHeightCm, isStandardChair, chairHasArmrests, armsCrossed, assistiveDevice: STS_ASSISTIVE_DEVICE },
      trials: [{
        seq:                 1,
        side:                null,
        valid:               !usedArms,
        invalidReason:       usedArms ? STS_USED_ARMS_REASON : null,
        completeRepetitions: hasRepetitions ? completeRepetitions : null,
        partialRepCounted,
        value:               result.repetitions,
      }],
      events: {
        usedArms,
        usedArmsNote,
        stopTimeS,
        technicalError,
        technicalErrorNote: technicalError ? technicalErrorNote : null,
        familiarizationDone,
        pauseCount,
        pauseDurationS,
      },
      result,
      comparability: { protocolVersion, chairHeightCm, chairHasArmrests, armsCrossed },
      clinical: { painScale: PAIN_SCALE, ...clinical, stopReasonCode, stopReasonNote, conditionsNote },
      deviation,
      notes,
    },
  }
}

function validateHandgrip(input, context) {
  const errors = {}
  const fail   = makeFail(errors)
  const src        = asObject(input)
  const setup      = asObject(src.setup)
  const device     = asObject(setup.device)
  const events     = asObject(src.events)
  const clinicalIn = asObject(src.clinical)
  const spec       = HANDGRIP

  const performedAt = readPerformedAt(src.performedAt, context, fail)

  // Setup: chi rilegge deve sapere con quale strumento e impugnatura (docx 03 §21)
  const dominantSide = readDominantSide(setup.dominantSide, fail)
  const brand  = readRequiredText(device.brand, TEXT_LIMITS.deviceField, 'setup.device.brand', 'Inserisci la marca del dinamometro', fail, errors)
  const model  = readRequiredText(device.model, TEXT_LIMITS.deviceField, 'setup.device.model', 'Inserisci il modello del dinamometro', fail, errors)
  const serial = readText(device.serial, TEXT_LIMITS.deviceField, 'setup.device.serial', fail)
  const gripSetting = readRequiredText(setup.gripSetting, TEXT_LIMITS.gripSetting, 'setup.gripSetting', "Indica l'impostazione dell'impugnatura", fail, errors)

  // Prove e derivati: tutta la logica è quella bilaterale generica
  const { nativeUnit, trials } = readBilateralTrials(src, spec, fail)
  const result = trials ? computeBilateralResult(trials, spec) : null
  const { stoppedEarly, stopReasonCode, stopReasonNote } = readLimbStop(events, clinicalIn, result, fail, errors)

  const clinical = readClinical(clinicalIn, fail, NO_CLINICAL_KEYS)
  const conditionsNote = readText(clinicalIn.conditionsNote, TEXT_LIMITS.conditionsNote, 'clinical.conditionsNote', fail)
  const deviation = readDeviation(src.deviation, fail)
  const notes = readText(src.notes, TEXT_LIMITS.notes, 'notes', fail)

  if (hasErrors(errors)) return { errors, value: null }

  const { protocolVersion } = spec
  return {
    errors,
    value: {
      testId:  LIPEDEMA_TEST_IDS.HANDGRIP,
      protocolVersion,
      performedAt,
      outcome: stoppedEarly ? ASSESSMENT_OUTCOME.STOPPED_EARLY : ASSESSMENT_OUTCOME.COMPLETE,
      setup:   { dominantSide, device: { brand, model, serial }, gripSetting, nativeUnit },
      trials,
      events:  { stoppedEarly },
      result,
      // Chiavi normalizzate: "Jamar" e "jamar " non sono due dinamometri. Il
      // seriale si salva già ora per STORY-039 (documenti immutabili)
      comparability: {
        protocolVersion,
        deviceModelKey:  `${normalizeKey(brand)}|${normalizeKey(model)}`,
        gripSettingKey:  normalizeKey(gripSetting),
        deviceSerialKey: serial ? normalizeKey(serial) : null,
      },
      clinical: {
        painScale: PAIN_SCALE,
        ...clinical,
        painMaxBySide: computePainMaxBySide(trials, spec),
        stopReasonCode,
        stopReasonNote,
        conditionsNote,
      },
      deviation,
      notes,
    },
  }
}

const ASSESSMENT_VALIDATORS = {
  [LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK]:  validateTwoMinuteWalk,
  [LIPEDEMA_TEST_IDS.SIT_TO_STAND_30S]: validateSitToStand30s,
  [LIPEDEMA_TEST_IDS.HANDGRIP]:         validateHandgrip,
}

// ── Logica bilaterale generica (ADR-016 §1-3) ────────────────────────────────

/**
 * Valida e normalizza `trials[]` di un test bilaterale secondo la specifica:
 * seq contiguo nell'ordine reale, lato della specifica, validità obbligatoria,
 * al massimo `validTrialsPerSide` valide e `maxInvalidPerSide` non valide per
 * lato. L'alternanza dei lati la guida la UI, non la impone il server. L'unità
 * nativa si inserisce una volta per valutazione (setup.nativeUnit) e si copia
 * su ogni prova; `value` è canonico e non arrotondato.
 * @returns {{ nativeUnit: string|null, trials: object[]|null }}
 */
function readBilateralTrials(src, spec, fail) {
  const setup = asObject(src.setup)
  const nativeUnit = typeof setup.nativeUnit === 'string' && Object.hasOwn(spec.unitFactors, setup.nativeUnit)
    ? setup.nativeUnit
    : null
  if (nativeUnit === null) fail('setup.nativeUnit', "Seleziona l'unità di misura")

  const maxTrials = spec.sides.length * (spec.validTrialsPerSide + spec.maxInvalidPerSide)
  if (!Array.isArray(src.trials)) {
    fail('trials', 'Inserisci le prove')
    return { nativeUnit, trials: null }
  }
  if (src.trials.length > maxTrials) {
    fail('trials', `Al massimo ${maxTrials} prove`)
    return { nativeUnit, trials: null }
  }

  const counts = Object.fromEntries(spec.sides.map(side => [side, { valid: 0, invalid: 0 }]))
  const trials = src.trials.map((rawTrial, index) => {
    const trialSrc = asObject(rawTrial)
    const field    = name => `trials.${index}.${name}`

    if (trialSrc.seq !== index + 1) fail(field('seq'), 'Numerazione delle prove non valida')
    const side = spec.sides.includes(trialSrc.side) ? trialSrc.side : null
    if (side === null) fail(field('side'), 'Lato della prova non valido')
    const valid = trialSrc.valid
    if (typeof valid !== 'boolean') fail(field('valid'), 'Indica se la prova è valida')

    if (side !== null && typeof valid === 'boolean') {
      const count = counts[side]
      if (valid) {
        count.valid += 1
        if (count.valid > spec.validTrialsPerSide) {
          fail(field('valid'), `Già ${spec.validTrialsPerSide} prove valide sul lato ${SIDE_NAMES[side]}`)
        }
      } else {
        count.invalid += 1
        if (count.invalid > spec.maxInvalidPerSide) {
          fail(field('valid'), `Oltre ${spec.maxInvalidPerSide} prove non valide sul lato ${SIDE_NAMES[side]}: rimuovi la prova e segna l'interruzione`)
        }
      }
    }

    const note = readText(trialSrc.note, TEXT_LIMITS.trialNote, field('note'), fail)
    let invalidReason = null
    if (valid === false) {
      const allowedReasons = spec.invalidReasons ?? INVALID_TRIAL_REASONS
      invalidReason = INVALID_TRIAL_REASONS.includes(trialSrc.invalidReason) && allowedReasons.includes(trialSrc.invalidReason)
        ? trialSrc.invalidReason
        : null
      if (invalidReason === null) fail(field('invalidReason'), 'Seleziona il motivo')
      else if (invalidReason === 'other' && !note) fail(field('note'), 'Descrivi il motivo')
    }

    // Una prova non valida può non avere una lettura (es. impugnatura scivolata)
    const nativeValue = readTrialValue(trialSrc.nativeValue, valid !== false, nativeUnit, spec, field('nativeValue'), fail)
    const value = nativeValue === null || nativeUnit === null ? null : nativeValue * spec.unitFactors[nativeUnit]
    const pain  = readRangeValue(trialSrc.pain, PAIN_RANGE, field('pain'), fail)

    const trial = { seq: index + 1, side, valid: valid === true, invalidReason, nativeValue, nativeUnit, value, pain, note }
    if (hasCeiling(spec)) trial.ceiling = value === spec.ceiling
    return trial
  })
  return { nativeUnit, trials }
}

/**
 * Interruzione di un test bilaterale (ADR-016 §3): senza interruzione ogni lato
 * deve essere completo; con l'interruzione il motivo è obbligatorio e ogni
 * conteggio è ammesso (anche 0 prove su un lato). Niente tempo di stop.
 */
function readLimbStop(events, clinicalIn, result, fail, errors) {
  const stoppedEarly = events.stoppedEarly
  if (typeof stoppedEarly !== 'boolean') fail('events.stoppedEarly', 'Indica se la prova è stata interrotta')
  // Con troppe prove su un lato l'errore è già sulla prova: niente secondo messaggio
  const hasCountErrors = Object.keys(errors).some(field => TRIAL_VALID_FIELD_RE.test(field))
  if (stoppedEarly === false && result && !hasCountErrors &&
      Object.values(result.sideStatus).some(status => status !== BILATERAL_SIDE_STATUS.COMPLETE)) {
    fail('trials', "Completa le prove o segna l'interruzione")
  }
  const { stopReasonCode, stopReasonNote } = stoppedEarly === true
    ? readStopReason(clinicalIn, LIMB_STOP_REASON_CODES, fail)
    : { stopReasonCode: null, stopReasonNote: null }
  return { stoppedEarly, stopReasonCode, stopReasonNote }
}

/** Dolore massimo per lato dalle prove (docx 03 §14): mai un input separato */
function computePainMaxBySide(trials, spec) {
  return Object.fromEntries(spec.sides.map(side => {
    const pains = trials.filter(trial => trial.side === side && trial.pain !== null).map(trial => trial.pain)
    return [side, pains.length > 0 ? Math.max(...pains) : null]
  }))
}

function readTrialValue(value, isRequired, nativeUnit, spec, field, fail) {
  if (value === undefined || value === null) {
    if (isRequired) fail(field, 'Inserisci il valore della prova')
    return null
  }
  if (!isFiniteNumber(value) || value <= 0) {
    fail(field, 'Il valore deve essere maggiore di 0')
    return null
  }
  if (!hasMaxDecimals(value, spec.inputDecimals)) {
    fail(field, `Inserisci il valore con al massimo ${spec.inputDecimals} decimali`)
    return null
  }
  if (nativeUnit === null) return value
  const canonical = value * spec.unitFactors[nativeUnit]
  if (spec.maxValue != null && canonical > spec.maxValue) {
    fail(field, `Valore non plausibile (oltre ${formatDecimal(spec.maxValue)} ${spec.canonicalUnit})`)
    return null
  }
  if (hasCeiling(spec) && canonical > spec.ceiling) {
    fail(field, `Il valore non può superare ${formatDecimal(spec.ceiling)} ${spec.canonicalUnit}`)
    return null
  }
  return value
}

function hasCeiling(spec) {
  return spec.ceiling !== null && spec.ceiling !== undefined
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

/** Stop anticipato con il tempo raggiunto (2MWT, 30s-STS): intero 1…durata−1 */
function readTimedStop(events, durationS, fail) {
  const stoppedEarly = events.stoppedEarly
  if (typeof stoppedEarly !== 'boolean') fail('events.stoppedEarly', 'Indica se la prova è stata interrotta')
  const maxStopTimeS = durationS - 1
  let stopTimeS = null
  if (stoppedEarly === true) {
    if (!isIntegerInRange(events.stopTimeS, 1, maxStopTimeS)) {
      fail('events.stopTimeS', `Inserisci il tempo raggiunto (1–${maxStopTimeS} s)`)
    } else {
      stopTimeS = events.stopTimeS
    }
  }
  return { stoppedEarly, stopTimeS }
}

/** Motivo dell'interruzione dal catalogo del test, nota obbligatoria con "Altro" */
function readStopReason(clinicalIn, codes, fail) {
  let stopReasonCode = clinicalIn.stopReasonCode
  if (!codes.includes(stopReasonCode)) {
    fail('clinical.stopReasonCode', "Seleziona il motivo dell'interruzione")
    stopReasonCode = null
  }
  const stopReasonNote = readText(clinicalIn.stopReasonNote, TEXT_LIMITS.stopReasonNote, 'clinical.stopReasonNote', fail)
  if (stopReasonCode === 'other' && !stopReasonNote) fail('clinical.stopReasonNote', 'Descrivi il motivo')
  return { stopReasonCode, stopReasonNote }
}

/** Pause: numero e durata totale, non oltre la durata reale della prova */
function readPauses(events, maxPauseCount, durationS, fail) {
  const pauseCount = events.pauseCount
  let pauseDurationS = 0
  if (!isIntegerInRange(pauseCount, 0, maxPauseCount)) {
    fail('events.pauseCount', `Inserisci il numero di pause (0–${maxPauseCount})`)
  } else if (pauseCount > 0) {
    if (!isIntegerInRange(events.pauseDurationS, 1, durationS)) {
      fail('events.pauseDurationS', `Inserisci la durata totale delle pause (1–${durationS} s)`)
    } else {
      pauseDurationS = events.pauseDurationS
    }
  }
  return { pauseCount, pauseDurationS }
}

/** Deviazione dal protocollo: sì/no + descrizione (tutti i docx) */
function readDeviation(value, fail) {
  const deviation = asObject(value)
  const present = deviation.present
  if (typeof present !== 'boolean') fail('deviation.present', 'Indica se ci sono state deviazioni dal protocollo')
  const note = readText(deviation.note, TEXT_LIMITS.deviationNote, 'deviation.note', fail)
  if (present === true && !note) fail('deviation.note', 'Descrivi la deviazione')
  return { present, note: present ? note : null }
}

function readDominantSide(value, fail) {
  if (DOMINANT_SIDES.includes(value)) return value
  fail('setup.dominantSide', 'Indica il lato dominante')
  return null
}

/**
 * Parametri clinici pre/post facoltativi, null se assenti. Solo le chiavi
 * ammesse dal test (`keys`); la PA si controlla in coppia se il test la prevede.
 */
function readClinical(src, fail, keys) {
  const clinical = {}
  for (const key of keys) {
    clinical[key] = readRangeValue(src[key], CLINICAL_RANGES[key], `clinical.${key}`, fail)
  }
  for (const moment of ['Pre', 'Post']) {
    const sysKey = `bpSys${moment}`
    const diaKey = `bpDia${moment}`
    if (!keys.includes(sysKey) || !keys.includes(diaKey)) continue
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

/** Numero facoltativo in un intervallo con passo: null se assente o non valido */
function readRangeValue(value, range, field, fail) {
  if (value === undefined || value === null) return null
  if (!isFiniteNumber(value) || value < range.min || value > range.max || !isMultipleOf(value, range.step)) {
    fail(field, `Valore non valido (${formatDecimal(range.min)}–${formatDecimal(range.max)}${range.step < 1 ? `, passo ${formatDecimal(range.step)}` : ''})`)
    return null
  }
  return value
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

/** Testo obbligatorio: come readText, con il messaggio se vuoto */
function readRequiredText(value, maxLength, field, emptyMessage, fail, errors) {
  const text = readText(value, maxLength, field, fail)
  if (!text && !errors[field]) fail(field, emptyMessage)
  return text
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
