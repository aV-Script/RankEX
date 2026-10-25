import { describe, it, expect } from 'vitest'
import { getWizardSteps } from '../../components/modals/new-client-wizard/wizard.config'
import { getModule, MODULES } from '../../config/modules.config'

const stepTypes = (moduleType, profileType) =>
  getWizardSteps(getModule(moduleType), profileType).map(step => step.type)

describe('getWizardSteps — step per modulo (STORY-032)', () => {
  it('PT: anagrafica → profilo → categoria → account', () => {
    expect(stepTypes(MODULES.PERSONAL_TRAINING, 'tests_only')).toEqual(['anagrafica', 'profileType', 'categoria', 'account'])
    expect(stepTypes(MODULES.PERSONAL_TRAINING, 'complete')).toEqual(['anagrafica', 'profileType', 'categoria', 'account'])
  })

  it('PT bia_only: senza categoria test', () => {
    expect(stepTypes(MODULES.PERSONAL_TRAINING, 'bia_only')).toEqual(['anagrafica', 'profileType', 'account'])
  })

  it('Soccer: anagrafica → ruolo → account (3 step fissi)', () => {
    expect(stepTypes(MODULES.SOCCER_ACADEMY, 'tests_only')).toEqual(['anagrafica', 'ruolo', 'account'])
    expect(stepTypes(MODULES.SOCCER_ACADEMY, 'bia_only')).toEqual(['anagrafica', 'ruolo', 'account'])
  })

  it('Lipedema: niente profilo/categoria/ruolo/account, solo contatto facoltativo', () => {
    expect(stepTypes(MODULES.LIPEDEMA)).toEqual(['anagrafica', 'contatto'])
  })

  it('modulo sconosciuto: nessuno step ereditato da PT, nessun account', () => {
    expect(stepTypes('modulo_inesistente')).toEqual(['anagrafica', 'contatto'])
  })
})
