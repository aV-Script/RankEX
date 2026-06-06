import { describe, it, expect } from 'vitest'
import {
  calcSessionXP,
  calcStreakPreview,
  buildXPUpdate,
  buildCampionamentoUpdate,
  buildBiaUpdate,
  buildProfileUpgrade,
  buildNewClient,
} from '../../utils/gamification.js'

// ── Dati di base riusabili ────────────────────────────────────────────────────
const clienteBase = {
  xp:            0,
  xpNext:        500,
  level:         1,
  log:           [],
  campionamenti: [],
  biaHistory:    [],
  lastBia:       null,
  sessionStreak: 0,
  profileType:   'tests_only',
}

// ── calcSessionXP (US-045) ────────────────────────────────────────────────────
describe('calcSessionXP', () => {
  it('streak 0 → nessun bonus (moltiplicatore 1.0)', () => {
    expect(calcSessionXP(100, 0)).toBe(100)
  })

  it('streak 1 → +10%', () => {
    expect(calcSessionXP(100, 1)).toBe(110)
  })

  it('streak 5 → +50%', () => {
    expect(calcSessionXP(100, 5)).toBe(150)
  })

  it('streak 10 → cap ×2.0', () => {
    expect(calcSessionXP(100, 10)).toBe(200)
  })

  it('streak 20 → ancora cap ×2.0 (non supera il massimo)', () => {
    expect(calcSessionXP(100, 20)).toBe(200)
  })

  it('arrotonda il risultato a intero', () => {
    const xp = calcSessionXP(33, 1) // 33 × 1.1 = 36.3 → 36
    expect(Number.isInteger(xp)).toBe(true)
  })

  it('streak default 0 se non passato', () => {
    expect(calcSessionXP(50)).toBe(50)
  })
})

// ── calcStreakPreview ─────────────────────────────────────────────────────────
describe('calcStreakPreview', () => {
  it('restituisce streak corrente + 1', () => {
    expect(calcStreakPreview({ sessionStreak: 3 })).toBe(4)
    expect(calcStreakPreview({ sessionStreak: 0 })).toBe(1)
  })

  it('gestisce sessionStreak undefined', () => {
    expect(calcStreakPreview({})).toBe(1)
  })
})

// ── buildXPUpdate ─────────────────────────────────────────────────────────────
describe('buildXPUpdate', () => {
  it('aggiunge XP al cliente', () => {
    const { update } = buildXPUpdate(clienteBase, 100)
    expect(update.xp).toBe(100)
    expect(update.level).toBe(1)
  })

  it('sale di livello se supera xpNext', () => {
    const client      = { ...clienteBase, xp: 450, xpNext: 500, level: 1 }
    const { update }  = buildXPUpdate(client, 100)
    expect(update.level).toBe(2)
    expect(update.xp).toBe(50)               // 550 - 500 = 50 XP nel nuovo livello
    expect(update.xpNext).toBeGreaterThan(500) // xpNext scala con moltiplicatore
  })

  it('sale più livelli se XP è molto grande', () => {
    const { update } = buildXPUpdate(clienteBase, 10000)
    expect(update.level).toBeGreaterThan(5)
  })

  it('aggiunge entry nel log', () => {
    const { update } = buildXPUpdate(clienteBase, 50, 'Test')
    expect(update.log).toHaveLength(1)
    expect(update.log[0].xp).toBe(50)
    expect(update.log[0].action).toContain('Test')
  })

  it('log ha il timestamp ts', () => {
    const { update } = buildXPUpdate(clienteBase, 50)
    expect(update.log[0].ts).toBeTypeOf('number')
    expect(update.log[0].ts).toBeGreaterThan(0)
  })
})

// ── buildCampionamentoUpdate (US-015, US-046) ─────────────────────────────────
describe('buildCampionamentoUpdate', () => {
  const statsBase = { velocita: 60, forza: 55, resistenza: 50 }

  it('50 XP per il primo campionamento (nessun precedente)', () => {
    const { update } = buildCampionamentoUpdate(clienteBase, statsBase, {})
    expect(update.xp).toBe(50)
  })

  it('aggiorna stats, rank, media nel documento', () => {
    const { update } = buildCampionamentoUpdate(clienteBase, statsBase, {})
    expect(update.stats).toEqual(statsBase)
    expect(update.rank).toBeTypeOf('string')
    expect(update.media).toBeTypeOf('number')
  })

  it('media calcolata correttamente (60+55+50)/3 = 55', () => {
    const { update } = buildCampionamentoUpdate(clienteBase, statsBase, {})
    expect(update.media).toBe(55)
  })

  it('campionamento inserito in testa alla lista', () => {
    const { update } = buildCampionamentoUpdate(clienteBase, statsBase, {})
    expect(update.campionamenti[0].stats).toEqual(statsBase)
  })

  it('100 XP se 4+ stat migliorano', () => {
    const clienteConStorico = {
      ...clienteBase,
      campionamenti: [{ stats: { v: 40, f: 40, r: 40, e: 40, m: 40 } }],
    }
    const nuoviStats = { v: 60, f: 60, r: 60, e: 60, m: 60 }
    const { update } = buildCampionamentoUpdate(clienteConStorico, nuoviStats, {})
    expect(update.xp).toBe(100)
  })

  it('60 XP se 2-3 stat migliorano', () => {
    const clienteConStorico = {
      ...clienteBase,
      campionamenti: [{ stats: { v: 40, f: 40, r: 40 } }],
    }
    const nuoviStats = { v: 60, f: 60, r: 30 } // 2 miglioramenti
    const { update } = buildCampionamentoUpdate(clienteConStorico, nuoviStats, {})
    expect(update.xp).toBe(60)
  })

  it('30 XP se 1 stat migliora', () => {
    const clienteConStorico = {
      ...clienteBase,
      campionamenti: [{ stats: { v: 40, f: 40 } }],
    }
    const nuoviStats = { v: 60, f: 30 }
    const { update } = buildCampionamentoUpdate(clienteConStorico, nuoviStats, {})
    expect(update.xp).toBe(30)
  })

  it('10 XP se nessuna stat migliora', () => {
    const clienteConStorico = {
      ...clienteBase,
      campionamenti: [{ stats: { v: 70, f: 70 } }],
    }
    const nuoviStats = { v: 50, f: 50 }
    const { update } = buildCampionamentoUpdate(clienteConStorico, nuoviStats, {})
    expect(update.xp).toBe(10)
  })

  it('conserva i campionamenti precedenti (fino a 50)', () => {
    const clienteConStorico = {
      ...clienteBase,
      campionamenti: Array.from({ length: 10 }, (_, i) => ({ stats: { v: i * 5 } })),
    }
    const { update } = buildCampionamentoUpdate(clienteConStorico, { v: 80 }, {})
    expect(update.campionamenti).toHaveLength(11)
    expect(update.campionamenti[0].stats.v).toBe(80)
  })
})

// ── buildBiaUpdate (US-046) ───────────────────────────────────────────────────
describe('buildBiaUpdate', () => {
  const biaNuova = { fatMassPercent: 20, muscleMassKg: 35, waterPercent: 58, visceralFat: 5 }

  it('50 XP per la prima misurazione', () => {
    const { xpEarned, isFirstMeasurement } = buildBiaUpdate(clienteBase, biaNuova)
    expect(xpEarned).toBe(50)
    expect(isFirstMeasurement).toBe(true)
  })

  it('aggiunge BIA a biaHistory', () => {
    const { update } = buildBiaUpdate(clienteBase, biaNuova)
    expect(update.biaHistory).toHaveLength(1)
    expect(update.lastBia.fatMassPercent).toBe(20)
  })

  it('aggiunge entry al log con ts', () => {
    const { update } = buildBiaUpdate(clienteBase, biaNuova)
    expect(update.log[0].ts).toBeTypeOf('number')
    expect(update.log[0].action).toContain('Prima misurazione')
  })

  it('isFirstMeasurement = false se già esiste lastBia', () => {
    const clienteConBia = { ...clienteBase, lastBia: biaNuova }
    const { isFirstMeasurement } = buildBiaUpdate(clienteConBia, { ...biaNuova, fatMassPercent: 18 })
    expect(isFirstMeasurement).toBe(false)
  })
})

// ── buildProfileUpgrade (US-074, US-075) ─────────────────────────────────────
describe('buildProfileUpgrade', () => {
  it('tests_only → complete: azzera biaHistory e lastBia', () => {
    const cliente  = { ...clienteBase, profileType: 'tests_only', log: [] }
    const update   = buildProfileUpgrade(cliente, 'complete')
    expect(update.profileType).toBe('complete')
    expect(update.biaHistory).toEqual([])
    expect(update.lastBia).toBeNull()
    expect(update.stats).toBeUndefined()       // stats non toccate
  })

  it('bia_only → complete: azzera stats e campionamenti', () => {
    const cliente  = { ...clienteBase, profileType: 'bia_only', log: [] }
    const update   = buildProfileUpgrade(cliente, 'complete')
    expect(update.profileType).toBe('complete')
    expect(update.stats).toEqual({})
    expect(update.campionamenti).toEqual([])
    expect(update.rank).toBe('F')
    expect(update.media).toBe(0)
  })

  it('aggiunge entry nel log', () => {
    const update = buildProfileUpgrade({ ...clienteBase, profileType: 'tests_only', log: [] }, 'complete')
    expect(update.log).toHaveLength(1)
    expect(update.log[0].xp).toBe(0)
  })
})

// ── buildNewClient ────────────────────────────────────────────────────────────
describe('buildNewClient', () => {
  const defaults  = { xp: 0, xpNext: 500, level: 1, sessionsPerWeek: 3 }
  const formData  = {
    name:        'Mario Rossi',
    profileType: 'tests_only',
    stats:       { velocita: 60, forza: 55 },
    testValues:  { sprint_10m: 5.2 },
  }

  it('include i dati anagrafici', () => {
    const doc = buildNewClient('trainer-1', formData, defaults)
    expect(doc.name).toBe('Mario Rossi')
    expect(doc.trainerId).toBe('trainer-1')
  })

  it('calcola media e rank', () => {
    const doc = buildNewClient('t1', formData, defaults)
    expect(doc.media).toBe(58)         // (60+55)/2
    expect(doc.rank).toBeTypeOf('string')
    expect(doc.rank).not.toBe('F')
  })

  it('50 XP per il primo campionamento (tests_only)', () => {
    const doc = buildNewClient('t1', formData, defaults)
    expect(doc.xp).toBeGreaterThan(0)  // 50 XP primo campionamento
  })

  it('bia_only: stats vuoto, nessun XP iniziale', () => {
    const biaForm = { ...formData, profileType: 'bia_only', stats: {} }
    const doc = buildNewClient('t1', biaForm, defaults)
    expect(doc.stats).toEqual({})
    expect(doc.xp).toBe(0)
    expect(doc.rank).toBe('F')
  })

  it('campionamento iniziale inserito se tests_only', () => {
    const doc = buildNewClient('t1', formData, defaults)
    expect(doc.campionamenti).toHaveLength(1)
    expect(doc.campionamenti[0].stats).toEqual(formData.stats)
  })

  it('nessun campionamento iniziale se bia_only', () => {
    const biaForm = { ...formData, profileType: 'bia_only', stats: {} }
    const doc = buildNewClient('t1', biaForm, defaults)
    expect(doc.campionamenti).toHaveLength(0)
  })
})
