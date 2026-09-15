import { useEffect } from 'react'
import { isNativeApp } from '../utils/nativeApp'
import { hasBackAction, triggerTopBackAction } from './useModalStack'

/**
 * Pulsante Back Android — comportamento richiesto (vedi CLAUDE.md → mobile-app):
 * 0. se una qualunque azione indietro è registrata (Modal/ConfirmDialog aperto,
 *    o una vista non modale con un proprio back-affordance — vedi
 *    useModalStack.js), la esegue;
 * 1. altrimenti NON chiude l'app — la manda in background (convenzione Android
 *    standard, es. Gmail/Chrome), mai un finish()/exitApp() che la uccide.
 *
 * **`canGoBack`/`window.history.back()` rimossi (STORY-028/ADR-005, set 2026):**
 * la navigazione interna dell'app (dashboard↔clienti↔wizard↔gruppi↔... per ogni
 * ruolo) è puro stato React (`useState`), zero `history.pushState`/`popstate` —
 * l'unica navigazione a URL reale sono i 4 redirect di primo livello in
 * `routes.config.jsx`, tutti `replace` (mai un secondo entry). `canGoBack` era
 * quindi nella pratica sempre `false`, e nel raro caso `true` rischiava di far
 * atterrare l'utente su una schermata pre-inizializzazione della SPA (fuori
 * dall'app) invece che "indietro di una pagina" come ci si aspetterebbe.
 * Rimosso: il fallback è sempre `minimizeApp()`, per costruzione mai peggiore
 * del comportamento precedente in nessun caso.
 *
 * Copertura nota: lo stack copre Modal/ConfirmDialog (STORY-026) + le viste non
 * modali che registrano esplicitamente un back-affordance già esistente (wave 2,
 * vedi ADR-005 per l'elenco). Il back tra pagine "sorelle" senza gerarchia (es.
 * tab principali della nav) minimizza sempre l'app — scelta deliberata, non un
 * gap dimenticato, vedi ADR-005 per il ragionamento.
 *
 * No-op fuori dalla shell nativa.
 */
export function useNativeBackButton() {
  useEffect(() => {
    if (!isNativeApp()) return

    const { App } = window.Capacitor.Plugins
    if (!App) return

    const listener = App.addListener('backButton', () => {
      if (hasBackAction()) { triggerTopBackAction(); return }
      App.minimizeApp()
    })

    return () => listener.then((l) => l.remove())
  }, [])
}
