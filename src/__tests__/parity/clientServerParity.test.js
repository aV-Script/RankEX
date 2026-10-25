/**
 * Parità tra le copie client (src/) e server (functions/src/shared/).
 *
 * functions/ non può importare da src/, quindi costanti, tabelle e logica di
 * gamification sono duplicate a mano. Nessun controllo le teneva allineate:
 * i colori dei rank E+/E e LOG_MAX_ENTRIES sono divergiti senza che nessuno se
 * ne accorgesse. Se uno di questi test fallisce, aggiornare entrambe le copie.
 */
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
