import { describe, it, expect } from 'vitest'
import {
  formatXpMultiplier, getStreakSummary, getXpProgress, getHomeMedia,
  getHomeCategoryLabel, pickLatestNotifications, HOME_NOTIFICATIONS_SHOWN,
} from '../../utils/clientHome.js'
import { formatNotificationDate } from '../../utils/notifications.js'
import { calcStreakMultiplier, calcStreakPreview } from '../../utils/gamification.js'

const CATEGORIES = [{ id: 'health', label: 'Health' }, { id: 'active', label: 'Active' }]

describe('formatXpMultiplier / getStreakSummary', () => {
  it('formatta con la virgola', () => {
    expect(formatXpMultiplier(1.1)).toBe('XP ×1,1')
    expect(formatXpMultiplier(2)).toBe('XP ×2,0')
  })

  it('streak 0: "0" e ×1,1 (non nascosta)', () => {
    expect(getStreakSummary({})).toEqual({ streak: 0, multiplierText: 'XP ×1,1' })
    expect(getStreakSummary({ sessionStreak: 0 }).multiplierText).toBe('XP ×1,1')
  })

  it('coincide col calcolo del riepilogo Calendario (anteprima della prossima sessione)', () => {
    for (const sessionStreak of [0, 1, 4, 9, 10, 25]) {
      const client = { sessionStreak }
      const expected = formatXpMultiplier(calcStreakMultiplier(calcStreakPreview(client)))
      expect(getStreakSummary(client)).toEqual({ streak: sessionStreak, multiplierText: expected })
    }
  })

  it('a streak alto il moltiplicatore si ferma a ×2,0', () => {
    expect(getStreakSummary({ sessionStreak: 40 }).multiplierText).toBe('XP ×2,0')
  })
})

describe('getXpProgress', () => {
  it('valori normali', () => {
    const progress = getXpProgress({ xp: 3420, xpNext: 4810, level: 12 })
    expect(progress).toMatchObject({ now: 3420, max: 4810, pct: 71, levelText: 'LIVELLO 12' })
    expect(progress.ariaLabel).toBe('Livello 12: 3.420 di 4.810 XP')
    expect(progress.xpText).toBe('3.420 / 4.810 XP')
  })

  it('xpNext assente o 0: massimo almeno 1, barra a 0 %', () => {
    for (const xpNext of [undefined, 0, null]) {
      const progress = getXpProgress({ xp: 0, xpNext, level: 1 })
      expect(progress.max).toBe(1)
      expect(progress.pct).toBe(0)
      expect(progress.now).toBe(0)
    }
    expect(getXpProgress({ xp: 50, xpNext: 0 }).now).toBe(1)
  })

  it('xp oltre xpNext non esce dall\'intervallo', () => {
    const progress = getXpProgress({ xp: 600, xpNext: 500 })
    expect(progress.now).toBe(500)
    expect(progress.pct).toBe(100)
  })
})

describe('getHomeMedia (D2)', () => {
  it('con campionamenti e profilo non bia_only: media arrotondata', () => {
    expect(getHomeMedia({ media: 63.6, campionamenti: [{}], profileType: 'tests_only' })).toBe(64)
    expect(getHomeMedia({ media: 40, campionamenti: [{}], profileType: 'complete' })).toBe(40)
  })

  it('nessun campionamento: nessuna media', () => {
    expect(getHomeMedia({ media: 0, campionamenti: [], profileType: 'tests_only' })).toBeNull()
    expect(getHomeMedia({ media: 0, campionamenti: undefined, profileType: 'tests_only' })).toBeNull()
  })

  it('bia_only: nessuna media', () => {
    expect(getHomeMedia({ media: 70, campionamenti: [{}], profileType: 'bia_only' })).toBeNull()
  })

  it('media non numerica: nessuna media', () => {
    expect(getHomeMedia({ media: undefined, campionamenti: [{}], profileType: 'tests_only' })).toBeNull()
    expect(getHomeMedia({ media: NaN, campionamenti: [{}], profileType: 'tests_only' })).toBeNull()
  })
})

describe('getHomeCategoryLabel', () => {
  const pt = { hasCategories: true }
  const soccer = { hasCategories: false }

  it('PT: nome della categoria', () => {
    expect(getHomeCategoryLabel(pt, { categoria: 'active' }, CATEGORIES)).toBe('Active')
  })

  it('modulo senza categorie (soccer): niente', () => {
    expect(getHomeCategoryLabel(soccer, { categoria: 'soccer' }, CATEGORIES)).toBeNull()
  })

  it('bia_only o categoria ignota: niente (nessuna ricaduta su Health)', () => {
    expect(getHomeCategoryLabel(pt, { categoria: 'active', profileType: 'bia_only' }, CATEGORIES)).toBeNull()
    expect(getHomeCategoryLabel(pt, { categoria: 'soccer_youth' }, CATEGORIES)).toBeNull()
  })

  it('capability assenti: niente', () => {
    expect(getHomeCategoryLabel(undefined, { categoria: 'health' }, CATEGORIES)).toBeNull()
  })
})

describe('pickLatestNotifications', () => {
  const notifications = [
    { id: 'a', createdAt: '2026-11-10T10:00:00Z' },
    { id: 'b', createdAt: '2026-11-12T10:00:00Z' },
    { id: 'c', createdAt: '2026-11-11T10:00:00Z' },
    { id: 'd' },
  ]

  it('al massimo 2, dalla più recente', () => {
    expect(HOME_NOTIFICATIONS_SHOWN).toBe(2)
    expect(pickLatestNotifications(notifications).map(n => n.id)).toEqual(['b', 'c'])
  })

  it('non modifica l\'array e gestisce vuoto/assente', () => {
    const copy = [...notifications]
    pickLatestNotifications(notifications)
    expect(notifications).toEqual(copy)
    expect(pickLatestNotifications([])).toEqual([])
    expect(pickLatestNotifications(undefined)).toEqual([])
  })

  it('una sola notifica resta una', () => {
    expect(pickLatestNotifications([notifications[0]])).toHaveLength(1)
  })
})

describe('formatNotificationDate', () => {
  const now = new Date('2026-11-13T12:00:00Z')

  it('relativa', () => {
    expect(formatNotificationDate('2026-11-13T11:59:00Z', now)).toBe('Adesso')
    expect(formatNotificationDate('2026-11-13T11:30:00Z', now)).toBe('30 min fa')
    expect(formatNotificationDate('2026-11-13T09:00:00Z', now)).toBe('3 ore fa')
    expect(formatNotificationDate('2026-11-12T09:00:00Z', now)).toBe('Ieri')
    expect(formatNotificationDate('2026-11-10T09:00:00Z', now)).toBe('3 giorni fa')
  })

  it('senza data: stringa vuota', () => {
    expect(formatNotificationDate(undefined, now)).toBe('')
  })
})
