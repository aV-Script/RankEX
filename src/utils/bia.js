import {
  FAT_MASS_RANGES,
  WATER_RANGES,
  VISCERAL_RANGES,
  BMI_RANGES,
  BIA_KEY_PARAMS,
  BIA_Q,
  XP_BIA,
} from '../constants/bia'
import { getRankFromMedia } from '../constants'

/**
 * Restituisce il colore di stato per un parametro BIA
 * in base ai range clinici e ai dati anagrafici del cliente.
 *
 * @returns {{ color: string, label: string, score: number }}
 *          score: 0-100 per normalizzazione visiva
 */
export function getBiaParamStatus(key, value, sex = 'M', age = 30) {
  if (value === null || value === undefined || value === '') {
    return { color: 'rgba(255,255,255,0.2)', label: '—', score: 0 }
  }

  switch (key) {

    case 'fatMassPercent': {
      const ageGroup = age < 40 ? '18-39' : age < 60 ? '40-59' : '60+'
      const ranges   = FAT_MASS_RANGES[sex]?.[ageGroup]
      if (!ranges) return { color: BIA_Q.neutral, label: 'N/D', score: 50 }
      if (value <= ranges.excellent[1]) return { color: BIA_Q.excellent, label: 'Eccellente', score: 85 }
      if (value <= ranges.good[1])      return { color: BIA_Q.good,      label: 'Buono',      score: 70 }
      if (value <= ranges.normal[1])    return { color: BIA_Q.normal,    label: 'Normale',    score: 62 }
      if (value <= ranges.high[1])      return { color: BIA_Q.high,      label: 'Alto',       score: 42 }
      return                                   { color: BIA_Q.bad,       label: 'Obeso',      score: 27 }
    }

    case 'waterPercent': {
      const ranges = WATER_RANGES[sex]
      if (value < ranges.low[1])      return { color: BIA_Q.low,       label: 'Bassa',    score: 22 }
      if (value < ranges.normal[1])   return { color: BIA_Q.normal,    label: 'Normale',  score: 62 }
      if (value <= ranges.optimal[1]) return { color: BIA_Q.excellent, label: 'Ottimale', score: 85 }
      return                                 { color: BIA_Q.neutral,   label: 'Alta',     score: 65 }
    }

    case 'visceralFat': {
      const range = VISCERAL_RANGES.find(r => value >= r.range[0] && value <= r.range[1])
      const score = Math.round(100 - ((value - 1) / 11) * 100)
      return range
        ? { color: range.color, label: range.label, score }
        : { color: BIA_Q.bad, label: 'Alto', score: 27 }
    }

    case 'bmi': {
      const range = BMI_RANGES.find(r => value >= r.range[0] && value < r.range[1])
      const score = value >= 18.5 && value < 25 ? 85 :
                    value >= 25   && value < 30 ? 42 :
                    value < 18.5               ? 22 : 27
      return range
        ? { color: range.color, label: range.label, score }
        : { color: BIA_Q.bad, label: 'Obeso', score: 27 }
    }

    case 'metabolicAge': {
      const diff  = value - age
      const color = diff < -5  ? BIA_Q.excellent :
                    diff < 0   ? BIA_Q.good      :
                    diff === 0 ? BIA_Q.normal    :
                    diff < 5   ? BIA_Q.high      : BIA_Q.bad
      const label = diff < -5  ? 'Ottima'     :
                    diff < 0   ? 'Buona'      :
                    diff === 0 ? 'Normale'    :
                    diff < 5   ? 'Alta'       : 'Molto alta'
      const score = diff < -5  ? 85 : diff < 0 ? 70 : diff === 0 ? 62 : diff < 5 ? 42 : 27
      return { color, label, score }
    }

    // muscleMassKg, boneMassKg, bmrKcal → visualizzazione neutra
    default:
      return { color: BIA_Q.neutral, label: String(value), score: 65 }
  }
}

/**
 * Calcola il BMI automaticamente da peso e altezza.
 */
export function calcBmi(pesoKg, altezzaCm) {
  if (!pesoKg || !altezzaCm) return null
  const h = altezzaCm / 100
  return Math.round((pesoKg / (h * h)) * 10) / 10
}

/**
 * Calcola quanti XP assegnare per una misurazione BIA.
 */
export function calcBiaXP(newBia, prevBia) {
  if (!prevBia) return XP_BIA.FIRST_MEASUREMENT

  let improvements = 0
  BIA_KEY_PARAMS.forEach(key => {
    const prev = prevBia[key]
    const curr = newBia[key]
    if (prev == null || curr == null) return
    if (key === 'fatMassPercent' || key === 'visceralFat') {
      if (curr < prev) improvements++
    } else {
      if (curr > prev) improvements++
    }
  })

  if (improvements === 4) return XP_BIA.ALL
  if (improvements >= 2)  return XP_BIA.MOST
  if (improvements === 1) return XP_BIA.PARTIAL
  return XP_BIA.NONE
}

/**
 * Calcola lo score complessivo BIA (0-100) per visualizzazione.
 * Media pesata dei parametri chiave con status.
 */
export function calcBiaScore(bia, sex, age) {
  if (!bia) return 0
  const keyParams = ['fatMassPercent', 'waterPercent', 'visceralFat', 'bmi']
  const scores    = keyParams
    .map(key => getBiaParamStatus(key, bia[key], sex, age).score)
    .filter(s => s > 0)
  if (scores.length === 0) return 0
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

/**
 * Restituisce rank e colore per lo score BIA (0-100).
 * Usa la stessa scala e gli stessi colori del sistema rank atletico.
 */
export function getBiaRankFromScore(score) {
  return getRankFromMedia(score)
}
