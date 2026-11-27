import { describe, it, expect } from 'vitest'
import { normalizeCreatedAt, normalizeOrgData, formatOrgCreatedAt } from '../../utils/orgDates.js'

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

describe('formatOrgCreatedAt', () => {
  const NOW = new Date(2026, 10, 27, 12)

  it('mai "—" subito dopo la creazione: senza createdAt usa la data locale di oggi', () => {
    const today = NOW.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
    expect(formatOrgCreatedAt(null, NOW)).toBe(today)
    expect(formatOrgCreatedAt(undefined, NOW)).toBe(today)
    expect(formatOrgCreatedAt('data-non-valida', NOW)).toBe(today)
  })

  it('con createdAt mostra quella data', () => {
    expect(formatOrgCreatedAt('2026-03-05T10:00:00.000Z', NOW)).toContain('2026')
    expect(formatOrgCreatedAt('2026-03-05T10:00:00.000Z', NOW)).not.toBe(formatOrgCreatedAt(null, NOW))
  })
})
