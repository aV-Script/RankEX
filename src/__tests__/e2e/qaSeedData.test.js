import { describe, it, expect } from 'vitest'
import {
  offsetRomeDate, buildSeedSlots, buildSeedNotifications, shouldRefreshUpcoming, QA_SEED_PREFIX,
} from '../../../e2e/qa-dev/qaSeedData.js'
import { getAvatarsForOrg } from '../../config/avatars.config.js'
import { getUnlockRuleForAvatarId } from '../../../functions/src/shared/avatarUnlocks.js'

const NOW = new Date('2026-11-13T10:00:00Z')

describe('offsetRomeDate', () => {
  it('conta i giorni dalla data di Roma, non da quella UTC', () => {
    expect(offsetRomeDate(NOW, -1)).toBe('2026-11-12')
    expect(offsetRomeDate(NOW, 1)).toBe('2026-11-14')
    expect(offsetRomeDate(new Date('2026-11-08T23:30:00Z'), 1)).toBe('2026-11-10')
  })
})

describe('buildSeedSlots', () => {
  it('PT: 3 slot passati in giorni diversi e consecutivi + 1 futuro, tutti pianificati', () => {
    const slots = buildSeedSlots('pt', 'c1', NOW)
    const past = slots.filter(slot => slot.kind === 'past')
    expect(past.map(slot => slot.data.date)).toEqual(['2026-11-12', '2026-11-11', '2026-11-10'])
    expect(slots.filter(slot => slot.kind === 'upcoming').map(slot => slot.data.date)).toEqual(['2026-11-14'])
    for (const { data } of slots) {
      expect(data).toMatchObject({ status: 'planned', clientIds: ['c1'], attendees: [], absentees: [], recurrenceId: null })
      expect(data.e2eMarker).toBeUndefined()
      expect(data.qaSeedMarker.startsWith(QA_SEED_PREFIX)).toBe(true)
    }
  })

  it('id deterministici e unici (secondo lancio = stessi documenti)', () => {
    const ids = buildSeedSlots('pt', 'c1', NOW).map(slot => slot.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(buildSeedSlots('pt', 'c1', new Date('2026-12-01T10:00:00Z')).map(slot => slot.id)).toEqual(ids)
  })

  it('soccer: 3 passati + futuro; lipedema: nulla', () => {
    expect(buildSeedSlots('soccer', 'c2', NOW).map(slot => slot.kind)).toEqual(['past', 'past', 'past', 'upcoming'])
    expect(buildSeedSlots('lipedema', 'c3', NOW)).toEqual([])
  })

  it('non scrive coins né sessionStreak', () => {
    for (const { data } of buildSeedSlots('pt', 'c1', NOW)) expect(data).not.toHaveProperty('coins')
  })
})

describe('buildSeedNotifications', () => {
  it('almeno 2 notifiche di cui almeno 1 non letta, modello Notifica', () => {
    const notifications = buildSeedNotifications('pt', 'c1', NOW)
    expect(notifications.length).toBeGreaterThanOrEqual(2)
    expect(notifications.some(notification => !notification.data.read)).toBe(true)
    for (const { data } of notifications) {
      expect(Object.keys(data)).toEqual(expect.arrayContaining(['clientId', 'message', 'date', 'type', 'read', 'readAt', 'createdAt']))
      expect(data.read ? data.readAt : data.readAt === null).toBeTruthy()
    }
  })

  it('soccer sì, lipedema no', () => {
    expect(buildSeedNotifications('soccer', 'c2', NOW).length).toBeGreaterThanOrEqual(2)
    expect(buildSeedNotifications('lipedema', 'c3', NOW)).toEqual([])
  })
})

describe('shouldRefreshUpcoming', () => {
  it('sposta solo lo slot ancora pianificato e ormai passato', () => {
    expect(shouldRefreshUpcoming({ status: 'planned', date: '2026-11-12' }, NOW)).toBe(true)
    expect(shouldRefreshUpcoming({ status: 'planned', date: '2026-11-13' }, NOW)).toBe(false)
    expect(shouldRefreshUpcoming({ status: 'completed', date: '2026-11-01' }, NOW)).toBe(false)
  })
})

describe('set avatar qa-pt', () => {
  it('9 avatar con regole di sblocco per suffisso uguali client/server; _07 costa 30', () => {
    const avatars = getAvatarsForOrg('qa-pt')
    expect(avatars).toHaveLength(9)
    for (const avatar of avatars) {
      expect(avatar.id).toMatch(/0[1-9]$/)
      expect(getUnlockRuleForAvatarId(avatar.id)).toMatchObject({ unlockType: avatar.unlockType })
    }
    expect(avatars.find(avatar => avatar.id === 'qa_pt_07')).toMatchObject({ unlockType: 'purchase', price: 30 })
    expect(getAvatarsForOrg('qa-soccer')).toHaveLength(0)
  })
})
