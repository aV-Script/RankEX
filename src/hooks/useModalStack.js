import { useEffect, useRef } from 'react'

// Stack globale dei dialog/modal attualmente aperti — permette al back button
// nativo Android (useNativeBackButton.js) di chiudere il modal in cima invece
// di navigare via la pagina sottostante (STORY-026, audit UX superfici
// mobile-native). Modal/ConfirmDialog sono puro stato React, senza
// history.pushState: senza questo stack, il back button non ha modo di sapere
// che qualcosa è aperto sopra la pagina.
const stack = []

export function pushModalClose(onClose) {
  stack.push(onClose)
  return () => {
    const i = stack.lastIndexOf(onClose)
    if (i !== -1) stack.splice(i, 1)
  }
}

export function closeTopModal() {
  if (stack.length === 0) return false
  stack[stack.length - 1]()
  return true
}

export function hasOpenModal() {
  return stack.length > 0
}

/**
 * Registra un dialog sullo stack una sola volta al mount, non ad ogni render.
 * La maggior parte dei chiamanti passa una arrow function inline come
 * onClose/onCancel (nuovo riferimento ad ogni render del genitore) — usare
 * quel riferimento direttamente nelle dep di useEffect sposterebbe la
 * posizione del dialog nello stack ad ogni re-render del genitore, non solo
 * all'apertura reale (code review post-STORY-026, 2026-09-15). Il ref tiene
 * sempre la versione più recente del callback senza toccare l'ordine dello
 * stack finché il dialog resta montato.
 */
export function useModalBackButton(onClose) {
  const ref = useRef(onClose)
  ref.current = onClose
  useEffect(() => pushModalClose(() => ref.current()), [])
}
