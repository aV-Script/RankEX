import { logout }      from '../../firebase/services/auth'
import { CircularNav } from './trainer-shell/CircularNav'

/**
 * Shell trainer con navigazione circolare ad arco.
 * Trigger fisso top-right; arco 180°–272° ancorato al trigger.
 */
export function TrainerShell({ page, onNavigate, children }) {
  return (
    <div className="min-h-screen text-white">
      <CircularNav
        page={page}
        onNavigate={onNavigate}
        onLogout={logout}
      />

      {/* pt-[52px] compensa l'header mobile fisso; su desktop non serve */}
      <main
        className="min-w-0"
        aria-label="Contenuto principale"
      >
        {children}
      </main>
    </div>
  )
}
