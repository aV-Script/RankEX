/**
 * Shell layout dell'area cliente — contenitore minimo.
 * Navigazione e header gestiti da ClientCircularNav.
 */
export function ClientShell({ children }) {
  return (
    <div className="min-h-screen text-white">
      {children}
    </div>
  )
}
