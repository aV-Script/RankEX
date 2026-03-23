import { describe, it, expect } from 'vitest'
import {
  calcSessionConfig,
  calcLevelProgression,
  buildXPUpdate,
  MONTHLY_XP_TARGET,
  WEEKS_PER_MONTH,
} from './gamification.js'
import { LOG_MAX_ENTRIES } from '../constants/index.js'

// ── calcSessionConfig ─────────────────────────────────────────────────────────

describe('calcSessionConfig', () => {
  it('calcola correttamente con 3 sessioni settimanali', () => {
    const result = calcSessionConfig(3)
    const monthlySessions = Math.round(3 * WEEKS_PER_MONTH)
    expect(result.sessionsPerWeek).toBe(3)
    expect(result.monthlySessions).toBe(monthlySessions)
    expect(result.xpPerSession).toBe(Math.round(MONTHLY_XP_TARGET / monthlySessions))
  })

  it('clamp a 1 se sessionsPerWeek < 1', () => {
    expect(calcSessionConfig(0).sessionsPerWeek).toBe(1)
    expect(calcSessionConfig(-5).sessionsPerWeek).toBe(1)
  })

  it('clamp a 7 se sessionsPerWeek > 7', () => {
    expect(calcSessionConfig(10).sessionsPerWeek).toBe(7)
    expect(calcSessionConfig(8).sessionsPerWeek).toBe(7)
  })

  it('arrotonda sessioni decimali', () => {
    expect(calcSessionConfig(2.7).sessionsPerWeek).toBe(3)
    expect(calcSessionConfig(1.2).sessionsPerWeek).toBe(1)
  })

  it('restituisce xpPerSession > 0', () => {
    for (let i = 1; i <= 7; i++) {
      expect(calcSessionConfig(i).xpPerSession).toBeGreaterThan(0)
    }
  })

  it('più sessioni → meno XP per sessione', () => {
    const a = calcSessionConfig(2)
    const b = calcSessionConfig(5)
    expect(a.xpPerSession).toBeGreaterThan(b.xpPerSession)
  })
})

// ── calcLevelProgression ──────────────────────────────────────────────────────

describe('calcLevelProgression', () => {
  it('nessun level-up se xp < xpNext', () => {
    const result = calcLevelProgression(300, 700, 1)
    expect(result).toEqual({ xp: 300, xpNext: 700, level: 1 })
  })

  it('level-up esatto quando xp === xpNext', () => {
    const result = calcLevelProgression(700, 700, 1)
    expect(result.level).toBe(2)
    expect(result.xp).toBe(0)
    expect(result.xpNext).toBe(Math.round(700 * 1.3))
  })

  it('level-up con overflow di XP', () => {
    const result = calcLevelProgression(800, 700, 1)
    expect(result.level).toBe(2)
    expect(result.xp).toBe(100)
    expect(result.xpNext).toBe(Math.round(700 * 1.3))
  })

  it('level-up multipli', () => {
    // 2000 XP con xpNext=700:
    // L1→L2: 2000-700=1300, xpNext=910
    // L2→L3: 1300-910=390, xpNext=1183
    // 390 < 1183, stop
    const result = calcLevelProgression(2000, 700, 1)
    expect(result.level).toBe(3)
    expect(result.xp).toBe(390)
    expect(result.xpNext).toBe(Math.round(910 * 1.3))
  })

  it('xp iniziale 0 non causa level-up', () => {
    const result = calcLevelProgression(0, 700, 5)
    expect(result).toEqual({ xp: 0, xpNext: 700, level: 5 })
  })
})

// ── buildXPUpdate ─────────────────────────────────────────────────────────────

describe('buildXPUpdate', () => {
  it('restituisce struttura { update } con i campi corretti', () => {
    const client = { xp: 0, xpNext: 700, level: 1, log: [] }
    const result = buildXPUpdate(client, 50, 'Test')
    expect(result).toHaveProperty('update.xp')
    expect(result).toHaveProperty('update.xpNext')
    expect(result).toHaveProperty('update.level')
    expect(result).toHaveProperty('update.log')
  })

  it('somma correttamente gli XP', () => {
    const client = { xp: 100, xpNext: 700, level: 1, log: [] }
    const result = buildXPUpdate(client, 200)
    expect(result.update.xp).toBe(300)
    expect(result.update.level).toBe(1)
  })

  it('aggiunge il log entry con nota personalizzata', () => {
    const client = { xp: 0, xpNext: 700, level: 1, log: [] }
    const result = buildXPUpdate(client, 100, 'Sessione completata')
    expect(result.update.log[0].action).toBe('Sessione completata')
    expect(result.update.log[0].xp).toBe(100)
  })

  it('usa nota di default se non specificata', () => {
    const client = { xp: 0, xpNext: 700, level: 1, log: [] }
    const result = buildXPUpdate(client, 75)
    expect(result.update.log[0].action).toContain('+75 XP')
  })

  it(`tronca il log a ${LOG_MAX_ENTRIES} entries`, () => {
    const existingLog = Array.from({ length: LOG_MAX_ENTRIES }, (_, i) => ({
      date: 'today', action: `entry ${i}`, xp: 1,
    }))
    const client = { xp: 0, xpNext: 700, level: 1, log: existingLog }
    const result = buildXPUpdate(client, 10)
    expect(result.update.log).toHaveLength(LOG_MAX_ENTRIES)
  })
})
