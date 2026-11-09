import { describe, it, expect } from 'vitest'
import { buildTrendSeries, buildTestHistory } from '../../utils/lipedema.js'
import { LIPEDEMA_TESTS } from '../../config/lipedemaTests.config.js'
import { toTrendChartRows, describeTrend } from '../../features/assessments/assessmentTrend.js'
import { formatComparisonNote } from '../../features/assessments/assessmentFormat.js'
import { formatAssessmentSetup } from '../../features/assessments/assessmentRegistry.js'

const MWT = 'lipedema_2mwt'
const STS = 'lipedema_30s_sts'
const HANDGRIP = 'lipedema_handgrip'
const OLS = 'lipedema_ols'

const mono = (id, performedAt, distanceM, courseLengthM = 30, extra = {}) => ({
  id, testId: MWT, performedAt, status: 'valid', outcome: 'complete', result: { distanceM },
  comparability: { protocolVersion: '1.0', courseLengthM, assistiveDevice: 'none' }, ...extra,
})
const sts = (id, performedAt, repetitions, extra = {}) => ({
  id, testId: STS, performedAt, status: 'valid', outcome: 'complete', result: { repetitions },
  comparability: { protocolVersion: '1.0', chairHeightCm: 43.2, chairHasArmrests: false, armsCrossed: true }, ...extra,
})
const grip = (id, performedAt, bestBySide, extra = {}) => ({
  id, testId: HANDGRIP, performedAt, status: 'valid', outcome: 'complete',
  result: { bestBySide, sideStatus: { R: bestBySide.R === null ? 'incomplete' : 'complete', L: bestBySide.L === null ? 'incomplete' : 'complete' } },
  comparability: { protocolVersion: '1.0', deviceModelKey: 'jamar|plus', gripSettingKey: '2', deviceSerialKey: null }, ...extra,
})
const ols = (id, performedAt, bestBySide, footwear = 'barefoot', ceilingBySide = { R: false, L: false }) => ({
  id, testId: OLS, performedAt, status: 'valid', outcome: 'complete',
  result: { bestBySide, sideStatus: { R: 'complete', L: 'complete' }, ceilingBySide },
  comparability: { protocolVersion: '1.0', maxDurationS: 60, footwear, surfaceKey: 'hard_floor' },
})

describe('buildTrendSeries', () => {
  it('esclude le annullate e ordina in modo cronologico crescente', () => {
    const series = buildTrendSeries([
      mono('c', '2026-10-01T10:00', 140), mono('v', '2026-09-15T10:00', 999, 30, { status: 'voided' }), mono('a', '2026-09-01T10:00', 130),
    ], MWT)
    expect(series.points.map(point => point.assessmentId)).toEqual(['a', 'c'])
    expect(series.sides).toEqual(['value'])
  })

  it('nuovo tratto su un cambio di livello warning, non sul seriale (info)', () => {
    const base = grip('a', '2026-09-01T10:00', { R: 300, L: 280 })
    const otherSerial = grip('b', '2026-09-15T10:00', { R: 305, L: 285 }, { comparability: { ...base.comparability, deviceSerialKey: 'x' } })
    const otherGrip = grip('c', '2026-10-01T10:00', { R: 310, L: 290 }, { comparability: { ...base.comparability, gripSettingKey: '3' } })
    const series = buildTrendSeries([base, otherSerial, otherGrip], HANDGRIP)
    expect(series.points.filter(point => point.side === 'R').map(point => point.segment)).toEqual([0, 0, 1])
    expect(series.segmentCountBySide).toEqual({ R: 2, L: 2 })
  })

  it('A(30) - B(20) - C(30) sono tre tratti: C non si ricongiunge ad A', () => {
    const series = buildTrendSeries([mono('a', '2026-09-01T10:00', 130), mono('b', '2026-09-15T10:00', 100, 20), mono('c', '2026-10-01T10:00', 135)], MWT)
    expect(series.points.map(point => point.segment)).toEqual([0, 1, 2])
    expect(series.segmentCountBySide).toEqual({ value: 3 })
  })

  it('interrotta e invalidata sono "apart": fuori dalla linea, senza spezzarla né unirla', () => {
    const series = buildTrendSeries([
      mono('a', '2026-09-01T10:00', 130),
      mono('s', '2026-09-10T10:00', 90, 30, { outcome: 'stopped_early' }),
      mono('b', '2026-09-20T10:00', 138),
    ], MWT)
    expect(series.points.map(point => [point.kind, point.segment])).toEqual([['line', 0], ['apart', null], ['line', 0]])
    expect(series.apartCount).toBe(1)
    const invalidated = buildTrendSeries([sts('a', '2026-09-01T10:00', 12), sts('i', '2026-09-10T10:00', 0, { outcome: 'invalidated' })], STS)
    expect(invalidated.points[1]).toMatchObject({ kind: 'apart', value: 0, outcome: 'invalidated' })
  })

  it('bilaterale: lato incompleto senza punto, lato completo di una interrotta sulla linea', () => {
    const stopped = grip('b', '2026-09-15T10:00', { R: 305, L: null }, { outcome: 'stopped_early' })
    const series = buildTrendSeries([grip('a', '2026-09-01T10:00', { R: 300, L: 280 }), stopped], HANDGRIP)
    expect(series.points.filter(point => point.side === 'L')).toHaveLength(1)
    expect(series.points.find(point => point.assessmentId === 'b')).toMatchObject({ side: 'R', kind: 'line', outcome: 'stopped_early' })
    expect(series.apartCount).toBe(0)
  })

  it('OLS: tetto marcato sul punto e calzature diverse spezzano il tratto', () => {
    const series = buildTrendSeries([
      ols('a', '2026-09-01T10:00', { R: 60, L: 40.04 }, 'barefoot', { R: true, L: false }),
      ols('b', '2026-10-01T10:00', { R: 55.26, L: 41 }, 'shoes'),
    ], OLS)
    expect(series.points.find(point => point.side === 'R' && point.assessmentId === 'a').ceiling).toBe(true)
    expect(series.points.find(point => point.side === 'L' && point.assessmentId === 'a').value).toBe(40)
    expect(series.points.find(point => point.side === 'R' && point.assessmentId === 'b')).toMatchObject({ value: 55.3, segment: 1, ceiling: false })
  })

  it('valori arrotondati alla precisione mostrata (N senza decimali)', () => {
    const series = buildTrendSeries([grip('a', '2026-09-01T10:00', { R: 294.6, L: 270.4 })], HANDGRIP)
    expect(series.points.map(point => point.value)).toEqual([295, 270])
  })
})

describe('toTrendChartRows', () => {
  it('una riga per valutazione, chiavi per tratto e per apart', () => {
    const series = buildTrendSeries([
      mono('a', '2026-09-01T10:00', 130), mono('s', '2026-09-10T10:00', 90, 30, { outcome: 'stopped_early' }),
      mono('b', '2026-09-20T10:00', 100, 20),
    ], MWT)
    const { rows, lines, aparts } = toTrendChartRows(series)
    expect(rows.map(row => row.label)).toEqual(['01/09', '10/09', '20/09'])
    expect(rows[0]['value:0']).toBe(130)
    expect(rows[1]['value:apart']).toBe(90)
    expect(rows[1]['value:0']).toBeUndefined()
    expect(rows[2]['value:1']).toBe(100)
    expect(lines.map(line => line.key)).toEqual(['value:0', 'value:1'])
    expect(aparts).toEqual([{ key: 'value:apart', side: 'value' }])
  })

  it('due valutazioni dello stesso giorno restano due righe', () => {
    const series = buildTrendSeries([mono('a', '2026-09-01T09:00', 130), mono('b', '2026-09-01T11:00', 131)], MWT)
    expect(toTrendChartRows(series).rows.map(row => row.x)).toEqual([0, 1])
  })

  it('bilaterale: una riga per valutazione con una chiave per lato', () => {
    const series = buildTrendSeries([grip('a', '2026-09-01T10:00', { R: 300, L: 280 })], HANDGRIP)
    const { rows } = toTrendChartRows(series)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ 'R:0': 300, 'L:0': 280 })
  })
})

describe('describeTrend', () => {
  it('monolaterale, con la parte sulle interrotte solo se ce ne sono', () => {
    const series = buildTrendSeries([
      mono('a', '2026-08-06T10:00', 130), mono('b', '2026-09-10T10:00', 100, 20),
      mono('c', '2026-10-01T10:00', 90, 20, { outcome: 'stopped_early' }), mono('d', '2026-10-29T10:00', 105, 20),
    ], MWT)
    expect(describeTrend(series, LIPEDEMA_TESTS[MWT])).toBe(
      'Andamento 2-Minute Walk Test in metri: 4 valutazioni dal 06/08/2026 al 29/10/2026, 2 tratti confrontabili, fuori dalla linea 1 valutazione interrotta o invalidata.',
    )
    const clean = buildTrendSeries([mono('a', '2026-08-06T10:00', 130), mono('b', '2026-09-10T10:00', 131)], MWT)
    expect(describeTrend(clean, LIPEDEMA_TESTS[MWT])).toBe(
      'Andamento 2-Minute Walk Test in metri: 2 valutazioni dal 06/08/2026 al 10/09/2026, 1 tratto confrontabile.',
    )
  })

  it('bilaterale: una serie per lato', () => {
    const series = buildTrendSeries([
      grip('a', '2026-09-01T10:00', { R: 300, L: 280 }), grip('b', '2026-09-15T10:00', { R: 305, L: null }), grip('c', '2026-10-01T10:00', { R: 310, L: 290 }),
    ], HANDGRIP)
    expect(describeTrend(series, LIPEDEMA_TESTS[HANDGRIP])).toBe(
      'Andamento Handgrip Dynamometry in newton, una serie per lato: destra 3 valori in 1 tratto, sinistra 2 valori in 1 tratto.',
    )
  })

  it('OLS: aggiunge il tetto se presente', () => {
    const series = buildTrendSeries([
      ols('a', '2026-09-01T10:00', { R: 60, L: 40 }, 'barefoot', { R: true, L: false }), ols('b', '2026-10-01T10:00', { R: 50, L: 41 }),
    ], OLS)
    expect(describeTrend(series, LIPEDEMA_TESTS[OLS])).toBe(
      'Andamento One-Leg Standing in secondi, una serie per lato: destra 2 valori in 1 tratto, sinistra 2 valori in 1 tratto, 1 tetto a 60 s.',
    )
  })
})

describe('formatComparisonNote', () => {
  const entryOf = (assessments, id, testId = MWT) => buildTestHistory(assessments, testId).find(entry => entry.assessment.id === id)

  it('differs con delta: motivo, data della precedente e data del riferimento', () => {
    const entry = entryOf([mono('a', '2026-11-05T10:00', 130), mono('b', '2026-11-07T10:00', 100, 20), mono('c', '2026-11-09T10:00', 135)], 'c')
    expect(formatComparisonNote(entry)).toEqual(['Percorso diverso dalla valutazione del 07/11: delta rispetto al 05/11.'])
  })

  it('più motivi: uniti con virgola e "e", prima maiuscola', () => {
    const other = mono('b', '2026-11-07T10:00', 100, 20, { comparability: { protocolVersion: '2.0', courseLengthM: 20, assistiveDevice: 'cane' } })
    const entry = entryOf([mono('a', '2026-11-05T10:00', 130), other, mono('c', '2026-11-09T10:00', 135)], 'c')
    expect(formatComparisonNote(entry)[0]).toMatch(/^Protocollo diverso, percorso diverso e ausilio diverso dalla valutazione del 07\/11/)
  })

  it('differs senza delta (estremo interrotto): delta non calcolato', () => {
    const entry = entryOf([mono('a', '2026-11-05T10:00', 130), mono('b', '2026-11-07T10:00', 100, 20), mono('c', '2026-11-09T10:00', 90, 30, { outcome: 'stopped_early' })], 'c')
    expect(formatComparisonNote(entry)).toEqual(['Percorso diverso dalla valutazione del 07/11: delta non calcolato.'])
  })

  it('none_comparable: nessun delta', () => {
    const entry = entryOf([mono('a', '2026-11-05T10:00', 130), mono('b', '2026-11-07T10:00', 100, 20)], 'b')
    expect(formatComparisonNote(entry)).toEqual(['Percorso diverso dalla valutazione del 05/11: non confrontabile con nessuna valutazione precedente, delta non calcolato.'])
  })

  it('bilaterale con riferimenti diversi per lato: data per lato', () => {
    const stopped = grip('b', '2026-10-20T10:00', { R: 305, L: null }, { outcome: 'stopped_early' })
    const other = grip('x', '2026-11-07T10:00', { R: 1, L: 1 }, { comparability: { protocolVersion: '1.0', deviceModelKey: 'camry|eh', gripSettingKey: '2', deviceSerialKey: null } })
    const entry = entryOf([grip('a', '2026-10-01T10:00', { R: 300, L: 280 }), stopped, other, grip('c', '2026-11-09T10:00', { R: 310, L: 290 })], 'c', HANDGRIP)
    expect(formatComparisonNote(entry)).toEqual(['Dinamometro diverso dalla valutazione del 07/11: delta rispetto al 20/10 (D) e al 01/10 (S).'])
  })

  it('note sul seriale: diverso, mancante sulla corrente, mancante sul riferimento', () => {
    const withSerial = serial => ({ comparability: { protocolVersion: '1.0', deviceModelKey: 'jamar|plus', gripSettingKey: '2', deviceSerialKey: serial } })
    const different = entryOf([grip('a', '2026-11-05T10:00', { R: 1, L: 1 }, withSerial('e2e-1')), grip('b', '2026-11-09T10:00', { R: 1, L: 1 }, withSerial('e2e-2'))], 'b', HANDGRIP)
    expect(formatComparisonNote(different)).toEqual(['Stesso modello di dinamometro, seriale diverso dalla valutazione del 05/11: il delta resta valido.'])
    const missingNow = entryOf([grip('a', '2026-11-05T10:00', { R: 1, L: 1 }, withSerial('e2e-1')), grip('b', '2026-11-09T10:00', { R: 1, L: 1 }, withSerial(null))], 'b', HANDGRIP)
    expect(formatComparisonNote(missingNow)).toEqual(['Seriale del dinamometro non registrato in questa valutazione (presente in quella del 05/11): il delta resta valido.'])
    const missingBefore = entryOf([grip('a', '2026-11-05T10:00', { R: 1, L: 1 }, withSerial(null)), grip('b', '2026-11-09T10:00', { R: 1, L: 1 }, withSerial('e2e-1'))], 'b', HANDGRIP)
    expect(formatComparisonNote(missingBefore)).toEqual(['Seriale del dinamometro non registrato nella valutazione del 05/11: il delta resta valido.'])
  })

  it('prima valutazione o stesso protocollo: nessuna nota', () => {
    expect(formatComparisonNote(entryOf([mono('a', '2026-11-05T10:00', 130)], 'a'))).toEqual([])
    expect(formatComparisonNote(entryOf([mono('a', '2026-11-05T10:00', 130), mono('b', '2026-11-07T10:00', 131)], 'b'))).toEqual([])
  })
})

describe('formatAssessmentSetup', () => {
  it('una riga per test, dai campi salvati', () => {
    expect(formatAssessmentSetup({ testId: MWT, protocolVersion: '1.0', setup: { courseLengthM: 30, assistiveDevice: 'none' } }))
      .toBe('percorso 30 m · nessun ausilio · protocollo 1.0')
    expect(formatAssessmentSetup({ testId: STS, protocolVersion: '1.0', setup: { chairHeightCm: 43.2, chairHasArmrests: false, armsCrossed: true } }))
      .toBe('sedia 43,2 cm · senza braccioli · braccia incrociate · protocollo 1.0')
    expect(formatAssessmentSetup({ testId: HANDGRIP, protocolVersion: '1.0', setup: { device: { brand: 'Jamar', model: 'Plus', serial: 'S1' }, gripSetting: '2' } }))
      .toBe('Jamar Plus · impugnatura 2 · protocollo 1.0')
    expect(formatAssessmentSetup({ testId: 'lipedema_hhd_quadriceps', protocolVersion: '1.0', setup: { device: { brand: 'Lafayette', model: 'MMT' }, fixationMethod: 'belt', kneeAngleDeg: 90, hipAngleDeg: 90 } }))
      .toBe('Lafayette MMT · cinghia · ginocchio 90° · anca 90° · protocollo 1.0')
    expect(formatAssessmentSetup({ testId: OLS, protocolVersion: '1.0', setup: { footwear: 'barefoot', surface: 'hard_floor', surfaceNote: null } }))
      .toBe('scalza · pavimento rigido · protocollo 1.0')
  })
})
