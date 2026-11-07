import { describe, it, expect } from 'vitest'
import { LIPEDEMA_GUIDE } from '../../config/lipedemaGuide.config'
import { LIPEDEMA_TEST_ORDER } from '../../config/lipedemaTests.config'
import { LIPEDEMA_TEST_IDS } from '../../utils/lipedema'

describe('guida dei test Lipedema', () => {
  it('copre esattamente i 5 test della visita', () => {
    expect(Object.keys(LIPEDEMA_GUIDE).sort()).toEqual([...LIPEDEMA_TEST_ORDER].sort())
    expect(LIPEDEMA_TEST_ORDER).toHaveLength(5)
  })

  it.each(LIPEDEMA_TEST_ORDER)('%s ha procedura, istruzione verbale, criteri di stop e i 4 dati in evidenza', (testId) => {
    const guide = LIPEDEMA_GUIDE[testId]
    expect(guide.title && guide.tabLabel && guide.what && guide.subtitle).toBeTruthy()
    expect(guide.procedure.length).toBeGreaterThan(0)
    expect(guide.verbal.length).toBeGreaterThan(0)
    expect(guide.stop.length).toBeGreaterThan(0)
    expect(guide.facts.map(fact => fact.label)).toEqual(['ATTREZZATURA', 'PROVE', 'RISULTATO', 'DURATA'])
  })

  it('la checklist operatore c\'è solo per 2MWT e 30s-STS, come nei protocolli', () => {
    const withChecklist = LIPEDEMA_TEST_ORDER.filter(testId => LIPEDEMA_GUIDE[testId].checklist)
    expect(withChecklist).toEqual([LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK, LIPEDEMA_TEST_IDS.SIT_TO_STAND_30S])
  })

  it('nessuna etichetta qualitativa: i protocolli vietano giudizi e soglie', () => {
    const text = JSON.stringify(LIPEDEMA_GUIDE).toLowerCase()
    for (const word of ['scarso', 'normale', 'ottimo', 'patologico', 'percentile', 'rank']) {
      expect(text).not.toContain(word)
    }
  })
})
