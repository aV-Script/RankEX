import { describe, it, expect } from 'vitest'
import { pickUpcomingPlanned } from '../../utils/upcomingSessions.js'

const ID = 'c1'

describe('pickUpcomingPlanned', () => {
  it('tiene solo le pianificate, per data e poi per ora', () => {
    const slots = [
      { id: 'late',   status: 'planned',   date: '2026-11-20', startTime: '18:00' },
      { id: 'done',   status: 'completed', date: '2026-11-14', startTime: '09:00', attendees: [ID] },
      { id: 'skip',   status: 'skipped',   date: '2026-11-15', startTime: '09:00' },
      { id: 'early',  status: 'planned',   date: '2026-11-20', startTime: '08:30' },
      { id: 'first',  status: 'planned',   date: '2026-11-16', startTime: '19:00' },
      { id: 'absent', status: 'completed', date: '2026-11-17', startTime: '10:00', attendees: [] },
    ]
    expect(pickUpcomingPlanned(slots, ID).map(slot => slot.id)).toEqual(['first', 'early', 'late'])
  })

  it('slot senza orario non rompe l\'ordine; lista vuota resta vuota', () => {
    const slots = [
      { id: 'b', status: 'planned', date: '2026-11-16', startTime: '10:00' },
      { id: 'a', status: 'planned', date: '2026-11-16' },
    ]
    expect(pickUpcomingPlanned(slots, ID).map(slot => slot.id)).toEqual(['a', 'b'])
    expect(pickUpcomingPlanned([], ID)).toEqual([])
  })
})
