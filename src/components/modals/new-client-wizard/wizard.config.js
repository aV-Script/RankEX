/**
 * Configurazione degli step del wizard.
 * BIA e test vengono inseriti dopo la creazione del cliente, non nel wizard.
 *
 * type:
 *   'anagrafica'   — dati anagrafici
 *   'ruolo'        — ruolo giocatore (moduli con ruoli, soccer)
 *   'profileType'  — selezione tipologia profilo (moduli con profili, PT)
 *   'categoria'    — selezione categoria test (solo se il profilo include test)
 *   'account'      — credenziali cliente (moduli con login del cliente)
 *   'contatto'     — email facoltativa, nessun account (moduli senza login, ADR-010)
 *   'informativa'  — attestazione informativa consegnata, facoltativa (moduli con
 *                    valutazioni, ADR-015 §1)
 */

const ANAGRAFICA_STEP   = { type: 'anagrafica',  title: 'Dati anagrafici' }
const RUOLO_STEP        = { type: 'ruolo',       title: 'Ruolo giocatore' }
const PROFILE_TYPE_STEP = { type: 'profileType', title: 'Tipologia profilo' }
const CATEGORIA_STEP    = { type: 'categoria',   title: 'Categoria test' }
const ACCOUNT_STEP      = { type: 'account',     title: 'Account cliente' }
const CONTATTO_STEP     = { type: 'contatto',    title: 'Contatto' }
const INFORMATIVA_STEP  = { type: 'informativa', title: 'Informativa' }

/**
 * Step del wizard per il modulo dell'org. Ogni step dipende da una capability,
 * mai da "non è soccer": un modulo nuovo non eredita gli step PT (ADR-007).
 *   PT:       anagrafica → profilo → categoria (se non bia_only) → account
 *   Soccer:   anagrafica → ruolo → account
 *   Lipedema: anagrafica → contatto → informativa
 * @param {object} capabilities — getModule(moduleType)
 * @param {string} [profileType]
 */
export function getWizardSteps(capabilities, profileType = 'tests_only') {
  const hasCategoriaStep = capabilities.hasCategories && capabilities.hasPercentileTests &&
    (!capabilities.hasProfileTypes || profileType !== 'bia_only')

  return [
    ANAGRAFICA_STEP,
    ...(capabilities.hasPlayerRoles  ? [RUOLO_STEP]        : []),
    ...(capabilities.hasProfileTypes ? [PROFILE_TYPE_STEP] : []),
    ...(hasCategoriaStep             ? [CATEGORIA_STEP]    : []),
    capabilities.hasClientLogin ? ACCOUNT_STEP : CONTATTO_STEP,
    ...(capabilities.hasAssessments  ? [INFORMATIVA_STEP]  : []),
  ]
}
