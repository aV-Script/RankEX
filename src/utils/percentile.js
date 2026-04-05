import { ALL_TESTS }      from '../constants'
import { TABLES, getAgeGroup } from './tables'

export function calcPercentile(stat, value, sex, age, testKey) {
  const testEntry = testKey
    ? ALL_TESTS.find(t => t.key === testKey)
    : ALL_TESTS.find(t => t.stat === stat)
  if (!testEntry) return null

  const table = TABLES[testEntry.key]
  if (!table || !table[sex]) return null

  const ageGroup    = getAgeGroup(testEntry.key, age)
  const percentiles = table[sex][ageGroup]
  if (!percentiles) return null

  const direction = testEntry.direction ?? 'direct'

  const sorted = Object.entries(percentiles)
    .map(([p, v]) => [parseFloat(p), parseFloat(v)])
    .sort((a, b) => direction === 'direct' ? a[1] - b[1] : b[1] - a[1])

  if (direction === 'direct') {
    if (value <= sorted[0][1])                 return sorted[0][0]
    if (value >= sorted[sorted.length - 1][1]) return sorted[sorted.length - 1][0]
  } else {
    if (value >= sorted[0][1])                 return sorted[0][0]
    if (value <= sorted[sorted.length - 1][1]) return sorted[sorted.length - 1][0]
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const [p1, v1] = sorted[i]
    const [p2, v2] = sorted[i + 1]
    const inRange  = direction === 'direct'
      ? value >= v1 && value <= v2
      : value <= v1 && value >= v2
    if (inRange) {
      const ratio = (value - v1) / (v2 - v1)
      return Math.round(p1 + ratio * (p2 - p1))
    }
  }

  return 0
}

export function calcStatMedia(stats = {}) {
  const vals = Object.values(stats).filter(v => typeof v === 'number' && !isNaN(v))
  if (vals.length === 0) return 0
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}