import { describe, it, expect } from 'vitest'
import { sortNotificationsNewestFirst } from '../../utils/notifications.js'

describe('sortNotificationsNewestFirst', () => {
  it('dalla più recente alla meno recente', () => {
    const list = [
      { id: 'a', createdAt: '2026-11-01T10:00:00.000Z' },
      { id: 'c', createdAt: '2026-11-12T08:00:00.000Z' },
      { id: 'b', createdAt: '2026-11-05T09:00:00.000Z' },
    ]
    expect(sortNotificationsNewestFirst(list).map(n => n.id)).toEqual(['c', 'b', 'a'])
  })

  it('senza data valida va in fondo e non rompe l\'ordine', () => {
    const list = [
      { id: 'x' },
      { id: 'old', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'bad', createdAt: 'non-una-data' },
      { id: 'new', createdAt: '2026-11-12T00:00:00.000Z' },
    ]
    const ids = sortNotificationsNewestFirst(list).map(n => n.id)
    expect(ids.slice(0, 2)).toEqual(['new', 'old'])
    expect(ids.slice(2).sort()).toEqual(['bad', 'x'])
  })

  it('non modifica l\'array ricevuto; lista vuota resta vuota', () => {
    const list = [
      { id: 'a', createdAt: '2026-11-01T00:00:00.000Z' },
      { id: 'b', createdAt: '2026-11-02T00:00:00.000Z' },
    ]
    sortNotificationsNewestFirst(list)
    expect(list.map(n => n.id)).toEqual(['a', 'b'])
    expect(sortNotificationsNewestFirst([])).toEqual([])
  })
})
