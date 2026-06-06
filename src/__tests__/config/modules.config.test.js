import { describe, it, expect } from 'vitest'
import {
  getCategoriaFromEta,
  getModule,
  getTerminology,
  MODULES,
} from '../../config/modules.config.js'

// ── US-071 — Fascia d'età automatica ──────────────────────────────────────────
describe('getCategoriaFromEta', () => {
  it('età < 10 → soccer_youth (Pulcini)', () => {
    expect(getCategoriaFromEta(7)).toBe('soccer_youth')
    expect(getCategoriaFromEta(9)).toBe('soccer_youth')
  })

  it('età = 10 → soccer_junior (Esordienti)', () => {
    expect(getCategoriaFromEta(10)).toBe('soccer_junior')
  })

  it('età 10-13 → soccer_junior', () => {
    expect(getCategoriaFromEta(12)).toBe('soccer_junior')
    expect(getCategoriaFromEta(13)).toBe('soccer_junior')
  })

  it('età = 14 → soccer (Senior)', () => {
    expect(getCategoriaFromEta(14)).toBe('soccer')
  })

  it('età > 14 → soccer', () => {
    expect(getCategoriaFromEta(17)).toBe('soccer')
    expect(getCategoriaFromEta(25)).toBe('soccer')
  })

  it('età NaN → soccer_youth (fallback sicuro)', () => {
    expect(getCategoriaFromEta('abc')).toBe('soccer_youth')
  })

  it('accetta stringhe numeriche', () => {
    expect(getCategoriaFromEta('12')).toBe('soccer_junior')
    expect(getCategoriaFromEta('16')).toBe('soccer')
  })
})

// ── US-081 — Modulo attivo ─────────────────────────────────────────────────────
describe('getModule', () => {
  it('personal_training: isSoccer=false, hasBia=true', () => {
    const m = getModule(MODULES.PERSONAL_TRAINING)
    expect(m.isSoccer).toBe(false)
    expect(m.hasBia).toBe(true)
    expect(m.hasCategories).toBe(true)
    expect(m.fixedTests).toBeNull()
  })

  it('soccer_academy: isSoccer=true, hasBia=false', () => {
    const m = getModule(MODULES.SOCCER_ACADEMY)
    expect(m.isSoccer).toBe(true)
    expect(m.hasBia).toBe(false)
    expect(m.hasCategories).toBe(false)
    expect(m.fixedTests).not.toBeNull()
  })

  it('soccer fixedTests contiene le 3 fasce', () => {
    const { fixedTests } = getModule(MODULES.SOCCER_ACADEMY)
    expect(fixedTests).toHaveProperty('soccer_youth')
    expect(fixedTests).toHaveProperty('soccer_junior')
    expect(fixedTests).toHaveProperty('soccer')
    expect(fixedTests.soccer_youth).toHaveLength(5)
    expect(fixedTests.soccer_junior).toHaveLength(5)
    expect(fixedTests.soccer).toHaveLength(5)
  })
})

// ── US-081 — Terminologia per modulo ─────────────────────────────────────────
describe('getTerminology', () => {
  it('personal_training: "Cliente", "Sessione"', () => {
    const t = getTerminology('personal_training')
    expect(t.client).toBe('Cliente')
    expect(t.session).toBe('Sessione')
  })

  it('soccer_academy: "Allievo", "Allenamento"', () => {
    const t = getTerminology('soccer_academy')
    expect(t.client).toBe('Allievo')
    expect(t.session).toBe('Allenamento')
    expect(t.group).toBe('Squadra')
  })

  it('variante gym: "Membro", "Classe"', () => {
    const t = getTerminology('personal_training', 'gym')
    expect(t.client).toBe('Membro')
    expect(t.group).toBe('Classe')
  })

  it('modulo sconosciuto → fallback personal_training', () => {
    const t = getTerminology('unknown_module')
    expect(t.client).toBe('Cliente')
  })
})
