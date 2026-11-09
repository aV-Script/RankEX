import { describe, it, expect } from 'vitest'
import { LIPEDEMA_TEST_ORDER, LIPEDEMA_TESTS } from '../../config/lipedemaTests.config.js'
import {
  buildLipedemaReportRows, buildReportBia, formatBiaDate, getReportExaminers, getClinicalLines, NOT_PERFORMED_TEXT, FIRST_ASSESSMENT_TEXT,
} from '../../features/assessments/lipedemaReportModel.js'

const mono = (id, performedAt, distanceM, courseLengthM = 30, extra = {}) => ({
  id, testId: 'lipedema_2mwt', performedAt, status: 'valid', outcome: 'complete', protocolVersion: '1.0',
  examinerName: 'Dott.ssa Demo', setup: { courseLengthM, assistiveDevice: 'none' }, result: { distanceM },
  comparability: { protocolVersion: '1.0', courseLengthM, assistiveDevice: 'none' }, clinical: {}, deviation: { present: false }, ...extra,
})
const grip = (id, performedAt, bestBySide, extra = {}) => ({
  id, testId: 'lipedema_handgrip', performedAt, status: 'valid', outcome: 'complete', protocolVersion: '1.0',
  setup: { device: { brand: 'Jamar', model: 'Plus' }, gripSetting: '2' },
  result: { bestBySide, sideStatus: { R: 'complete', L: 'complete' } },
  comparability: { protocolVersion: '1.0', deviceModelKey: 'jamar|plus', gripSettingKey: '2', deviceSerialKey: null }, clinical: {}, ...extra,
})

describe('buildLipedemaReportRows', () => {
  it('una riga per test, nell\'ordine ufficiale, anche mai eseguito', () => {
    const rows = buildLipedemaReportRows([mono('a', '2026-10-01T10:00', 130)])
    expect(rows.map(row => row.testId)).toEqual(LIPEDEMA_TEST_ORDER)
    expect(rows.filter(row => !row.isPerformed).map(row => row.shortName)).toEqual(['30s-STS', 'Handgrip', 'HHD', 'OLS'])
    expect(rows[1]).toMatchObject({ primary: null, performedAt: null, badges: [], notes: [], clinical: [] })
    expect(NOT_PERFORMED_TEXT).toBe('Non ancora eseguito')
  })

  it('ultima valutazione VALIDA per test, ognuna con la sua data; le annullate non entrano', () => {
    const rows = buildLipedemaReportRows([
      mono('a', '2026-09-01T10:00', 130),
      mono('v', '2026-10-20T10:00', 999, 30, { status: 'voided' }),
      mono('b', '2026-10-01T10:00', 140),
      grip('g', '2026-10-15T10:00', { R: 245.4, L: 231 }),
    ])
    expect(rows[0]).toMatchObject({ performedAt: '2026-10-01T10:00', primary: '140 m', delta: '+10 m rispetto al 01/09' })
    expect(rows[2]).toMatchObject({ performedAt: '2026-10-15T10:00', primary: 'D 245 · S 231 N', delta: FIRST_ASSESSMENT_TEXT })
  })

  it('setup, professionista e note di comparabilità come nella UI', () => {
    const rows = buildLipedemaReportRows([
      mono('a', '2026-09-01T10:00', 130), mono('b', '2026-09-15T10:00', 100, 20), mono('c', '2026-10-01T10:00', 135),
    ])
    expect(rows[0].setup).toBe('percorso 30 m · nessun ausilio · protocollo 1.0')
    expect(rows[0].examinerName).toBe('Dott.ssa Demo')
    expect(rows[0].badges).toContain('DIVERSA DALLA PRECEDENTE · percorso diverso')
    expect(rows[0].notes).toEqual(['Percorso diverso dalla valutazione del 15/09: delta rispetto al 01/09.'])
  })

  it('senza storico: tutti i test mai eseguiti', () => {
    expect(buildLipedemaReportRows([]).every(row => !row.isPerformed)).toBe(true)
  })
})

describe('getReportExaminers', () => {
  it('professionisti distinti, senza vuoti', () => {
    expect(getReportExaminers([{ examinerName: 'A' }, { examinerName: null }, { examinerName: 'B' }, { examinerName: 'A' }])).toEqual(['A', 'B'])
  })
})

describe('getClinicalLines', () => {
  it('solo i dati compilati: pre/post, dolore, sintomi, condizioni, deviazione, note', () => {
    const test = LIPEDEMA_TESTS.lipedema_2mwt
    const lines = getClinicalLines(mono('a', 'x', 1, 30, {
      clinical: { painPre: 2, painPost: 3, dyspneaPost: 4.5, conditionsNote: 'raffreddore' },
      deviation: { present: true, note: 'corridoio stretto' }, notes: 'ok',
    }), test)
    expect(lines).toEqual([
      { label: 'Dolore (NRS 0–10)', value: 'pre 2 · post 3' },
      { label: 'Dispnea (Borg 0–10)', value: 'pre — · post 4.5' },
      { label: 'Condizioni concomitanti', value: 'raffreddore' },
      { label: 'Deviazione dal protocollo', value: 'corridoio stretto' },
      { label: 'Note', value: 'ok' },
    ])
    expect(getClinicalLines(mono('b', 'x', 1), test)).toEqual([])
  })

  it('bilaterali e OLS: dolore massimo per lato, dolore unico e sintomi', () => {
    const lines = getClinicalLines(
      grip('g', 'x', { R: 1, L: 1 }, { clinical: { painMaxBySide: { R: 3, L: null }, pain: 2, symptomsNote: 'lieve capogiro' } }),
      LIPEDEMA_TESTS.lipedema_ols,
    )
    expect(lines.map(line => line.label)).toEqual(['Dolore (NRS)', 'Dolore massimo (NRS)', 'Sintomi'])
    expect(lines[1].value).toBe('D 3')
  })
})

describe('buildReportBia', () => {
  it('null senza BIA o senza valori; altrimenti solo i parametri presenti', () => {
    expect(buildReportBia(null)).toBeNull()
    expect(buildReportBia({})).toBeNull()
    const bia = buildReportBia({ fatMassPercent: 31.5, muscleMassKg: 24, date: '02 nov' })
    expect(bia.date).toBe('02/11')
    expect(bia.items).toEqual([
      { label: 'Massa grassa', value: '31,5 %' },
      { label: 'Massa muscolare', value: '24 kg' },
    ])
  })
})

describe('formatBiaDate', () => {
  it('"09 nov" → "09/11"; formato sconosciuto o assente', () => {
    expect(formatBiaDate('09 nov')).toBe('09/11')
    expect(formatBiaDate('5 gen.')).toBe('05/01')
    expect(formatBiaDate('31 dic')).toBe('31/12')
    expect(formatBiaDate('boh')).toBe('boh')
    expect(formatBiaDate(undefined)).toBeNull()
  })
})

describe('motivo di interruzione nel PDF', () => {
  it('etichetta dal catalogo + nota, solo se presente', () => {
    const stopped = mono('s', 'x', 90, 30, { outcome: 'stopped_early', clinical: { stopReasonCode: 'dyspnea', stopReasonNote: 'dopo 85 s' } })
    expect(getClinicalLines(stopped, LIPEDEMA_TESTS.lipedema_2mwt)).toEqual([
      { label: 'Motivo interruzione', value: 'Dispnea intollerabile · dopo 85 s' },
    ])
    const limb = grip('g', 'x', { R: 1, L: null }, { clinical: { stopReasonCode: 'cramps' } })
    expect(getClinicalLines(limb, LIPEDEMA_TESTS.lipedema_handgrip)[0].value).toBe('Crampi importanti')
    expect(getClinicalLines(mono('n', 'x', 1), LIPEDEMA_TESTS.lipedema_2mwt)).toEqual([])
  })
})
