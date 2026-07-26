import { useEffect } from 'react'

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Intrappola il focus da tastiera dentro il nodo referenziato mentre è attivo:
 * porta il focus sul primo elemento interattivo all'apertura e impedisce
 * a Tab/Shift+Tab di uscire dal contenitore (dialog/modal).
 * @param {import('react').RefObject<HTMLElement>} ref
 * @param {boolean} active
 */
export function useFocusTrap(ref, active = true) {
  useEffect(() => {
    if (!active || !ref.current) return
    const node = ref.current

    const getFocusables = () => Array.from(node.querySelectorAll(FOCUSABLE_SELECTOR))

    const initial = getFocusables()
    ;(initial[0] ?? node).focus()

    const onKeyDown = e => {
      if (e.key !== 'Tab') return
      const focusables = getFocusables()
      if (!focusables.length) return
      const first = focusables[0]
      const last  = focusables[focusables.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    node.addEventListener('keydown', onKeyDown)
    return () => node.removeEventListener('keydown', onKeyDown)
  }, [active, ref])
}
