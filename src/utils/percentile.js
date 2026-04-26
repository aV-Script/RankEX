import { ALL_TESTS }                      from '../constants'
import { TABLES, getAgeGroupClamped }     from './tables'

/**
 * Calcola il percentile con clamping automatico sull'età.
 *
 * @returns {{ value: number|null, outOfRange: boolean }}
 *   value    → percentile calcolato (0–100), o null se mancano dati (test/tabella inesistente)
 *   outOfRange → true se l'età è fuori dalla fascia normativa e si è usata la fascia più vicina
 */
export function calcPercentileEx(stat, value, sex, age, testKey) {
  const testEntry = testKey
    ? ALL_TESTS.find(t => t.key === testKey)
    : ALL_TESTS.find(t => t.stat === stat)
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
    if (value <= sorted[0][1])                 result = sorted[0][0]
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
    if (value >= sorted[0][1])                 result = sorted[0][0]
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

/**
 * Wrapper backward-compat: restituisce solo il valore numerico.
 * Usa il clamping di calcPercentileEx, quindi non restituisce più null
 * per età fuori range (restituisce il percentile stimato dalla fascia più vicina).
 * Restituisce null solo se test o tabella non esistono.
 */
export function calcPercentile(stat, value, sex, age, testKey) {
  return calcPercentileEx(stat, value, sex, age, testKey).value
}

export function calcStatMedia(stats = {}) {
  const vals = Object.values(stats).filter(v => typeof v === 'number' && !isNaN(v))
  if (vals.length === 0) return 0
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}
