import { CATEGORY_TESTS } from '../constants/index.js';
import { STAT_DIRECTION } from './tables.js'; 
import { TABLES } from './tables.js';
import { getAgeGroup } from './tables.js';


/**
 * Calcola il percentile (0-100) dato un valore grezzo.
 * Funziona per tutte le statistiche di tutte le categorie.
 */
export function calcPercentile(stat, value, sex, age) {
  // trova il test corrispondente usando stat
  const testEntry = Object.values(CATEGORY_TESTS)
    .flat()
    .find(t => t.stat === stat);

  if (!testEntry) return null;

  // usa la key per accedere a TABLES
  const table = TABLES[testEntry.key];
  if (!table || !table[sex]) return null;

  // determina la fascia d'età corretta
  const ageGroup = getAgeGroup(testEntry.key, age);
  const percentiles = table[sex][ageGroup];
  if (!percentiles) return null;

  // ordina i valori in base alla direzione del test
  const direction = STAT_DIRECTION[testEntry.key] || 'direct';
  const sorted = Object.entries(percentiles)
    .map(([p, v]) => [parseFloat(p), parseFloat(v)])
    .sort((a, b) => direction === 'direct' ? a[1] - b[1] : b[1] - a[1]);

  // valori fuori scala
  if (direction === 'direct') {
    if (value <= sorted[0][1]) return sorted[0][0];
    if (value >= sorted[sorted.length - 1][1]) return sorted[sorted.length - 1][0];
  } else {
    if (value >= sorted[0][1]) return sorted[0][0];
    if (value <= sorted[sorted.length - 1][1]) return sorted[sorted.length - 1][0];
  }

  // interpolazione lineare tra i due percentili più vicini
  for (let i = 0; i < sorted.length - 1; i++) {
    const [p1, v1] = sorted[i];
    const [p2, v2] = sorted[i + 1];

    const inRange = direction === 'direct' ? value >= v1 && value <= v2
                                          : value <= v1 && value >= v2;

    if (inRange) {
      const ratio = (value - v1) / (v2 - v1);
      return Math.round(p1 + ratio * (p2 - p1));
    }
  }

  return 0; // fallback
}

/**
 * Calcola la media delle statistiche.
 */
export function calcStatMedia(stats = {}) {
  const vals = Object.values(stats).filter(v => typeof v === 'number' && !isNaN(v))
  if (vals.length === 0) return 0
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}
