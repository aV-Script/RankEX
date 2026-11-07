import { describe, it, expect } from 'vitest'
import { buildVisitProgress, getNextVisitTestId, getVisitLabel } from '../../features/assessments/assessmentVisit'
import { LIPEDEMA_TEST_ORDER } from '../../config/lipedemaTests.config'
import { LIPEDEMA_TEST_IDS } from '../../utils/lipedema'

const { TWO_MINUTE_WALK, SIT_TO_STAND_30S, HANDGRIP, HHD_QUADRICEPS, ONE_LEG_STANDING } = LIPEDEMA_TEST_IDS

describe('getNextVisitTestId', () => {
  it('segue l\'ordine dei protocolli', () => {
    expect(LIPEDEMA_TEST_ORDER).toEqual([TWO_MINUTE_WALK, SIT_TO_STAND_30S, HANDGRIP, HHD_QUADRICEPS, ONE_LEG_STANDING])
    expect(getNextVisitTestId(TWO_MINUTE_WALK)).toBe(SIT_TO_STAND_30S)
    expect(getNextVisitTestId(HHD_QUADRICEPS)).toBe(ONE_LEG_STANDING)
  })

  it('dopo l\'ultimo test non propone nulla', () => {
    expect(getNextVisitTestId(ONE_LEG_STANDING)).toBeNull()
  })

  it('riprendendo un test saltato, non ripropone quelli già salvati', () => {
    // Saltato il 2MWT, salvati STS e Handgrip, si torna al 2MWT
    expect(getNextVisitTestId(TWO_MINUTE_WALK, [SIT_TO_STAND_30S, HANDGRIP])).toBe(HHD_QUADRICEPS)
  })

  it('non torna indietro sui test saltati', () => {
    expect(getNextVisitTestId(ONE_LEG_STANDING, [HANDGRIP])).toBeNull()
  })

  it('se i test successivi sono tutti salvati, non propone nulla', () => {
    expect(getNextVisitTestId(HANDGRIP, [HHD_QUADRICEPS, ONE_LEG_STANDING])).toBeNull()
  })

  it('un test sconosciuto non propone nulla', () => {
    expect(getNextVisitTestId('sconosciuto')).toBeNull()
  })
})

describe('buildVisitProgress', () => {
  it('dà posizione, totale ed etichetta del prossimo test', () => {
    const progress = buildVisitProgress(SIT_TO_STAND_30S, [TWO_MINUTE_WALK])
    expect(progress.position).toBe(2)
    expect(progress.total).toBe(5)
    expect(progress.nextLabel).toBe('HANDGRIP')
  })

  it('marca il test corrente e quelli salvati', () => {
    const { steps } = buildVisitProgress(SIT_TO_STAND_30S, [TWO_MINUTE_WALK])
    expect(steps.map(step => step.testId)).toEqual(LIPEDEMA_TEST_ORDER)
    expect(steps[0]).toMatchObject({ isSaved: true, isCurrent: false })
    expect(steps[1]).toMatchObject({ isSaved: false, isCurrent: true })
    expect(steps[2]).toMatchObject({ isSaved: false, isCurrent: false })
  })

  it('sull\'ultimo test non c\'è un prossimo', () => {
    const progress = buildVisitProgress(ONE_LEG_STANDING)
    expect(progress.position).toBe(5)
    expect(progress.nextLabel).toBeNull()
  })
})

describe('getVisitLabel', () => {
  it('usa le etichette del canvas', () => {
    expect(getVisitLabel(TWO_MINUTE_WALK)).toBe('2MWT')
    expect(getVisitLabel(SIT_TO_STAND_30S)).toBe('30s-STS')
    expect(getVisitLabel(HANDGRIP)).toBe('HANDGRIP')
  })
})
