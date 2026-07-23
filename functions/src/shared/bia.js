// Costanti e logica BIA per le Cloud Functions.
// Speculare a src/constants/bia.js + src/utils/bia.js (solo la parte di calcolo XP).

export const XP_BIA = Object.freeze({
  FIRST_MEASUREMENT: 50,
  ALL:              100,
  MOST:              60,
  PARTIAL:           30,
  NONE:              10,
})

// Parametri chiave per il calcolo del miglioramento
const BIA_KEY_PARAMS = ['fatMassPercent', 'muscleMassKg', 'waterPercent', 'visceralFat']

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

export function calcBmi(pesoKg, altezzaCm) {
  if (!pesoKg || !altezzaCm) return null
  const h = altezzaCm / 100
  return Math.round((pesoKg / (h * h)) * 10) / 10
}
