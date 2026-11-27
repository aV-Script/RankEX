import { describe, it, expect } from 'vitest'
import {
  offsetRomeDate, buildSeedSlots, buildSeedNotifications, shouldRefreshUpcoming, QA_SEED_PREFIX,
  planSeedBadges, SEED_SHOWCASE_BADGE_IDS,
} from '../../../e2e/qa-dev/qaSeedData.js'
import { MANUAL_BADGES } from '../../config/badges.config.js'
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

describe('planSeedBadges (STORY-049 AC2: vetrina da 5)', () => {
  it('gli id sono 5 badge manuali che esistono in config', () => {
    expect(SEED_SHOWCASE_BADGE_IDS).toHaveLength(5)
    const manualIds = MANUAL_BADGES.map(badge => badge.id)
    for (const id of SEED_SHOWCASE_BADGE_IDS) expect(manualIds).toContain(id)
  })

  it('PT: assegna i 5 badge e la vetrina nel formato del modello Cliente', () => {
    const patch = planSeedBadges('pt', { badges: {}, badgeShowcase: [] }, NOW)
    expect(patch.badgeShowcase).toEqual(SEED_SHOWCASE_BADGE_IDS)
    for (const id of SEED_SHOWCASE_BADGE_IDS) {
      expect(patch[`badges.${id}`]).toMatchObject({ awardedAt: NOW.getTime(), awardedBy: 'qa-seed' })
    }
  })

  it('secondo lancio: nessuna scrittura; non tocca una vetrina cambiata dalla QA', () => {
    const done = {
      badges: Object.fromEntries(SEED_SHOWCASE_BADGE_IDS.map(id => [id, { awardedAt: 1, awardedBy: 'qa-seed' }])),
      badgeShowcase: SEED_SHOWCASE_BADGE_IDS,
    }
    expect(planSeedBadges('pt', done, NOW)).toBeNull()
    expect(planSeedBadges('pt', { ...done, badgeShowcase: ['mvp'] }, NOW)).toBeNull()
  })

  it('aggiunge solo i badge mancanti senza toccare gli altri', () => {
    const patch = planSeedBadges('pt', { badges: { mvp: { awardedAt: 1 } }, badgeShowcase: ['mvp'] }, NOW)
    expect(Object.keys(patch)).not.toContain('badges.mvp')
    expect(Object.keys(patch)).toHaveLength(4)
  })

  it('soccer e lipedema: niente', () => {
    expect(planSeedBadges('soccer', {}, NOW)).toBeNull()
    expect(planSeedBadges('lipedema', {}, NOW)).toBeNull()
  })
})
