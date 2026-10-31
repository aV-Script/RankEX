import { describe, it, expect } from 'vitest'
import { getVisibleTabIds } from '../../features/client/client-dashboard/dashboardTabs.js'
import { getModule, MODULES } from '../../config/modules.config.js'

const ALL_TABS = ['atleta', 'test', 'bia', 'allenamento', 'obiettivi', 'calendario', 'note', 'attivita', 'misure', 'wearable', 'trofei']

describe('getVisibleTabIds', () => {
  it('PT e soccer con test: tutte le tab (invariato)', () => {
    expect(getVisibleTabIds(getModule(MODULES.PERSONAL_TRAINING), true)).toEqual(ALL_TABS)
    expect(getVisibleTabIds(getModule(MODULES.SOCCER_ACADEMY), true)).toEqual(ALL_TABS)
  })

  it('PT bia_only: tutte tranne Test (invariato)', () => {
    expect(getVisibleTabIds(getModule(MODULES.PERSONAL_TRAINING), false)).toEqual(ALL_TABS.filter(id => id !== 'test'))
  })

  it('lipedema: Valutazioni subito dopo Paziente; niente Test, Obiettivi, Attività, Wearable, Trofei', () => {
    expect(getVisibleTabIds(getModule(MODULES.LIPEDEMA), true))
      .toEqual(['atleta', 'valutazioni', 'bia', 'allenamento', 'calendario', 'note', 'misure'])
  })

  it('PT e soccer: nessuna tab Valutazioni', () => {
    expect(getVisibleTabIds(getModule(MODULES.PERSONAL_TRAINING), true)).not.toContain('valutazioni')
    expect(getVisibleTabIds(getModule(MODULES.SOCCER_ACADEMY), true)).not.toContain('valutazioni')
  })
})
