/**
 * RankEX Cloud Functions — entry point
 *
 * Callable (chiamate dal client via httpsCallable):
 *   - chiudiSessione           → sostituisce closeSessionUseCase.js
 *   - recalcolaCampionamenti   → sostituisce scripts/recalcolo-campionamenti.mjs
 *   - salvaCampionamento       → sostituisce saveCampionamentoUseCase.js
 *   - salvaXP                  → sostituisce saveXPUseCase.js
 *   - salvaBia                 → sostituisce saveBiaUseCase.js
 *   - aggiornaProfiloCliente   → sostituisce upgradeProfileUseCase.js
 *   - creaCliente              → sostituisce createClientUseCase.js
 */

import { initializeApp } from 'firebase-admin/app'

initializeApp()

export { chiudiSessione }          from './callable/chiudiSessione.js'
export { recalcolaCampionamenti }  from './callable/recalcolaCampionamenti.js'
export { salvaCampionamento }      from './callable/salvaCampionamento.js'
export { salvaXP }                 from './callable/salvaXP.js'
export { salvaBia }                from './callable/salvaBia.js'
export { aggiornaProfiloCliente }  from './callable/aggiornaProfiloCliente.js'
export { creaCliente }             from './callable/creaCliente.js'
