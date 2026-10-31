import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  computeTwoMinuteWalkResult, validateAssessmentInput, validatePrivacyNoticeInput, validateVoidReason,
  patientAgeAt, requiresPrivacyNotice, buildTestHistory, getLatestValidByTest, getComparabilityIssues,
  isPrivacyNoticeMissingError, PRIVACY_NOTICE_MISSING, isSameAssessmentData, nowLocalDateTime, todayLocalDate, LOCAL_TIME_ZONE,
} from '../../utils/lipedema.js'
import { getModule, MODULES } from '../../config/modules.config.js'
import {
  createTwoMinuteWalkForm, formFromAssessment, buildTwoMinuteWalkInput, toNumber, countClinicalFilled,
} from '../../features/assessments/twoMinuteWalkFormModel.js'

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
