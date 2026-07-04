/**
 * RankEX Cloud Functions — entry point
 *
 * Esporta tutte le callable e i trigger.
 * Ogni funzione è in un file separato per cold start selettivo.
 *
 * Callable (chiamate dal client via httpsCallable):
 *   - chiudiSessione          → sostituisce closeSessionUseCase.js
 *   - recalcolaCampionamenti   → sostituisce scripts/recalcolo-campionamenti.mjs
 *
 * Trigger (pianificati o event-driven):
 *   — nessuno ancora
 */

import { initializeApp } from 'firebase-admin/app'

initializeApp()

export { chiudiSessione }        from './callable/chiudiSessione.js'
export { recalcolaCampionamenti } from './callable/recalcolaCampionamenti.js'
