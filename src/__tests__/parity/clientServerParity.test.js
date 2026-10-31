/**
 * Parità tra le copie client (src/) e server (functions/src/shared/).
 *
 * functions/ non può importare da src/, quindi costanti, tabelle e logica di
 * gamification sono duplicate a mano. Nessun controllo le teneva allineate:
 * i colori dei rank E+/E e LOG_MAX_ENTRIES sono divergiti senza che nessuno se
 * ne accorgesse. Se uno di questi test fallisce, aggiornare entrambe le copie.
 */
import { readFileSync } from 'fs'
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'

import * as clientConst  from '../../constants/index.js'
import { TABLES as CLIENT_TABLES } from '../../utils/tables.js'
import { calcPercentileEx as clientPercentile } from '../../utils/percentile.js'
import * as clientPlans  from '../../config/plans.config.js'
import * as clientGame   from '../../utils/gamification.js'

import * as serverConst  from '../../../functions/src/shared/constants.js'
import { TABLES as SERVER_TABLES } from '../../../functions/src/shared/tables.js'
import { TESTS_META }    from '../../../functions/src/shared/testsMeta.js'
import { calcPercentileEx as serverPercentile } from '../../../functions/src/shared/percentile.js'
import * as serverPlans  from '../../../functions/src/shared/plans.js'
import * as serverGame   from '../../../functions/src/shared/gamification.js'
import * as clientModules from '../../config/modules.config.js'
import * as serverSoccer  from '../../../functions/src/shared/soccer.js'
import * as serverModules from '../../../functions/src/shared/modules.js'
import * as clientBadges  from '../../utils/badges.js'
import * as serverBadges  from '../../../functions/src/shared/badges.js'
import { MAX_RECURRENCE_SLOTS as CLIENT_MAX_REC } from '../../utils/calendarUtils.js'
import { MAX_RECURRENCE_SLOTS as SERVER_MAX_REC } from '../../../functions/src/shared/calendarUtils.js'
import * as clientLipedema from '../../utils/lipedema.js'
import * as serverLipedema from '../../../functions/src/shared/lipedema.js'
import * as serverTimezone from '../../../functions/src/shared/timezone.js'

const AGES  = Array.from({ length: 66 }, (_, i) => i + 5)   // 5..70
const SEXES = ['M', 'F']

describe('Costanti', () => {
  it('RANKS identici (soglie, label, colori)', () => {
    expect(serverConst.RANKS).toEqual(clientConst.RANKS)
  })

  it('LOG_MAX_ENTRIES e XP_PER_LEVEL_MULTIPLIER identici', () => {
    expect(serverConst.PLAN_COMPLETION_XP).toBe(clientConst.PLAN_COMPLETION_XP)
    expect(serverConst.MAX_PLAN_SESSIONS).toBe(clientConst.MAX_PLAN_SESSIONS)
    expect(serverConst.LOG_MAX_ENTRIES).toBe(clientConst.LOG_MAX_ENTRIES)
    expect(serverConst.XP_PER_LEVEL_MULTIPLIER).toBe(clientConst.XP_PER_LEVEL_MULTIPLIER)
  })

  it('limiti piano identici', () => {
    for (const plan of ['free', 'pro', 'enterprise', undefined, 'sconosciuto']) {
      expect(serverPlans.getPlanLimits(plan).trainers).toBe(clientPlans.getPlanLimits(plan).trainers)
      expect(serverPlans.getPlanLimits(plan).clients).toBe(clientPlans.getPlanLimits(plan).clients)
    }
  })
})

describe('Test atletici', () => {
  it('stesso insieme di test', () => {
    const clientKeys = clientConst.ALL_TESTS.map(t => t.key).sort()
    const serverKeys = TESTS_META.map(t => t.key).sort()
    expect(serverKeys).toEqual(clientKeys)
  })

  it.each(TESTS_META.map(t => [t.key, t]))('%s: stat, direction, categories, variables, formulaType e ageGroup identici', (key, serverTest) => {
    const clientTest = clientConst.ALL_TESTS.find(t => t.key === key)
    expect(serverTest.stat).toBe(clientTest.stat)
    expect(serverTest.direction).toBe(clientTest.direction)
    expect(serverTest.categories).toEqual(clientTest.categories)
    expect(serverTest.formulaType).toEqual(clientTest.formulaType)
    expect(serverTest.variables?.map(v => v.key ?? v)).toEqual(clientTest.variables?.map(v => v.key ?? v))
    for (const age of AGES) {
      for (const sex of SEXES) {
        expect(serverTest.ageGroup(age, sex), `età ${age} ${sex}`).toBe(clientTest.ageGroup(age, sex))
      }
    }
  })

  it('tabelle percentili identiche', () => {
    expect(SERVER_TABLES).toEqual(CLIENT_TABLES)
  })

  it('calcPercentileEx dà lo stesso risultato su una griglia di valori reali', () => {
    for (const test of clientConst.ALL_TESTS) {
      const values = [...new Set(JSON.stringify(CLIENT_TABLES[test.key] ?? {})
        .match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [])]
      const probes = values.flatMap(v => [v - 0.5, v, v + 0.5])
      for (const sex of SEXES) {
        for (const age of [7, 9, 11, 13, 15, 17, 25, 40, 55, 70]) {
          for (const value of probes) {
            const c = clientPercentile(test.stat, value, sex, age, test.key)
            const s = serverPercentile(test.stat, value, sex, age, test.key)
            expect(s, `${test.key} ${sex} ${age} ${value}`).toEqual(c)
          }
        }
      }
    }
  })
})

describe('Gamification', () => {
  // Stessa data per le due copie: log e campionamenti contengono data e timestamp
  beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-23T10:00:00Z')) })
  afterAll(() => { vi.useRealTimers() })

  const client = {
    xp: 420, xpNext: 500, level: 3, sessionStreak: 2, sessionCount: 7,
    log: [{ date: '01 ott', action: 'x', xp: 10, ts: 1 }],
    campionamenti: [{ date: '01 set', stats: { forza: 40, velocita: 55 }, media: 48 }],
    biaHistory: [], lastBia: null, profileType: 'tests_only',
  }

  it('buildXPUpdate', () => {
    expect(serverGame.buildXPUpdate(client, 120, 'Bonus')).toEqual(clientGame.buildXPUpdate(client, 120, 'Bonus'))
  })

  it('buildCampionamentoUpdate (testo del log escluso)', () => {
    // Il testo del log lo costruisce il client (ha label/unit dei test) e lo passa
    // al server come logAction: diverso per costruzione, tutto il resto no.
    const stats  = { forza: 52, velocita: 50, resistenza: 70 }
    const tests  = { sprint_20m: 3.4 }
    const c      = clientGame.buildCampionamentoUpdate(client, stats, tests)
    const s      = serverGame.buildCampionamentoUpdate(client, stats, tests, c.update.log[0].action)
    expect(s.update).toEqual(c.update)
    expect(s.campionamento).toEqual(c.campionamento)
  })

  it.each([
    ['senza test (wizard attuale)', { name: 'A', profileType: 'tests_only' }],
    ['con stats', { name: 'B', profileType: 'tests_only', stats: { forza: 60 }, testValues: { x: 1 } }],
    ['bia_only', { name: 'C', profileType: 'bia_only' }],
  ])('buildNewClient %s', (_label, form) => {
    const defaults = { xp: 0, xpNext: 500, level: 1 }
    expect(serverGame.buildNewClient('t1', form, defaults)).toEqual(clientGame.buildNewClient('t1', form, defaults))
  })
})

describe('Fasce soccer', () => {
  it('getCategoriaFromEta identica per ogni età', () => {
    for (let age = 3; age <= 40; age++) {
      expect(serverSoccer.getCategoriaFromEta(age), `età ${age}`).toBe(clientModules.getCategoriaFromEta(age))
    }
  })

  it('resolveCategoria identica (soccer, PT, dati mancanti)', () => {
    const casi = [
      { categoria: 'soccer_youth', dataNascita: '2016-03-10' },
      { categoria: 'soccer_junior', dataNascita: '2011-12-31' },
      { categoria: 'soccer', eta: 9 },
      { categoria: 'soccer_youth' },
      { categoria: 'active', dataNascita: '1990-01-01' },
      { categoria: null },
    ]
    for (const c of casi) expect(serverSoccer.resolveCategoria(c)).toBe(clientModules.resolveCategoria(c))
  })
})

describe('Trofei automatici', () => {
  it('stessi badge per gli stessi dati cliente', () => {
    const casi = [
      {},
      { sessionCount: 1 },
      { sessionCount: 10, campionamenti: [{}], media: 92, rank: 'EX' },
      { sessionCount: 26, badges: { prima_sessione: {}, striscia_5: {} } },
      { log: [{ action: 'Sessione di allenamento (streak 1)' }, { action: '+50 XP' }] },
      { campionamenti: [{}], media: 0 },
    ]
    for (const c of casi) {
      expect(serverBadges.checkAutoBadges(c)).toEqual(clientBadges.checkAutoBadges(c))
      expect(serverBadges.getSessionCount(c)).toBe(clientBadges.getSessionCount(c))
    }
  })
})

describe('Ricorrenze', () => {
  it('stesso tetto di sessioni per ricorrenza', () => {
    expect(SERVER_MAX_REC).toBe(CLIENT_MAX_REC)
    expect(SERVER_MAX_REC + 1).toBeLessThanOrEqual(499)   // ricorrenza + slot in un solo batch
  })
})

describe('Capability per modulo', () => {
  it('stessi moduli', () => {
    expect(serverModules.MODULES).toEqual(clientModules.MODULES)
    expect(Object.keys(serverModules.MODULE_CAPABILITIES).sort())
      .toEqual(Object.keys(clientModules.MODULE_CAPABILITIES).sort())
  })

  it('ogni flag server è un flag client', () => {
    for (const key of serverModules.SERVER_CAPABILITY_KEYS) {
      expect(clientModules.CAPABILITY_KEYS).toContain(key)
    }
  })

  it.each(Object.keys(clientModules.MODULE_CAPABILITIES))('%s: i flag server coincidono con quelli client', (moduleType) => {
    const client = clientModules.MODULE_CAPABILITIES[moduleType]
    const server = serverModules.MODULE_CAPABILITIES[moduleType]
    expect(Object.keys(server).sort()).toEqual([...serverModules.SERVER_CAPABILITY_KEYS].sort())
    for (const key of serverModules.SERVER_CAPABILITY_KEYS) {
      expect([key, server[key]]).toEqual([key, client[key]])
    }
  })

  it('server: assente = PT legacy, sconosciuto = null (rifiutato dalle callable)', () => {
    expect(serverModules.resolveModuleCapabilities(null)).toEqual(serverModules.MODULE_CAPABILITIES.personal_training)
    expect(serverModules.resolveModuleCapabilities(undefined)).toEqual(serverModules.MODULE_CAPABILITIES.personal_training)
    expect(serverModules.resolveModuleCapabilities('qualcosa')).toBeNull()
  })
})

describe('Lipedema — valutazioni e informativa (ADR-014 rischio #3)', () => {
  const CORE_CONSTANTS = [
    'LIPEDEMA_TEST_IDS', 'ASSESSMENT_STATUS', 'ASSESSMENT_OUTCOME', 'TWO_MINUTE_WALK',
    'ASSISTIVE_DEVICES', 'STOP_REASON_CODES', 'PAIN_SCALE', 'PRIVACY_NOTICE_MISSING',
    'CLINICAL_RANGES', 'TEXT_LIMITS', 'MAX_TESTS_PER_VISIT',
    'SIT_TO_STAND_30S', 'HANDGRIP', 'INVALID_TRIAL_REASONS', 'LIMB_STOP_REASON_CODES',
    'DOMINANT_SIDES', 'BILATERAL_SIDE_STATUS',
  ]
  const CORE_FUNCTIONS = [
    'requiresPrivacyNotice', 'computeTwoMinuteWalkResult', 'validateAssessmentInput',
    'validatePrivacyNoticeInput', 'validateVoidReason', 'patientAgeAt', 'formatLocalDateTime',
    'computeSitToStandResult', 'computeBilateralResult', 'normalizeKey', 'isStandardChairHeight',
  ]
  const CONTEXT = { nowLocal: '2026-10-30T11:00', birthDate: '1985-03-12' }
  const BASE = {
    testId: 'lipedema_2mwt', performedAt: '2026-10-30T10:30',
    setup: { courseLengthM: 30, assistiveDevice: 'none' },
    trial: { fullLengths: 4, partialDistanceM: 22 },
    events: { stoppedEarly: false, pauseCount: 0 },
    clinical: {}, deviation: { present: false },
  }
  const CASES = [
    BASE,
    { ...BASE, setup: { courseLengthM: 15.3, assistiveDevice: 'other', assistiveDeviceNote: ' deambulatore ', variantConfirmed: true }, trial: { fullLengths: 7, partialDistanceM: 0.4 } },
    { ...BASE, setup: { courseLengthM: 20, assistiveDevice: 'none' } },
    { ...BASE, trial: { fullLengths: 4, partialDistanceM: 30 } },
    { ...BASE, events: { stoppedEarly: true, stopTimeS: 85, pauseCount: 2, pauseDurationS: 12 }, clinical: { stopReasonCode: 'other', stopReasonNote: 'x' } },
    { ...BASE, events: { stoppedEarly: true, stopTimeS: 85, pauseCount: 0 }, clinical: {} },
    { ...BASE, clinical: { painPre: 3, dyspneaPost: 4.5, bpSysPre: 120, bpDiaPre: 80, hrPostBpm: 251, spo2PrePct: 97 } },
    { ...BASE, clinical: { bpSysPre: 120 } },
    { ...BASE, performedAt: '2026-10-30T12:00' },
    { ...BASE, performedAt: '1980-01-01T10:00' },
    { ...BASE, deviation: { present: true, note: '  ' }, notes: 'x'.repeat(1001) },
    { ...BASE, testId: 'sconosciuto' },
    {},
  ]

  // 30s-STS (ADR-016 §6)
  const STS = {
    testId: 'lipedema_30s_sts', performedAt: '2026-10-30T10:30',
    setup:  { chairHeightCm: 43.2, chairHasArmrests: false, armsCrossed: true },
    trial:  { completeRepetitions: 14, partialRepCounted: false },
    events: { usedArms: false, stoppedEarly: false, technicalError: false, familiarizationDone: true, pauseCount: 0 },
    clinical: {}, deviation: { present: false },
  }
  const STS_CASES = [
    STS,
    { ...STS, trial: { completeRepetitions: 14, partialRepCounted: true } },
    { ...STS, trial: { completeRepetitions: 6, partialRepCounted: false }, events: { ...STS.events, usedArms: true, usedArmsNote: ' spinta sulle cosce ' } },
    { ...STS, trial: { partialRepCounted: false }, events: { ...STS.events, usedArms: true } },
    { ...STS, events: { ...STS.events, usedArms: true, stoppedEarly: true, stopTimeS: 12 }, clinical: { stopReasonCode: 'dizziness' } },
    { ...STS, trial: { completeRepetitions: 9, partialRepCounted: true }, events: { ...STS.events, stoppedEarly: true, stopTimeS: 22 }, clinical: { stopReasonCode: 'lower_limb_pain' } },
    { ...STS, trial: { completeRepetitions: 9, partialRepCounted: false }, events: { ...STS.events, stoppedEarly: true, stopTimeS: 22, pauseCount: 1, pauseDurationS: 23 }, clinical: { stopReasonCode: 'other', stopReasonNote: 'x' } },
    { ...STS, setup: { chairHeightCm: 45, chairHasArmrests: false, armsCrossed: true } },
    { ...STS, setup: { chairHeightCm: 45, chairHasArmrests: false, armsCrossed: true, variantConfirmed: true } },
    { ...STS, setup: { chairHeightCm: 43.7, chairHasArmrests: false, armsCrossed: true } },
    { ...STS, setup: { chairHeightCm: 43.2, chairHasArmrests: true, armsCrossed: true } },
    { ...STS, setup: { chairHeightCm: 43.2, chairHasArmrests: true, armsCrossed: false }, deviation: { present: true, note: 'braccioli' } },
    { ...STS, events: { ...STS.events, technicalError: true } },
    { ...STS, clinical: { painPre: 2, fatiguePost: 3.5, hrPreBpm: 80, bpSysPre: 120 } },
    { ...STS, trial: { completeRepetitions: 60, partialRepCounted: true } },
    { ...STS, events: { usedArms: 'no' } },
  ]

  // Handgrip: 6 prove D-S alternate (ADR-016 §1-3)
  const grip = (side, nativeValue, extra = {}) => ({ side, valid: true, nativeValue, ...extra })
  const numbered = trials => trials.map((trial, i) => ({ seq: i + 1, ...trial }))
  const SIX_RAW = [grip('R', 30), grip('L', 28), grip('R', 31.5), grip('L', 27), grip('R', 29), grip('L', 28.25)]
  const SIX = numbered(SIX_RAW)
  const HANDGRIP_BASE = {
    testId: 'lipedema_handgrip', performedAt: '2026-10-30T10:30',
    setup:  { dominantSide: 'R', device: { brand: ' Jamar ', model: 'Plus+', serial: 'A12' }, gripSetting: 'Posizione 2', nativeUnit: 'N' },
    trials: SIX, events: { stoppedEarly: false }, clinical: {}, deviation: { present: false },
  }
  const HANDGRIP_CASES = [
    HANDGRIP_BASE,
    { ...HANDGRIP_BASE, setup: { ...HANDGRIP_BASE.setup, nativeUnit: 'kgf' } },
    { ...HANDGRIP_BASE, trials: numbered([grip('R', 30), grip('L', 28, { valid: false, invalidReason: 'technique_error', pain: 4 }), grip('L', 28), grip('R', 31), grip('L', 27), grip('R', 29), grip('L', 26)]) },
    { ...HANDGRIP_BASE, trials: numbered([...SIX_RAW, grip('R', 33)]) },
    { ...HANDGRIP_BASE, trials: numbered([grip('R', 30), ...Array(4).fill(grip('L', null, { valid: false, invalidReason: 'device_error' }))]), events: { stoppedEarly: true }, clinical: { stopReasonCode: 'acute_pain' } },
    { ...HANDGRIP_BASE, trials: numbered([grip('R', 30), grip('R', 31), grip('R', 29)]), events: { stoppedEarly: true }, clinical: { stopReasonCode: 'contraindication' } },
    { ...HANDGRIP_BASE, trials: numbered([grip('R', 30), grip('L', 28), grip('R', 31), grip('L', 27), grip('R', 29)]), events: { stoppedEarly: true }, clinical: { stopReasonCode: 'neurological_symptoms', stopReasonNote: 'formicolio' } },
    { ...HANDGRIP_BASE, trials: numbered([grip('R', 30), grip('L', 28), grip('R', 31), grip('L', 27), grip('R', 29)]) },
    { ...HANDGRIP_BASE, trials: numbered([grip('R', null, { valid: false, invalidReason: 'other', note: 'scivolata' }), ...SIX_RAW]) },
    { ...HANDGRIP_BASE, trials: numbered([grip('R', null, { valid: false, invalidReason: 'other' }), ...SIX_RAW]) },
    { ...HANDGRIP_BASE, trials: SIX.map((trial, i) => (i === 2 ? { ...trial, seq: 9 } : trial)) },
    { ...HANDGRIP_BASE, setup: { ...HANDGRIP_BASE.setup, dominantSide: 'X', device: { brand: '', model: 'x'.repeat(61) }, gripSetting: '  ', nativeUnit: 'lbf' } },
    { ...HANDGRIP_BASE, trials: numbered([grip('R', 30.123), grip('L', 1001), grip('R', 0), grip('L', '28'), grip('R', 29, { pain: 11 }), grip('L', 28)]) },
    { ...HANDGRIP_BASE, events: { stoppedEarly: true }, clinical: { stopReasonCode: 'chest_pain' } },
    { ...HANDGRIP_BASE, trials: 'sei prove' },
    { ...HANDGRIP_BASE, trials: numbered([grip('R', 30, { valid: false, invalidReason: 'support_or_assistance' }), ...SIX_RAW]) },
  ]

  const coreFile = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
  const SERVER_FILE = '../../../functions/src/shared/lipedema.js'

  it('il blocco CORE è identico, riga per riga, nelle due copie', () => {
    const core = relativePath => {
      const text = coreFile(relativePath)
      return text.slice(text.indexOf('export const LIPEDEMA_TEST_IDS'), text.indexOf('// ── Fine CORE'))
    }
    const server = core(SERVER_FILE)
    expect(server.length).toBeGreaterThan(1000)
    expect(core('../../utils/lipedema.js')).toBe(server)
  })

  it('copia server: marcatore "Fine CORE" presente, prima del CORE solo commenti', () => {
    const text = coreFile(SERVER_FILE)
    expect(text).toContain('// ── Fine CORE')
    const before = text.slice(0, text.indexOf('export const LIPEDEMA_TEST_IDS'))
    expect(before.split('\n').filter(line => line.trim() !== '' && !line.trim().startsWith('//'))).toEqual([])
  })

  it('copia server: nessun codice dopo "Fine CORE" (sfuggirebbe al confronto)', () => {
    const text = coreFile(SERVER_FILE)
    const afterMarker = text.slice(text.indexOf('// ── Fine CORE'))
    expect(afterMarker.split('\n').slice(1).join('\n').trim()).toBe('')
  })

  it('copia server: nessun import (la CI non installa functions/node_modules, 281bbe4)', () => {
    const text = coreFile(SERVER_FILE)
    expect(text).not.toMatch(/^\s*import[\s{*'"]/m)
    expect(text).not.toMatch(/\bimport\s*\(/)
  })

  it.each([...STS_CASES, ...HANDGRIP_CASES].map((input, i) => [i, input.testId, input]))(
    'validateAssessmentInput STS/Handgrip caso %i (%s): stessi errori e stesso valore salvato',
    (_i, _testId, input) => {
      expect(serverLipedema.validateAssessmentInput(input, CONTEXT)).toEqual(clientLipedema.validateAssessmentInput(input, CONTEXT))
    },
  )

  it('computeBilateralResult identico con HANDGRIP e con una specifica sintetica tipo OLS', () => {
    const OLS_LIKE = {
      protocolVersion: '1.0', sides: ['R', 'L'], validTrialsPerSide: 2, maxInvalidPerSide: 3,
      canonicalUnit: 's', unitFactors: { s: 1 }, inputDecimals: 1, ceiling: 60,
    }
    const pools = { R: [0.1, 12.5, 60, 31.2, null], L: [60, 8, 8, 44.4, null] }
    for (const spec of [clientLipedema.HANDGRIP, OLS_LIKE]) {
      for (let mask = 0; mask < 2 ** 8; mask += 1) {
        const trials = []
        for (let i = 0; i < 8; i += 1) {
          const side  = i % 2 === 0 ? 'R' : 'L'
          const value = pools[side][i % pools[side].length]
          if (mask & (1 << i)) trials.push({ seq: trials.length + 1, side, valid: value !== null && i % 3 !== 2, value })
        }
        expect(serverLipedema.computeBilateralResult(trials, spec)).toEqual(clientLipedema.computeBilateralResult(trials, spec))
      }
    }
  })

  it('normalizeKey e isStandardChairHeight identici', () => {
    for (const text of [' Jamar ', 'PLUS+', '', null, undefined]) {
      expect(serverLipedema.normalizeKey(text)).toBe(clientLipedema.normalizeKey(text))
    }
    for (const height of [42.6, 42.7, 43.2, 43.7, 43.8, 45]) {
      expect(serverLipedema.isStandardChairHeight(height)).toBe(clientLipedema.isStandardChairHeight(height))
    }
  })

  it('computeSitToStandResult identico', () => {
    for (const usedArms of [false, true]) {
      for (const partialRepCounted of [false, true]) {
        for (const stopTimeS of [null, 12]) {
          for (const completeRepetitions of [0, 14, 59, null]) {
            const input = { completeRepetitions, partialRepCounted, usedArms, stopTimeS }
            expect(serverLipedema.computeSitToStandResult(input)).toEqual(clientLipedema.computeSitToStandResult(input))
          }
        }
      }
    }
  })

  it('costanti del CORE identiche', () => {
    for (const name of CORE_CONSTANTS) expect([name, serverLipedema[name]]).toEqual([name, clientLipedema[name]])
  })

  it('stesse funzioni del CORE esportate da entrambe le copie', () => {
    for (const name of CORE_FUNCTIONS) {
      expect(typeof serverLipedema[name], name).toBe('function')
      expect(typeof clientLipedema[name], name).toBe('function')
    }
  })

  it.each(CASES.map((input, i) => [i, input]))('validateAssessmentInput caso %i: stessi errori e stesso valore salvato', (_i, input) => {
    expect(serverLipedema.validateAssessmentInput(input, CONTEXT)).toEqual(clientLipedema.validateAssessmentInput(input, CONTEXT))
  })

  it('computeTwoMinuteWalkResult identico su una griglia di input', () => {
    for (const courseLengthM of [5, 10.5, 15.2, 15.3, 20, 30]) {
      for (const fullLengths of [0, 1, 3, 7, 12]) {
        for (const partialDistanceM of [0, 0.4, 0.5, 2.5, 4.9]) {
          for (const durationS of [60, 85, 120]) {
            const input = { courseLengthM, fullLengths, partialDistanceM, durationS }
            expect(serverLipedema.computeTwoMinuteWalkResult(input)).toEqual(clientLipedema.computeTwoMinuteWalkResult(input))
          }
        }
      }
    }
  })

  it('informativa, motivo di annullamento, età e capability identici', () => {
    const notices = [
      { informativaVersion: ' v2.1 ', deliveredAt: '2026-10-01' }, { informativaVersion: '', deliveredAt: '2026-10-01' },
      { informativaVersion: 'v1', deliveredAt: '2026-11-01' }, { informativaVersion: 'v1', deliveredAt: '1980-01-01' }, {},
    ]
    for (const notice of notices) {
      const context = { today: '2026-10-30', birthDate: '1985-03-12' }
      expect(serverLipedema.validatePrivacyNoticeInput(notice, context)).toEqual(clientLipedema.validatePrivacyNoticeInput(notice, context))
    }
    for (const reason of ['', '  ', 'ok', 'x'.repeat(501), 42, undefined]) {
      expect(serverLipedema.validateVoidReason(reason)).toEqual(clientLipedema.validateVoidReason(reason))
    }
    for (const [birth, at] of [['1985-03-12', '2026-03-11T10:00'], ['1985-03-12', '2026-03-12T10:00'], [null, '2026-01-01T10:00']]) {
      expect(serverLipedema.patientAgeAt(birth, at)).toBe(clientLipedema.patientAgeAt(birth, at))
    }
    for (const moduleType of Object.keys(clientModules.MODULE_CAPABILITIES)) {
      expect(serverLipedema.requiresPrivacyNotice(serverModules.MODULE_CAPABILITIES[moduleType]))
        .toBe(clientLipedema.requiresPrivacyNotice(clientModules.MODULE_CAPABILITIES[moduleType]))
    }
    const date = new Date('2026-10-30T10:00:00Z')
    expect(serverLipedema.formatLocalDateTime(date, 'Europe/Rome')).toBe(clientLipedema.formatLocalDateTime(date, 'Europe/Rome'))
  })

  it('stesso fuso degli studi per "adesso" e "non futura" (client = server)', () => {
    expect(clientLipedema.LOCAL_TIME_ZONE).toBe(serverTimezone.LOCAL_TIME_ZONE)
  })
})
