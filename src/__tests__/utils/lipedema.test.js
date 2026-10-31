import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  computeTwoMinuteWalkResult, validateAssessmentInput, validatePrivacyNoticeInput, validateVoidReason,
  patientAgeAt, requiresPrivacyNotice, buildTestHistory, getLatestValidByTest, getComparabilityIssues,
  isPrivacyNoticeMissingError, PRIVACY_NOTICE_MISSING, isSameAssessmentData, nowLocalDateTime, todayLocalDate, LOCAL_TIME_ZONE,
  computeBilateralResult, HANDGRIP,
} from '../../utils/lipedema.js'
import { getModule, MODULES } from '../../config/modules.config.js'
import {
  createTwoMinuteWalkForm, formFromAssessment, buildTwoMinuteWalkInput, toNumber, countClinicalFilled,
} from '../../features/assessments/twoMinuteWalkFormModel.js'
import {
  createSitToStandForm, buildSitToStandInput, sitToStandFormFromAssessment,
} from '../../features/assessments/sitToStandFormModel.js'
import {
  createHandgripForm, createPlannedTrials, proposeNextSide, buildHandgripInput, handgripFormFromAssessment,
} from '../../features/assessments/handgripFormModel.js'
import { formatMonoDelta, formatBilateralDelta, formatBilateralPrimary } from '../../features/assessments/assessmentFormat.js'

const CONTEXT = { nowLocal: '2026-10-30T11:00', birthDate: '1985-03-12' }
const BASE = {
  testId: 'lipedema_2mwt', performedAt: '2026-10-30T10:30',
  setup: { courseLengthM: 30, assistiveDevice: 'none' },
  trial: { fullLengths: 4, partialDistanceM: 22 },
  events: { stoppedEarly: false, pauseCount: 0 },
  clinical: {}, deviation: { present: false },
}
const errorsOf = override => validateAssessmentInput({ ...BASE, ...override }, CONTEXT).errors

describe('computeTwoMinuteWalkResult', () => {
  it('tratti × lunghezza + frazione, arrotondato al metro', () => {
    expect(computeTwoMinuteWalkResult({ courseLengthM: 30, fullLengths: 4, partialDistanceM: 22, durationS: 120 }))
      .toEqual({ distanceM: 142, avgSpeedMs: 1.18, durationS: 120 })
  })

  it('mezzo metro per eccesso, senza errori di virgola mobile', () => {
    expect(computeTwoMinuteWalkResult({ courseLengthM: 15.3, fullLengths: 7, partialDistanceM: 0.4, durationS: 120 }).distanceM).toBe(108)
    expect(computeTwoMinuteWalkResult({ courseLengthM: 15.2, fullLengths: 3, partialDistanceM: 0.4, durationS: 120 }).distanceM).toBe(46)
  })

  it('velocità media sulla durata reale (stop anticipato)', () => {
    expect(computeTwoMinuteWalkResult({ courseLengthM: 30, fullLengths: 3, partialDistanceM: 6, durationS: 85 }).avgSpeedMs).toBe(1.13)
  })
})

describe('validateAssessmentInput — 2MWT', () => {
  it('input valido: valore normalizzato con risultato e snapshot di comparabilità', () => {
    const { errors, value } = validateAssessmentInput(BASE, CONTEXT)
    expect(errors).toEqual({})
    expect(value).toMatchObject({
      protocolVersion: '1.0', outcome: 'complete',
      result: { distanceM: 142 }, comparability: { protocolVersion: '1.0', courseLengthM: 30, assistiveDevice: 'none' },
      clinical: { painScale: 'nrs_0_10', painPre: null, stopReasonCode: null },
    })
  })

  it('frazione ≥ lunghezza percorso: messaggio con la lunghezza', () => {
    expect(errorsOf({ trial: { fullLengths: 4, partialDistanceM: 30 } })['trial.partialDistanceM'])
      .toBe('La frazione deve essere inferiore a 30 m: altrimenti è un tratto completo')
  })

  it('variante di percorso solo se confermata', () => {
    expect(errorsOf({ setup: { courseLengthM: 20, assistiveDevice: 'none' } })).toHaveProperty('setup.variantConfirmed')
    const { value } = validateAssessmentInput({ ...BASE, setup: { courseLengthM: 20, assistiveDevice: 'none', variantConfirmed: true }, trial: { fullLengths: 6, partialDistanceM: 2 } }, CONTEXT)
    expect(value.setup.isStandardCourse).toBe(false)
  })

  it('stop anticipato: tempo 1–119 e motivo obbligatori, "Altro" richiede la nota', () => {
    const stopped = events => ({ events: { stoppedEarly: true, pauseCount: 0, ...events } })
    expect(errorsOf(stopped({ stopTimeS: 120 }))).toHaveProperty('events.stopTimeS')
    expect(errorsOf(stopped({ stopTimeS: 85 }))).toHaveProperty('clinical.stopReasonCode')
    expect(errorsOf({ ...stopped({ stopTimeS: 85 }), clinical: { stopReasonCode: 'other' } })).toHaveProperty('clinical.stopReasonNote')
    const { value } = validateAssessmentInput({ ...BASE, ...stopped({ stopTimeS: 85 }), clinical: { stopReasonCode: 'dizziness' } }, CONTEXT)
    expect(value).toMatchObject({ outcome: 'stopped_early', result: { durationS: 85 }, events: { stopTimeS: 85 } })
  })

  it('motivo di stop scartato se la prova non è interrotta (stop clinico ≠ deviazione)', () => {
    const { value } = validateAssessmentInput({ ...BASE, clinical: { stopReasonCode: 'dyspnea' } }, CONTEXT)
    expect(value.clinical.stopReasonCode).toBeNull()
    expect(value.deviation.present).toBe(false)
  })

  it('pause: durata obbligatoria e non oltre la durata della prova', () => {
    expect(errorsOf({ events: { stoppedEarly: false, pauseCount: 1 } })).toHaveProperty('events.pauseDurationS')
    expect(errorsOf({ events: { stoppedEarly: false, pauseCount: 1, pauseDurationS: 121 } })).toHaveProperty('events.pauseDurationS')
  })

  it('parametri clinici: facoltativi, range anti-refuso, PA in coppia con sistolica > diastolica', () => {
    expect(errorsOf({ clinical: { painPre: 11 } })).toHaveProperty('clinical.painPre')
    expect(errorsOf({ clinical: { fatiguePost: 3.5, spo2PrePct: 96 } })).toEqual({})
    expect(errorsOf({ clinical: { bpSysPost: 120 } })).toHaveProperty('clinical.bpDiaPost')
    expect(errorsOf({ clinical: { bpSysPre: 80, bpDiaPre: 80 } })).toHaveProperty('clinical.bpSysPre')
  })

  it('data: obbligatoria, non futura, non prima della nascita', () => {
    expect(errorsOf({ performedAt: '' })).toHaveProperty('performedAt')
    expect(errorsOf({ performedAt: '2026-10-30T11:30' }).performedAt).toBe('La data non può essere futura')
    expect(errorsOf({ performedAt: '2026-10-30T11:04' })).toEqual({})   // tolleranza orologio
    expect(errorsOf({ performedAt: '1984-01-01T10:00' })).toHaveProperty('performedAt')
  })

  it('deviazione sì → descrizione obbligatoria; note max 1000', () => {
    expect(errorsOf({ deviation: { present: true } })).toHaveProperty('deviation.note')
    expect(errorsOf({ notes: 'x'.repeat(1001) })).toHaveProperty('notes')
  })

  it('test sconosciuto rifiutato', () => {
    expect(validateAssessmentInput({ testId: 'x' }, CONTEXT)).toEqual({ errors: { testId: 'Test non supportato' }, value: null })
  })
})

describe('informativa e annullamento', () => {
  const context = { today: '2026-10-30', birthDate: '1985-03-12' }

  it('versione obbligatoria (max 40), data non futura e non prima della nascita', () => {
    expect(validatePrivacyNoticeInput({ informativaVersion: ' v2.1 ', deliveredAt: '2026-10-30' }, context).value)
      .toEqual({ informativaVersion: 'v2.1', deliveredAt: '2026-10-30' })
    expect(validatePrivacyNoticeInput({ informativaVersion: '', deliveredAt: '2026-10-30' }, context).errors).toHaveProperty('informativaVersion')
    expect(validatePrivacyNoticeInput({ informativaVersion: 'x'.repeat(41), deliveredAt: '2026-10-30' }, context).errors).toHaveProperty('informativaVersion')
    expect(validatePrivacyNoticeInput({ informativaVersion: 'v1', deliveredAt: '2026-10-31' }, context).errors).toHaveProperty('deliveredAt')
    expect(validatePrivacyNoticeInput({ informativaVersion: 'v1', deliveredAt: '1985-03-11' }, context).errors).toHaveProperty('deliveredAt')
  })

  it('motivo di annullamento obbligatorio, max 500', () => {
    expect(validateVoidReason('  ok  ')).toEqual({ error: null, value: 'ok' })
    expect(validateVoidReason('   ').error).toBeTruthy()
    expect(validateVoidReason('x'.repeat(501)).error).toBeTruthy()
  })

  it('età alla data della valutazione', () => {
    expect(patientAgeAt('1985-03-12', '2026-03-11T10:00')).toBe(40)
    expect(patientAgeAt('1985-03-12', '2026-03-12T10:00')).toBe(41)
    expect(patientAgeAt(null, '2026-03-12T10:00')).toBeNull()
  })

  it('informativa richiesta solo nei moduli con valutazioni', () => {
    expect(requiresPrivacyNotice(getModule(MODULES.LIPEDEMA))).toBe(true)
    expect(requiresPrivacyNotice(getModule(MODULES.PERSONAL_TRAINING))).toBe(false)
    expect(requiresPrivacyNotice(getModule(MODULES.SOCCER_ACADEMY))).toBe(false)
  })

  it('riconosce il rifiuto per informativa mancante dal codice, non dal testo', () => {
    expect(isPrivacyNoticeMissingError({ code: 'functions/failed-precondition', details: { reason: PRIVACY_NOTICE_MISSING } })).toBe(true)
    expect(isPrivacyNoticeMissingError({ code: 'functions/failed-precondition', message: 'Operazione non disponibile' })).toBe(false)
  })
})

describe('storico: comparabilità e delta (ADR-012)', () => {
  const make = (id, performedAt, distanceM, extra = {}) => ({
    id, testId: 'lipedema_2mwt', performedAt, status: 'valid', outcome: 'complete',
    result: { distanceM }, comparability: { protocolVersion: '1.0', courseLengthM: 30, assistiveDevice: 'none' },
    ...extra,
  })
  const byId = (history, id) => history.find(entry => entry.assessment.id === id)

  it('delta rispetto alla precedente valida, più recente in alto', () => {
    const history = buildTestHistory([make('a', '2026-09-03T10:00', 134), make('b', '2026-10-30T10:00', 142)], 'lipedema_2mwt')
    expect(history.map(entry => entry.assessment.id)).toEqual(['b', 'a'])
    expect(byId(history, 'b')).toMatchObject({ delta: 8, nonComparable: null })
    expect(byId(history, 'b').reference.id).toBe('a')
    expect(byId(history, 'a')).toMatchObject({ delta: null, reference: null })
  })

  it('le annullate restano nello storico ma non entrano nei confronti', () => {
    const history = buildTestHistory([
      make('a', '2026-09-01T10:00', 130),
      make('v', '2026-09-15T10:00', 999, { status: 'voided' }),
      make('b', '2026-10-01T10:00', 140),
    ], 'lipedema_2mwt')
    expect(byId(history, 'b')).toMatchObject({ delta: 10 })
    expect(byId(history, 'v')).toMatchObject({ delta: null, reference: null })
  })

  it('precedente immediata non confrontabile: badge con motivo, delta sulla precedente confrontabile', () => {
    const history = buildTestHistory([
      make('a', '2026-09-01T10:00', 130),
      make('variant', '2026-09-15T10:00', 120, { comparability: { protocolVersion: '1.0', courseLengthM: 20, assistiveDevice: 'cane' } }),
      make('b', '2026-10-01T10:00', 141),
    ], 'lipedema_2mwt')
    expect(byId(history, 'b')).toMatchObject({ nonComparable: ['course', 'device'], delta: 11 })
    expect(byId(history, 'b').reference.id).toBe('a')
    expect(byId(history, 'variant')).toMatchObject({ nonComparable: ['course', 'device'], delta: null, reference: null })
  })

  it('un estremo interrotto: nessun delta, motivo stopped_early', () => {
    const history = buildTestHistory([make('a', '2026-09-01T10:00', 130), make('b', '2026-10-01T10:00', 96, { outcome: 'stopped_early' })], 'lipedema_2mwt')
    expect(byId(history, 'b')).toMatchObject({ delta: null, deltaUnavailable: 'stopped_early' })
  })

  it('protocollo diverso → non confrontabile', () => {
    expect(getComparabilityIssues(make('a', 'x', 1), make('b', 'y', 1, { comparability: { protocolVersion: '2.0', courseLengthM: 30, assistiveDevice: 'none' } })))
      .toEqual(['protocol'])
  })

  it('ultima valida per test', () => {
    const latest = getLatestValidByTest([make('a', '2026-09-01T10:00', 130), make('v', '2026-10-15T10:00', 1, { status: 'voided' })])
    expect(latest.lipedema_2mwt.id).toBe('a')
  })
})

describe('form 2MWT ↔ input della callable', () => {
  it('form nuovo: 30 m, nessun ausilio, data passata come default', () => {
    const form = createTwoMinuteWalkForm('2026-10-30T10:30')
    expect(form).toMatchObject({ performedAt: '2026-10-30T10:30', courseLengthM: '30', assistiveDevice: 'none', fullLengths: '0' })
  })

  it('stringhe → numeri (virgola decimale), vuoto → null; con i valori completi la validazione passa', () => {
    const form = { ...createTwoMinuteWalkForm('2026-10-30T10:30'), fullLengths: '4', partialDistanceM: '22,0' }
    const input = buildTwoMinuteWalkInput(form)
    expect(input.trial).toEqual({ fullLengths: 4, partialDistanceM: 22 })
    expect(input.clinical.painPre).toBeNull()
    expect(validateAssessmentInput(input, CONTEXT).value.result.distanceM).toBe(142)
    expect(toNumber('abc')).toBeNaN()
  })

  it('correggi: il form precompilato ricostruisce lo stesso input', () => {
    const { value } = validateAssessmentInput({
      ...BASE, events: { stoppedEarly: true, stopTimeS: 85, pauseCount: 1, pauseDurationS: 10 },
      clinical: { stopReasonCode: 'dyspnea', painPre: 3 }, notes: 'nota',
    }, CONTEXT)
    const form = formFromAssessment(value)
    expect(form).toMatchObject({ stoppedEarly: true, stopTimeS: '85', stopReasonCode: 'dyspnea', pauseDurationS: '10', notes: 'nota' })
    expect(countClinicalFilled(form)).toBe(1)
    const again = validateAssessmentInput(buildTwoMinuteWalkInput(form), CONTEXT).value
    expect(again).toEqual(value)
  })
})

describe('fuso degli studi (M1)', () => {
  afterEach(() => vi.useRealTimers())

  it('"adesso" e "oggi" in Europe/Rome, non nel fuso del dispositivo', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-30T23:30:00Z'))   // a Roma è già il 31 (CET, +1)
    expect(LOCAL_TIME_ZONE).toBe('Europe/Rome')
    expect(nowLocalDateTime()).toBe('2026-10-31T00:30')
    expect(todayLocalDate()).toBe('2026-10-31')
  })
})

describe("correzione identica all'originale (L3)", () => {
  const CONTEXT_L3 = { nowLocal: '2026-10-30T11:00', birthDate: '1985-03-12' }
  const saved = () => {
    const { value } = validateAssessmentInput(BASE, CONTEXT_L3)
    // Documento come torna da Firestore: chiavi in un altro ordine + campi del server
    const reorder = obj => Object.fromEntries(Object.entries(obj).reverse()
      .map(([k, v]) => [k, v && typeof v === 'object' && !Array.isArray(v) ? reorder(v) : v]))
    return { ...reorder(value), id: 'a1', status: 'valid', examinerId: 't1', createdAt: '2026-10-30T10:31:00.000Z' }
  }

  it('stessi dati (anche con chiavi in altro ordine) → identica', () => {
    const { value } = validateAssessmentInput(BASE, CONTEXT_L3)
    expect(isSameAssessmentData(value, saved())).toBe(true)
  })

  it('un dato diverso → non identica', () => {
    const { value } = validateAssessmentInput({ ...BASE, trial: { fullLengths: 5, partialDistanceM: 22 } }, CONTEXT_L3)
    expect(isSameAssessmentData(value, saved())).toBe(false)
    const withNote = validateAssessmentInput({ ...BASE, notes: 'refuso' }, CONTEXT_L3).value
    expect(isSameAssessmentData(withNote, saved())).toBe(false)
  })

  it("il form precompilato da Correggi, senza modifiche, è identico all'originale", () => {
    const original = saved()
    const again = validateAssessmentInput(buildTwoMinuteWalkInput(formFromAssessment(original)), CONTEXT_L3).value
    expect(isSameAssessmentData(again, original)).toBe(true)
  })
})

// ── Sprint #12: 30s-STS, logica bilaterale, Handgrip (ADR-016) ────────────────

describe('validateAssessmentInput — 30s-STS', () => {
  const STS = {
    testId: 'lipedema_30s_sts', performedAt: '2026-10-30T10:30',
    setup:  { chairHeightCm: 43.2, chairHasArmrests: false, armsCrossed: true },
    trial:  { completeRepetitions: 14, partialRepCounted: false },
    events: { usedArms: false, stoppedEarly: false, technicalError: false, familiarizationDone: true, pauseCount: 0 },
    clinical: {}, deviation: { present: false },
  }
  const sts = override => validateAssessmentInput({ ...STS, ...override }, CONTEXT)

  it('completo con parziale finale: 14 + 1 = 15, contata dal server', () => {
    const { errors, value } = sts({ trial: { completeRepetitions: 14, partialRepCounted: true } })
    expect(errors).toEqual({})
    expect(value).toMatchObject({
      outcome: 'complete', result: { repetitions: 15, durationS: 30 },
      trials: [{ seq: 1, side: null, valid: true, invalidReason: null, completeRepetitions: 14, partialRepCounted: true, value: 15 }],
      setup: { isStandardChair: true, assistiveDevice: 'none' },
      comparability: { protocolVersion: '1.0', chairHeightCm: 43.2, chairHasArmrests: false, armsCrossed: true },
    })
  })

  it('uso delle braccia: outcome invalidated, 0 e durata null, alzate grezze conservate', () => {
    const { value } = sts({ trial: { completeRepetitions: 6, partialRepCounted: false }, events: { ...STS.events, usedArms: true, usedArmsNote: ' spinta ' } })
    expect(value).toMatchObject({
      outcome: 'invalidated', result: { repetitions: 0, durationS: null },
      trials: [{ valid: false, invalidReason: 'used_arms', completeRepetitions: 6, value: 0 }],
      events: { usedArms: true, usedArmsNote: 'spinta' },
    })
    // alzate facoltative con l'uso delle braccia
    expect(sts({ trial: { partialRepCounted: false }, events: { ...STS.events, usedArms: true } }).value.trials[0].completeRepetitions).toBeNull()
  })

  it('uso braccia + stop, parziale + stop: rifiutati', () => {
    expect(sts({ events: { ...STS.events, usedArms: true, stoppedEarly: true, stopTimeS: 12 }, clinical: { stopReasonCode: 'dizziness' } }).errors)
      .toHaveProperty('events.usedArms')
    expect(sts({ trial: { completeRepetitions: 9, partialRepCounted: true }, events: { ...STS.events, stoppedEarly: true, stopTimeS: 22 }, clinical: { stopReasonCode: 'dyspnea' } }).errors)
      .toHaveProperty('trial.partialRepCounted')
    const { value } = sts({ trial: { completeRepetitions: 9, partialRepCounted: false }, events: { ...STS.events, stoppedEarly: true, stopTimeS: 22 }, clinical: { stopReasonCode: 'dyspnea' } })
    expect(value).toMatchObject({ outcome: 'stopped_early', result: { repetitions: 9, durationS: 22 } })
    expect(sts({ events: { ...STS.events, stoppedEarly: true, stopTimeS: 30 }, clinical: { stopReasonCode: 'dyspnea' } }).errors).toHaveProperty('events.stopTimeS')
  })

  it('sedia: ±0,5 cm standard, oltre variante da confermare', () => {
    expect(sts({ setup: { ...STS.setup, chairHeightCm: 43.7 } }).value.setup.isStandardChair).toBe(true)
    expect(sts({ setup: { ...STS.setup, chairHeightCm: 45 } }).errors).toHaveProperty('setup.variantConfirmed')
    expect(sts({ setup: { ...STS.setup, chairHeightCm: 45, variantConfirmed: true } }).value.setup.isStandardChair).toBe(false)
    expect(sts({ setup: { ...STS.setup, chairHeightCm: 20 } }).errors).toHaveProperty('setup.chairHeightCm')
  })

  it('braccioli o braccia non incrociate richiedono la deviazione descritta', () => {
    expect(sts({ setup: { ...STS.setup, chairHasArmrests: true } }).errors).toHaveProperty('deviation.present')
    expect(sts({ setup: { ...STS.setup, armsCrossed: false }, deviation: { present: true } }).errors).toHaveProperty('deviation.note')
    expect(sts({ setup: { ...STS.setup, armsCrossed: false }, deviation: { present: true, note: 'mani sulle cosce' } }).errors).toEqual({})
  })

  it('errore tecnico con descrizione obbligatoria, familiarizzazione obbligatoria, niente FC/SpO₂/PA', () => {
    expect(sts({ events: { ...STS.events, technicalError: true } }).errors).toHaveProperty('events.technicalErrorNote')
    expect(sts({ events: { ...STS.events, familiarizationDone: undefined } }).errors).toHaveProperty('events.familiarizationDone')
    const { value } = sts({ clinical: { painPre: 2, hrPreBpm: 80, bpSysPre: 120 } })
    expect(value.clinical.painPre).toBe(2)
    expect(value.clinical).not.toHaveProperty('hrPreBpm')
    expect(value.clinical).not.toHaveProperty('bpSysPre')
  })

  it('pause entro la durata reale; oltre 60 ripetizioni rifiutate', () => {
    expect(sts({ events: { ...STS.events, pauseCount: 1, pauseDurationS: 31 } }).errors).toHaveProperty('events.pauseDurationS')
    expect(sts({ trial: { completeRepetitions: 60, partialRepCounted: true } }).errors).toHaveProperty('trial.completeRepetitions')
  })
})

describe('computeBilateralResult (ADR-016 §2-3)', () => {
  const trial = (side, value, valid = true) => ({ side, valid, value })
  const OLS_LIKE = {
    protocolVersion: '1.0', sides: ['R', 'L'], validTrialsPerSide: 2, maxInvalidPerSide: 3,
    canonicalUnit: 's', unitFactors: { s: 1 }, inputDecimals: 1, ceiling: 60,
  }

  it('best = massimo delle sole valide, più forte, simmetria non arrotondata', () => {
    const result = computeBilateralResult([
      trial('R', 300), trial('L', 280), trial('R', 999, false), trial('R', 310), trial('L', 270), trial('R', 305), trial('L', 281),
    ], HANDGRIP)
    expect(result).toEqual({
      unit: 'N', validCountBySide: { R: 3, L: 3 }, sideStatus: { R: 'complete', L: 'complete' },
      bestBySide: { R: 310, L: 281 }, strongestSide: 'R', strongestValue: 310, weakestValue: 281,
      symmetryPct: (281 / 310) * 100,
    })
  })

  it('pareggio → strongestSide null', () => {
    const result = computeBilateralResult([trial('R', 300), trial('L', 300), trial('R', 1), trial('L', 1), trial('R', 2), trial('L', 2)], HANDGRIP)
    expect(result).toMatchObject({ strongestSide: null, strongestValue: 300, weakestValue: 300, symmetryPct: 100 })
  })

  it("lato incompleto o non testato: best null senza toccare l'altro", () => {
    const result = computeBilateralResult([trial('R', 300), trial('R', 310), trial('R', 305), trial('L', 280), trial('L', 290, false)], HANDGRIP)
    expect(result).toMatchObject({
      validCountBySide: { R: 3, L: 1 }, sideStatus: { R: 'complete', L: 'incomplete' },
      bestBySide: { R: 310, L: null }, strongestSide: null, strongestValue: null, symmetryPct: null,
    })
    expect(computeBilateralResult([trial('R', 1), trial('R', 2), trial('R', 3)], HANDGRIP).sideStatus.L).toBe('not_tested')
  })

  it('specifica sintetica tipo OLS: 2 prove valide per lato e ceiling per lato', () => {
    const result = computeBilateralResult([trial('R', 60), trial('L', 12.5), trial('R', 44.4), trial('L', 30)], OLS_LIKE)
    expect(result).toMatchObject({
      unit: 's', sideStatus: { R: 'complete', L: 'complete' }, bestBySide: { R: 60, L: 30 },
      strongestSide: 'R', ceilingBySide: { R: true, L: false },
    })
    expect(computeBilateralResult([trial('R', 60)], OLS_LIKE).ceilingBySide).toEqual({ R: null, L: null })
    expect(computeBilateralResult([trial('R', 1)], HANDGRIP)).not.toHaveProperty('ceilingBySide')
  })
})

describe('validateAssessmentInput — Handgrip', () => {
  const grip = (side, nativeValue, extra = {}) => ({ side, valid: true, nativeValue, ...extra })
  const numbered = trials => trials.map((item, i) => ({ seq: i + 1, ...item }))
  const SIX = [grip('R', 30), grip('L', 28), grip('R', 31.5), grip('L', 27), grip('R', 29), grip('L', 28.25)]
  const BASE_HG = {
    testId: 'lipedema_handgrip', performedAt: '2026-10-30T10:30',
    setup: { dominantSide: 'R', device: { brand: ' Jamar ', model: 'Plus+', serial: ' A12 ' }, gripSetting: 'Posizione 2', nativeUnit: 'N' },
    trials: numbered(SIX), events: { stoppedEarly: false }, clinical: {}, deviation: { present: false },
  }
  const hg = override => validateAssessmentInput({ ...BASE_HG, ...override }, CONTEXT)

  it('6 prove in N: best, chiavi di comparabilità normalizzate, lato dominante nel setup', () => {
    const { errors, value } = hg({})
    expect(errors).toEqual({})
    expect(value).toMatchObject({
      outcome: 'complete', events: { stoppedEarly: false },
      setup: { dominantSide: 'R', device: { brand: 'Jamar', model: 'Plus+', serial: 'A12' }, gripSetting: 'Posizione 2', nativeUnit: 'N' },
      result: { bestBySide: { R: 31.5, L: 28.25 }, strongestSide: 'R' },
      comparability: { protocolVersion: '1.0', deviceModelKey: 'jamar|plus+', gripSettingKey: 'posizione 2', deviceSerialKey: 'a12' },
      clinical: { painScale: 'nrs_0_10', painMaxBySide: { R: null, L: null }, stopReasonCode: null },
    })
    expect(value.trials[0]).toEqual({ seq: 1, side: 'R', valid: true, invalidReason: null, nativeValue: 30, nativeUnit: 'N', value: 30, pain: null, note: null })
  })

  it('kgf: valore nativo conservato, N = × 9,80665 non arrotondato', () => {
    const { value } = hg({ setup: { ...BASE_HG.setup, nativeUnit: 'kgf' } })
    expect(value.trials[0]).toMatchObject({ nativeValue: 30, nativeUnit: 'kgf', value: 30 * 9.80665 })
    expect(value.result.bestBySide.R).toBe(31.5 * 9.80665)
  })

  it('non valida ripetuta: salvata, esclusa dal best; dolore massimo per lato derivato', () => {
    const { value } = hg({ trials: numbered([grip('R', 30), grip('L', 40, { valid: false, invalidReason: 'technique_error', pain: 4 }), grip('L', 28, { pain: 2 }), grip('R', 31), grip('L', 27), grip('R', 29), grip('L', 26)]) })
    expect(value.result).toMatchObject({ validCountBySide: { R: 3, L: 3 }, bestBySide: { R: 31, L: 28 } })
    expect(value.trials[1]).toMatchObject({ valid: false, invalidReason: 'technique_error', nativeValue: 40 })
    expect(value.clinical.painMaxBySide).toEqual({ R: null, L: 4 })
  })

  it('quarta valida, oltre 3 non valide, non valida senza motivo: rifiutate', () => {
    expect(hg({ trials: numbered([...SIX, grip('R', 33)]) }).errors).toHaveProperty('trials.6.valid')
    const invalid = grip('L', null, { valid: false, invalidReason: 'device_error' })
    expect(hg({ trials: numbered([grip('R', 30), invalid, invalid, invalid, invalid]), events: { stoppedEarly: true }, clinical: { stopReasonCode: 'acute_pain' } }).errors)
      .toHaveProperty('trials.4.valid')
    expect(hg({ trials: numbered([grip('L', null, { valid: false }), ...SIX]) }).errors).toHaveProperty('trials.0.invalidReason')
    expect(hg({ trials: numbered([grip('L', null, { valid: false, invalidReason: 'other' }), ...SIX]) }).errors).toHaveProperty('trials.0.note')
    expect(hg({ trials: numbered([grip('L', null, { valid: false, invalidReason: 'support_or_assistance' }), ...SIX]) }).errors).toHaveProperty('trials.0.invalidReason')
    // con troppe prove l'errore resta sulla prova, senza il messaggio di completezza
    expect(hg({ trials: numbered([...SIX, grip('R', 33)]) }).errors).not.toHaveProperty('trials')
  })

  it('non valida senza valore ammessa; valida senza valore no', () => {
    expect(hg({ trials: numbered([grip('R', null, { valid: false, invalidReason: 'device_error' }), ...SIX]) }).value.trials[0])
      .toMatchObject({ nativeValue: null, value: null })
    expect(hg({ trials: numbered([grip('R', null), ...SIX.slice(1)]) }).errors).toHaveProperty('trials.0.nativeValue')
  })

  it('senza stop servono entrambi i lati completi; con stop il lato completo conserva il best', () => {
    const partial = numbered([grip('R', 30), grip('L', 28), grip('R', 31), grip('L', 27), grip('R', 29)])
    expect(hg({ trials: partial }).errors.trials).toBe("Completa le prove o segna l'interruzione")
    expect(hg({ trials: partial, events: { stoppedEarly: true } }).errors).toHaveProperty('clinical.stopReasonCode')
    expect(hg({ trials: partial, events: { stoppedEarly: true }, clinical: { stopReasonCode: 'chest_pain' } }).errors).toHaveProperty('clinical.stopReasonCode')
    const { value } = hg({ trials: partial, events: { stoppedEarly: true }, clinical: { stopReasonCode: 'acute_pain' } })
    expect(value).toMatchObject({ outcome: 'stopped_early', result: { sideStatus: { R: 'complete', L: 'incomplete' }, bestBySide: { R: 31, L: null } } })
    const oneSide = hg({ trials: numbered([grip('R', 30), grip('R', 31), grip('R', 29)]), events: { stoppedEarly: true }, clinical: { stopReasonCode: 'contraindication' } })
    expect(oneSide.value.result.sideStatus).toEqual({ R: 'complete', L: 'not_tested' })
  })

  it('anti-refuso e numerazione: decimali, massimo, seq contiguo, unità e setup obbligatori', () => {
    expect(hg({ trials: numbered([grip('R', 30.123), ...SIX.slice(1)]) }).errors).toHaveProperty('trials.0.nativeValue')
    expect(hg({ trials: numbered([grip('R', 1001), ...SIX.slice(1)]) }).errors).toHaveProperty('trials.0.nativeValue')
    expect(hg({ setup: { ...BASE_HG.setup, nativeUnit: 'kgf' }, trials: numbered([grip('R', 102), ...SIX.slice(1)]) }).errors).toHaveProperty('trials.0.nativeValue')
    expect(hg({ trials: numbered(SIX).map((item, i) => (i === 2 ? { ...item, seq: 9 } : item)) }).errors).toHaveProperty('trials.2.seq')
    const { errors } = hg({ setup: { dominantSide: 'X', device: { brand: '', model: '' }, gripSetting: ' ', nativeUnit: 'lbf' } })
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(['setup.dominantSide', 'setup.device.brand', 'setup.device.model', 'setup.gripSetting', 'setup.nativeUnit']))
    expect(hg({ setup: { ...BASE_HG.setup, dominantSide: 'both' } }).errors).toEqual({})
  })

  it('il client non decide value né result: vengono ricalcolati', () => {
    const { value } = hg({ trials: numbered(SIX.map(item => ({ ...item, value: 999 }))), result: { bestBySide: { R: 999 } } })
    expect(value.trials[0].value).toBe(30)
    expect(value.result.bestBySide.R).toBe(31.5)
  })
})

describe('storico: tolleranze, esiti non ordinari, delta per lato (ADR-016 §7)', () => {
  const sts = (id, performedAt, repetitions, extra = {}) => ({
    id, testId: 'lipedema_30s_sts', performedAt, status: 'valid', outcome: 'complete', result: { repetitions },
    comparability: { protocolVersion: '1.0', chairHeightCm: 43.2, chairHasArmrests: false, armsCrossed: true }, ...extra,
  })
  const hg = (id, performedAt, bestBySide, sideStatus = { R: 'complete', L: 'complete' }, extra = {}) => ({
    id, testId: 'lipedema_handgrip', performedAt, status: 'valid', outcome: 'complete', result: { bestBySide, sideStatus },
    comparability: { protocolVersion: '1.0', deviceModelKey: 'jamar|plus', gripSettingKey: '2', deviceSerialKey: null }, ...extra,
  })
  const byId = (history, id) => history.find(entry => entry.assessment.id === id)

  it('altezza sedia confrontabile entro ±0,5 cm, oltre no', () => {
    const at = height => ({ ...sts('x', 'x', 1), comparability: { protocolVersion: '1.0', chairHeightCm: height, chairHasArmrests: false, armsCrossed: true } })
    expect(getComparabilityIssues(at(43.7), at(43.2))).toEqual([])
    expect(getComparabilityIssues(at(43.8), at(43.2))).toEqual(['chairHeight'])
  })

  it('STS invalidata: nessun delta, motivo invalidated (anche verso la successiva)', () => {
    const history = buildTestHistory([
      sts('a', '2026-09-01T10:00', 13), sts('inv', '2026-09-15T10:00', 0, { outcome: 'invalidated' }), sts('b', '2026-10-01T10:00', 15),
    ], 'lipedema_30s_sts')
    expect(byId(history, 'inv')).toMatchObject({ delta: null, deltaUnavailable: 'invalidated' })
    expect(byId(history, 'b')).toMatchObject({ delta: null, deltaUnavailable: 'invalidated' })
  })

  it('Handgrip: delta per lato sui valori arrotondati alla precisione mostrata', () => {
    const history = buildTestHistory([hg('a', '2026-09-03T10:00', { R: 294.1995, L: 270.4 }), hg('b', '2026-10-01T10:00', { R: 295.18, L: 266.6 })], 'lipedema_handgrip')
    const entry = byId(history, 'b')
    expect(entry.deltaBySide).toEqual({ R: 1, L: -3 })   // 295 − 294, 267 − 270
    expect(entry.referenceBySide.R.id).toBe('a')
    expect(entry.delta).toBeNull()
  })

  it('interrotta con la destra completa: delta solo a destra, a sinistra si salta alla precedente completa', () => {
    const history = buildTestHistory([
      hg('a', '2026-08-01T10:00', { R: 300, L: 280 }),
      hg('b', '2026-09-01T10:00', { R: 305, L: null }, { R: 'complete', L: 'incomplete' }, { outcome: 'stopped_early' }),
      hg('c', '2026-10-01T10:00', { R: 310, L: 290 }),
    ], 'lipedema_handgrip')
    expect(byId(history, 'b').deltaBySide).toEqual({ R: 5, L: null })
    expect(byId(history, 'c').deltaBySide).toEqual({ R: 5, L: 10 })
    expect(byId(history, 'c').referenceBySide.L.id).toBe('a')
  })

  it('dinamometro diverso: non confrontabile, nessun delta', () => {
    const other = hg('a', '2026-09-03T10:00', { R: 300, L: 280 }, undefined, { comparability: { protocolVersion: '1.0', deviceModelKey: 'camry|eh101', gripSettingKey: '2', deviceSerialKey: null } })
    const entry = byId(buildTestHistory([other, hg('b', '2026-10-01T10:00', { R: 310, L: 290 })], 'lipedema_handgrip'), 'b')
    expect(entry).toMatchObject({ nonComparable: ['dynamometer'], reference: null, deltaBySide: { R: null, L: null } })
  })
})

describe('form 30s-STS e Handgrip ↔ input della callable', () => {
  it("30s-STS: form nuovo, braccia ⇒ stop e parziale spenti nell'input, Correggi identico", () => {
    const form = createSitToStandForm('2026-10-30T10:30')
    expect(form).toMatchObject({ chairHeightCm: '43.2', chairHasArmrests: false, armsCrossed: true, familiarizationDone: null })
    const armsInput = buildSitToStandInput({ ...form, usedArms: true, stoppedEarly: true, partialRepCounted: true, familiarizationDone: true })
    expect(armsInput.events).toMatchObject({ usedArms: true, stoppedEarly: false, stopTimeS: null })
    expect(armsInput.trial.partialRepCounted).toBe(false)

    const original = validateAssessmentInput(buildSitToStandInput({
      ...form, completeRepetitions: '14', partialRepCounted: true, familiarizationDone: true,
      technicalError: true, technicalErrorNote: 'conteggio', pauseCount: '1', pauseDurationS: '3', clinical: { ...form.clinical, painPre: '2' },
    }), CONTEXT).value
    expect(original.result.repetitions).toBe(15)
    const again = validateAssessmentInput(buildSitToStandInput(sitToStandFormFromAssessment(original)), CONTEXT).value
    expect(isSameAssessmentData(again, original)).toBe(true)
  })

  it('Handgrip: 6 prove pianificate D-S alternate, lato proposto, precompilazione dalla precedente', () => {
    expect(createPlannedTrials().map(row => row.side)).toEqual(['R', 'L', 'R', 'L', 'R', 'L'])
    expect(proposeNextSide([{ side: 'R', valid: true }, { side: 'L', valid: false }])).toBe('L')
    const previous = { performedAt: '2026-09-03T10:00', setup: { dominantSide: 'L', device: { brand: 'Jamar', model: 'Plus', serial: null }, gripSetting: '2', nativeUnit: 'kgf' } }
    expect(createHandgripForm('2026-10-30T10:30', previous)).toMatchObject({
      dominantSide: 'L', deviceBrand: 'Jamar', deviceModel: 'Plus', deviceSerial: '', gripSetting: '2', nativeUnit: 'kgf',
    })
    expect(createHandgripForm('2026-10-30T10:30')).toMatchObject({ dominantSide: '', nativeUnit: 'N' })
  })

  it('Handgrip: con lo stop le righe pianificate vuote non si salvano; Correggi identico', () => {
    const form = { ...createHandgripForm('2026-10-30T10:30'), deviceBrand: 'Jamar', deviceModel: 'Plus', gripSetting: '2', dominantSide: 'R' }
    const values = ['30', '28', '31', '27,5', '29', '']
    form.trials = form.trials.map((row, i) => ({ ...row, nativeValue: values[i] }))
    expect(buildHandgripInput(form).trials).toHaveLength(6)
    const stopped = { ...form, stoppedEarly: true, stopReasonCode: 'acute_pain' }
    const input = buildHandgripInput(stopped)
    expect(input.trials.map(item => item.seq)).toEqual([1, 2, 3, 4, 5])
    expect(input.trials[3].nativeValue).toBe(27.5)
    const original = validateAssessmentInput(input, CONTEXT).value
    expect(original.result.sideStatus).toEqual({ R: 'complete', L: 'incomplete' })
    const again = validateAssessmentInput(buildHandgripInput(handgripFormFromAssessment(original)), CONTEXT).value
    expect(isSameAssessmentData(again, original)).toBe(true)
  })
})

describe('testo del delta (registro)', () => {
  it('monolaterale: invalidata e interrotta descritte, valore con unità', () => {
    const reference = { performedAt: '2026-09-03T10:00', outcome: 'complete' }
    expect(formatMonoDelta({ assessment: { outcome: 'complete' }, reference, delta: 2, deltaUnavailable: null }, 'ripetizioni'))
      .toBe('+2 ripetizioni rispetto al 03/09')
    expect(formatMonoDelta({ assessment: { outcome: 'invalidated' }, reference, delta: null, deltaUnavailable: 'invalidated' }, 'ripetizioni'))
      .toBe('— rispetto al 03/09: questa valutazione è invalidata (protocollo non valido)')
    expect(formatMonoDelta({ assessment: { outcome: 'complete' }, reference: { ...reference, outcome: 'stopped_early' }, delta: null, deltaUnavailable: 'stopped_early' }, 'm'))
      .toBe('— rispetto al 03/09: quella precedente è interrotta')
  })

  it('bilaterale: per lato, una data se il riferimento è lo stesso', () => {
    const ref = { performedAt: '2026-09-03T10:00' }
    expect(formatBilateralDelta({ deltaBySide: { R: 12, L: -4 }, referenceBySide: { R: ref, L: ref } }, 'N')).toBe('D +12 N · S −4 N rispetto al 03/09')
    expect(formatBilateralDelta({ deltaBySide: { R: 5, L: null }, referenceBySide: { R: ref, L: null } }, 'N')).toBe('D +5 N rispetto al 03/09')
    expect(formatBilateralDelta({ deltaBySide: { R: null, L: null }, referenceBySide: { R: null, L: null } }, 'N')).toBeNull()
    expect(formatBilateralPrimary({ result: { bestBySide: { R: 245.4, L: null } } }, 'N')).toBe('D 245 · S — N')
  })
})
