import { useEffect, useRef } from 'react'

// Stack globale di "azioni indietro" — permette al back button nativo Android
// (useNativeBackButton.js) di eseguire l'azione giusta invece di affidarsi a
// window.history.back() (rimosso in STORY-028/ADR-005: la history reale della
// WebView non riflette la navigazione interna dell'app, puro stato React senza
// history.pushState). Generalizzato da "stack di modal aperti" (STORY-026) a
// "stack di azioni indietro" — la logica LIFO non cambia, copre sia dialog
// (Modal/ConfirmDialog) sia viste/step non modali con un proprio back-affordance
// già visibile (vedi useViewBackButton più sotto).
const stack = []

export function pushBackAction(onBack) {
  stack.push(onBack)
  return () => {
    const i = stack.lastIndexOf(onBack)
    if (i !== -1) stack.splice(i, 1)
  }
}

export function triggerTopBackAction() {
  if (stack.length === 0) return false
  stack[stack.length - 1]()
  return true
}

export function hasBackAction() {
  return stack.length > 0
}

/**
 * Registra un dialog (Modal/ConfirmDialog) sullo stack una sola volta al
 * mount, non ad ogni render. La maggior parte dei chiamanti passa una arrow
 * function inline come onClose/onCancel (nuovo riferimento ad ogni render del
 * genitore) — usare quel riferimento direttamente nelle dep di useEffect
 * sposterebbe la posizione del dialog nello stack ad ogni re-render del
 * genitore, non solo all'apertura reale (code review post-STORY-026,
 * 2026-09-15). Il ref tiene sempre la versione più recente del callback senza
 * toccare l'ordine dello stack finché il dialog resta montato.
 */
export function useModalBackButton(onClose) {
  const ref = useRef(onClose)
  ref.current = onClose
  useEffect(() => pushBackAction(() => ref.current()), [])
}

/**
 * Registra una vista/step non modale (nessun overlay, es. wizard, dettaglio
 * con back-affordance in header) — STORY-028/ADR-005, wave 2. A differenza di
 * useModalBackButton, onBack può essere condizionale (es. solo quando è
 * selezionato un cliente, o quando il tab attivo non è la home): passare
 * `null`/`undefined` quando l'azione non deve essere intercettata in questo
 * momento. La dipendenza è sulla sola presenza (booleana) del callback, non sul
 * suo riferimento — evita di registrare/deregistrare ad ogni render mentre
 * resta "attivo", stesso principio di useModalBackButton.
 */
export function useViewBackButton(onBack) {
  const ref = useRef(onBack)
  ref.current = onBack
  const isActive = Boolean(onBack)
  useEffect(() => {
    if (!isActive) return undefined
    return pushBackAction(() => ref.current())
  }, [isActive])
}
