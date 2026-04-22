/**
 * Mappa formulaType → funzione di calcolo.
 * Aggiungere un test con formula nuova = aggiungere una voce qui.
 * Il JSON dei test riferisce il tipo per nome — nessuna funzione nel JSON.
 */
export const FORMULAS = {
  y_balance_composite: (vars) => {
    const dx = (vars.ANT_dx + vars.PM_dx + vars.PL_dx) / (3 * vars.lunghezza_dx) * 100
    const sx = (vars.ANT_sx + vars.PM_sx + vars.PL_sx) / (3 * vars.lunghezza_sx) * 100
    return (dx + sx) / 2
  },
}

/**
 * Applica la formula di un test dato i valori delle variabili.
 * Restituisce null se il test non ha formula o se le variabili sono incomplete.
 */
export function applyFormula(test, varsValues) {
  if (!test.formulaType) return null
  const fn = FORMULAS[test.formulaType]
  if (!fn) return null
  return fn(varsValues)
}