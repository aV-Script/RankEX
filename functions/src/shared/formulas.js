// Speculare a src/constants/formulas.js — nessuna dipendenza browser.

const FORMULAS = {
  y_balance_composite: (vars) => {
    const dx = (vars.ANT_dx + vars.PM_dx + vars.PL_dx) / (3 * vars.lunghezza_dx) * 100
    const sx = (vars.ANT_sx + vars.PM_sx + vars.PL_sx) / (3 * vars.lunghezza_sx) * 100
    return (dx + sx) / 2
  },
  y_balance_anterior: (vars) => {
    const dx = (vars.ANT_dx / vars.lunghezza_dx) * 100
    const sx = (vars.ANT_sx / vars.lunghezza_sx) * 100
    return (dx + sx) / 2
  },
}

export function applyFormula(test, varsValues) {
  if (!test.formulaType) return null
  const fn = FORMULAS[test.formulaType]
  return fn ? fn(varsValues) : null
}
