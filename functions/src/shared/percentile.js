// Speculare a src/utils/percentile.js — usa TESTS_META invece di ALL_TESTS.
import { TESTS_META }                  from './testsMeta.js'
import { TABLES, getAgeGroupClamped }  from './tables.js'

export function calcAge(dataNascita) {
  if (!dataNascita) return null
  const birth = new Date(dataNascita)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function calcPercentileEx(stat, value, sex, age, testKey) {
  const testEntry = testKey
    ? TESTS_META.find(t => t.key === testKey)
    : TESTS_META.find(t => t.stat === stat)
  if (!testEntry) return { value: null, outOfRange: false }

  const table = TABLES[testEntry.key]
  if (!table || !table[sex]) return { value: null, outOfRange: false }

  const { group: ageGroup, outOfRange } = getAgeGroupClamped(testEntry.key, age, sex)
  if (!ageGroup) return { value: null, outOfRange: false }

  const percentiles = table[sex][ageGroup]
  if (!percentiles) return { value: null, outOfRange: false }

  const direction = testEntry.direction ?? 'direct'

  const sorted = Object.entries(percentiles)
    .map(([p, v]) => [parseFloat(p), parseFloat(v)])
    .sort((a, b) => direction === 'direct' ? a[1] - b[1] : b[1] - a[1])

  let result

  if (direction === 'direct') {
    if (value <= sorted[0][1]) result = sorted[0][0]
    else if (value >= sorted[sorted.length - 1][1]) result = sorted[sorted.length - 1][0]
    else {
      for (let i = 0; i < sorted.length - 1; i++) {
        const [p1, v1] = sorted[i]
        const [p2, v2] = sorted[i + 1]
        if (value >= v1 && value <= v2) {
          result = Math.round(p1 + (value - v1) / (v2 - v1) * (p2 - p1))
          break
        }
      }
    }
  } else {
    if (value >= sorted[0][1]) result = sorted[0][0]
    else if (value <= sorted[sorted.length - 1][1]) result = sorted[sorted.length - 1][0]
    else {
      for (let i = 0; i < sorted.length - 1; i++) {
        const [p1, v1] = sorted[i]
        const [p2, v2] = sorted[i + 1]
        if (value <= v1 && value >= v2) {
          result = Math.round(p1 + (value - v1) / (v2 - v1) * (p2 - p1))
          break
        }
      }
    }
  }

  return { value: result ?? 0, outOfRange }
}
