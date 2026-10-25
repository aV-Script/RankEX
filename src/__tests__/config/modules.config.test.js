import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  getCategoriaFromEta,
  resolveCategoria,
  getModule,
  getTerminology,
  getModuleLabel,
  isModuleChangeAllowed,
  MODULES,
  MODULE_OPTIONS,
  MODULE_CAPABILITIES,
  CAPABILITY_KEYS,
  TERMINOLOGY_VARIANTS_BY_MODULE,
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

// ── STORY-030 — Capability esplicite per modulo (ADR-007) ─────────────────────
// Tabella attesa: ogni flag dichiarato per ogni modulo. Se cambia un valore qui,
// è una decisione di prodotto, non un refactor.
const EXPECTED_CAPABILITIES = {
  //                      PT     soccer lipedema
  hasRank:            [true,  true,  false],
  hasGamification:    [true,  true,  false],
  hasPercentileTests: [true,  true,  false],
  hasAssessments:     [false, false, true ],
  hasCategories:      [true,  false, false],
  hasPlayerRoles:     [false, true,  false],
  hasProfileTypes:    [true,  false, false],
  hasBia:             [true,  false, true ],
  hasGoals:           [true,  true,  false],
  hasGroupRanking:    [true,  true,  false],
  hasWearable:        [true,  true,  false],
  hasClientLogin:     [true,  true,  false],
}
const MODULE_ORDER = [MODULES.PERSONAL_TRAINING, MODULES.SOCCER_ACADEMY, MODULES.LIPEDEMA]

describe('getModule — capability', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('la tabella attesa copre esattamente CAPABILITY_KEYS', () => {
    expect(Object.keys(EXPECTED_CAPABILITIES).sort()).toEqual([...CAPABILITY_KEYS].sort())
  })

  it.each(MODULE_ORDER.map((moduleType, col) => [moduleType, col]))('%s: ogni flag dichiarato esplicitamente con il valore atteso', (moduleType, col) => {
    expect(Object.keys(MODULE_CAPABILITIES[moduleType]).sort()).toEqual([...CAPABILITY_KEYS].sort())
    const m = getModule(moduleType)
    for (const [key, values] of Object.entries(EXPECTED_CAPABILITIES)) {
      expect([key, m[key]]).toEqual([key, values[col]])
    }
  })

  it('lipedema non eredita nulla da PT: non è soccer, niente test fissi', () => {
    const m = getModule(MODULES.LIPEDEMA)
    expect(m.moduleType).toBe('lipedema')
    expect(m.isSoccer).toBe(false)
    expect(m.fixedTests).toBeNull()
  })

  it.each([['sconosciuto', 'qualcosa'], ['null', null], ['undefined', undefined]])(
    'moduleType %s → tutte le capability false (default restrittivo, mai PT)', (_label, moduleType) => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const m = getModule(moduleType)
      for (const key of CAPABILITY_KEYS) expect([key, m[key]]).toEqual([key, false])
      expect(m.isSoccer).toBe(false)
    })
})

describe('MODULE_OPTIONS / getModuleLabel', () => {
  it('una voce con etichetta propria per ognuno dei 3 moduli', () => {
    expect(MODULE_OPTIONS.map(option => option.value)).toEqual(MODULE_ORDER)
    expect(new Set(MODULE_OPTIONS.map(option => option.label)).size).toBe(3)
  })

  it('lipedema ha la propria etichetta, non quella PT o Soccer', () => {
    expect(getModuleLabel(MODULES.LIPEDEMA)).toBe('Lipedema Edition')
    expect(getModuleLabel(MODULES.LIPEDEMA, { short: true })).toBe('Lipedema')
  })

  it("PT e Soccer invariati; assente = PT legacy; sconosciuto mostrato com'è", () => {
    expect(getModuleLabel(MODULES.PERSONAL_TRAINING)).toBe('Personal Training')
    expect(getModuleLabel(MODULES.SOCCER_ACADEMY)).toBe('Soccer Academy')
    expect(getModuleLabel(MODULES.SOCCER_ACADEMY, { short: true })).toBe('Soccer')
    expect(getModuleLabel(null, { short: true })).toBe('PT')
    expect(getModuleLabel('qualcosa')).toBe('qualcosa')
  })

  it('ogni modulo ha almeno una variante di terminologia', () => {
    for (const moduleType of MODULE_ORDER) expect(TERMINOLOGY_VARIANTS_BY_MODULE[moduleType].length).toBeGreaterThan(0)
  })
})

describe('isModuleChangeAllowed (ADR-015 §6)', () => {
  const { PERSONAL_TRAINING: PT, SOCCER_ACADEMY: SOCCER, LIPEDEMA } = MODULES

  it('PT ↔ soccer sempre permesso, anche con clienti', () => {
    expect(isModuleChangeAllowed(PT, SOCCER, 12)).toBe(true)
    expect(isModuleChangeAllowed(SOCCER, PT, 12)).toBe(true)
    expect(isModuleChangeAllowed(null, SOCCER, 12)).toBe(true)
  })

  it('da o verso lipedema bloccato con clienti, permesso con 0', () => {
    expect(isModuleChangeAllowed(PT, LIPEDEMA, 1)).toBe(false)
    expect(isModuleChangeAllowed(LIPEDEMA, SOCCER, 1)).toBe(false)
    expect(isModuleChangeAllowed(null, LIPEDEMA, 1)).toBe(false)
    expect(isModuleChangeAllowed(PT, LIPEDEMA, 0)).toBe(true)
    expect(isModuleChangeAllowed(LIPEDEMA, PT, 0)).toBe(true)
  })

  it('conteggio non noto (null) = bloccato da/verso lipedema', () => {
    expect(isModuleChangeAllowed(PT, LIPEDEMA, null)).toBe(false)
    expect(isModuleChangeAllowed(PT, SOCCER, null)).toBe(true)
  })

  it('stesso modulo: nessun cambio, sempre permesso', () => {
    expect(isModuleChangeAllowed(LIPEDEMA, LIPEDEMA, 5)).toBe(true)
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

  it('lipedema: Professionista / Paziente / Gruppo / Appuntamento + Valutazione', () => {
    const t = getTerminology('lipedema', 'lipedema')
    expect(t).toMatchObject({
      trainer: 'Professionista', client: 'Paziente', clients: 'Pazienti',
      group: 'Gruppo', groups: 'Gruppi', session: 'Appuntamento', sessions: 'Appuntamenti',
      assessment: 'Valutazione', assessments: 'Valutazioni',
    })
    expect(getTerminology('lipedema')).toBe(t)
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
