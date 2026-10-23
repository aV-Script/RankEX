import { useEffect, useRef } from 'react'

// Pila dei livelli aperti (dialog, modal, menu): Esc chiude solo l'ultimo aperto.
// Prima ogni dialog ascoltava Esc su window per conto suo, e con un dialog di
// conferma sopra un modal un solo Esc li chiudeva entrambi.
const stack = []

function handleKeyDown(e) {
  if (e.key !== 'Escape' || stack.length === 0) return
  stack[stack.length - 1].current?.()
}

/**
 * Chiama onEscape quando si preme Esc e questo è il livello aperto più in alto.
 * @param {() => void} onEscape — chiusura del dialog/menu
 * @param {boolean}    active   — false per i menu che esistono ma sono chiusi
 */
export function useEscapeKey(onEscape, active = true) {
  const handlerRef = useRef(onEscape)
  handlerRef.current = onEscape

  useEffect(() => {
    if (!active) return
    if (stack.length === 0) window.addEventListener('keydown', handleKeyDown)
    stack.push(handlerRef)
    return () => {
      const i = stack.lastIndexOf(handlerRef)
      if (i !== -1) stack.splice(i, 1)
      if (stack.length === 0) window.removeEventListener('keydown', handleKeyDown)
    }
  }, [active])
}
