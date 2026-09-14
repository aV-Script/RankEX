import { describe, it, expect } from 'vitest'
import { getAvatarsForOrg, getAvatarById, isAvatarUnlocked } from '../../config/avatars.config.js'

describe('avatars.config — negozio (spike EPIC-005)', () => {
  it('getAvatarsForOrg applica le regole di sblocco per suffisso id', () => {
    const avatars = getAvatarsForOrg('test-org-pt')
    expect(avatars.length).toBeGreaterThan(0)
    expect(avatars.every(a => 'unlockType' in a)).toBe(true)
  })

  it('getAvatarById applica anch\'esso le regole di sblocco', () => {
    const avatar = getAvatarById('test_pt_07')
    expect(avatar.unlockType).toBe('purchase')
    expect(avatar.price).toBe(30)
  })

  it('isAvatarUnlocked: default sempre sbloccato', () => {
    expect(isAvatarUnlocked({ unlockType: 'default' }, { level: 1 })).toBe(true)
  })

  it('isAvatarUnlocked: level rispetta la soglia', () => {
    const avatar = { unlockType: 'level', unlockValue: 10 }
    expect(isAvatarUnlocked(avatar, { level: 9 })).toBe(false)
    expect(isAvatarUnlocked(avatar, { level: 10 })).toBe(true)
    expect(isAvatarUnlocked(avatar, { level: 11 })).toBe(true)
  })

  it('isAvatarUnlocked: purchase richiede id in avatarPurchased', () => {
    const avatar = { unlockType: 'purchase', id: 'test_pt_07', price: 30 }
    expect(isAvatarUnlocked(avatar, { avatarPurchased: [] })).toBe(false)
    expect(isAvatarUnlocked(avatar, { avatarPurchased: ['test_pt_07'] })).toBe(true)
    expect(isAvatarUnlocked(avatar, {})).toBe(false)
  })
})
