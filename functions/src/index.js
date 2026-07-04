/**
 * RankEX Cloud Functions — entry point
 *
 * Callable (chiamate dal client via httpsCallable):
 *   - chiudiSessione              → sostituisce closeSessionUseCase.js
 *   - recalcolaCampionamenti      → sostituisce scripts/recalcolo-campionamenti.mjs
 *   - salvaCampionamento          → sostituisce saveCampionamentoUseCase.js
 *   - salvaXP                     → sostituisce saveXPUseCase.js
 *   - salvaBia                    → sostituisce saveBiaUseCase.js
 *   - aggiornaProfiloCliente      → sostituisce upgradeProfileUseCase.js
 *   - creaCliente                 → sostituisce createClientUseCase.js
 *   — Batch 2: tutte le scritture FE migrate a BE —
 *   - eliminaCliente
 *   - creaMembroTeam
 *   - rimuoviMembroTeam
 *   - aggiornaRuoloMembro
 *   - aggiungiSlot / aggiornaSlot / eliminaSlot / saltaSlot
 *   - aggiungiRicorrenza / aggiornaRicorrenzaOrario / aggiornaRicorrenzaGiorni
 *   - estendirRicorrenza
 *   - aggiungiClienteRicorrenza / rimuoviClienteRicorrenza / cancellaRicorrenza
 *   - aggiungiGruppo / aggiornaGruppo / eliminaGruppo
 *   - aggiungiNota / eliminaNota
 *   - aggiungiSchedaAllenamento / aggiornaSchedaAllenamento / eliminaSchedaAllenamento
 *   - segnaNotificaLetta / segnaAllLette
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

export { eliminaCliente }              from './callable/eliminaCliente.js'
export { creaMembroTeam }              from './callable/creaMembroTeam.js'
export { rimuoviMembroTeam }           from './callable/rimuoviMembroTeam.js'
export { aggiornaRuoloMembro }         from './callable/aggiornaRuoloMembro.js'
export { aggiungiSlot }                from './callable/aggiungiSlot.js'
export { aggiornaSlot }                from './callable/aggiornaSlot.js'
export { eliminaSlot }                 from './callable/eliminaSlot.js'
export { saltaSlot }                   from './callable/saltaSlot.js'
export { aggiungiRicorrenza }          from './callable/aggiungiRicorrenza.js'
export { aggiornaRicorrenzaOrario }    from './callable/aggiornaRicorrenzaOrario.js'
export { aggiornaRicorrenzaGiorni }    from './callable/aggiornaRicorrenzaGiorni.js'
export { estendirRicorrenza }          from './callable/estendirRicorrenza.js'
export { aggiungiClienteRicorrenza }   from './callable/aggiungiClienteRicorrenza.js'
export { rimuoviClienteRicorrenza }    from './callable/rimuoviClienteRicorrenza.js'
export { cancellaRicorrenza }          from './callable/cancellaRicorrenza.js'
export { aggiungiGruppo }              from './callable/aggiungiGruppo.js'
export { aggiornaGruppo }              from './callable/aggiornaGruppo.js'
export { eliminaGruppo }              from './callable/eliminaGruppo.js'
export { aggiungiNota }                from './callable/aggiungiNota.js'
export { eliminaNota }                 from './callable/eliminaNota.js'
export { aggiungiSchedaAllenamento }   from './callable/aggiungiSchedaAllenamento.js'
export { aggiornaSchedaAllenamento }   from './callable/aggiornaSchedaAllenamento.js'
export { eliminaSchedaAllenamento }    from './callable/eliminaSchedaAllenamento.js'
export { segnaNotificaLetta }          from './callable/segnaNotificaLetta.js'
export { segnaAllLette }               from './callable/segnaAllLette.js'
