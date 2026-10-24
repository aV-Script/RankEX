import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  getCategoriaFromEta,
  resolveCategoria,
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

// ── resolveCategoria — fascia soccer dall'età attuale ─────────────────────────
// Prima la fascia era fissata alla creazione del cliente: un Pulcino che
// compiva 10 anni restava valutato con i test e le tabelle 7-9.

describe('resolveCategoria', () => {
  afterEach(() => { vi.useRealTimers() })
  const pulcino = { categoria: 'soccer_youth', dataNascita: '2016-10-24' }

  it('il giorno prima del 10° compleanno resta Pulcino', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 9, 23, 12))
    expect(resolveCategoria(pulcino)).toBe('soccer_youth')
  })

  it('dal 10° compleanno passa a Esordienti, anche se la categoria salvata è Pulcini', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 9, 24, 12))
    expect(resolveCategoria(pulcino)).toBe('soccer_junior')
  })

  it('a 14 anni passa a Senior', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2030, 9, 24, 12))
    expect(resolveCategoria(pulcino)).toBe('soccer')
  })

  it('senza data di nascita usa eta, senza nessuna delle due tiene la categoria salvata', () => {
    expect(resolveCategoria({ categoria: 'soccer_youth', eta: 12 })).toBe('soccer_junior')
    expect(resolveCategoria({ categoria: 'soccer_youth' })).toBe('soccer_youth')
  })

  it("le categorie personal training non cambiano con l'età", () => {
    expect(resolveCategoria({ categoria: 'athlete', dataNascita: '1960-01-01' })).toBe('athlete')
  })
})
