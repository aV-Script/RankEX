import { describe, it, expect } from 'vitest'
import { normalizeCreatedAt, normalizeOrgData } from '../../utils/orgDates.js'

const ISO = '2026-11-07T10:30:00.000Z'
const timestamp = { toDate: () => new Date(ISO) }

describe('normalizeCreatedAt', () => {
  it('Timestamp Firestore → ISO string', () => {
    expect(normalizeCreatedAt(timestamp)).toBe(ISO)
  })

  it('stringa ISO, null e undefined restano invariati', () => {
    expect(normalizeCreatedAt(ISO)).toBe(ISO)
    expect(normalizeCreatedAt(null)).toBeNull()
    expect(normalizeCreatedAt(undefined)).toBeUndefined()
  })
})

describe('normalizeOrgData', () => {
  it('normalizza solo createdAt e lascia il resto', () => {
    expect(normalizeOrgData({ name: 'Demo', createdAt: timestamp })).toEqual({ name: 'Demo', createdAt: ISO })
  })

  it('senza createdAt non lo aggiunge', () => {
    expect(normalizeOrgData({ name: 'Demo' })).toEqual({ name: 'Demo' })
  })
})
