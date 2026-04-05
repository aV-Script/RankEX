import { useReadonly } from '../../context/ReadonlyContext'

/**
 * Nasconde i propri children quando readonly=true.
 * Usare per avvolgere elementi di modifica (bottoni, form).
 */
export function ReadonlyGuard({ children, fallback = null }) {
  const readonly = useReadonly()
  if (readonly) return fallback
  return children
}
