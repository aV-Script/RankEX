import { logout }          from '../../firebase/services/auth'
import { CircularNav }     from './trainer-shell/CircularNav'
import { NavMenuProvider } from '../../context/NavMenuContext'

export function TrainerShell({ page, onNavigate, children }) {
  return (
    <NavMenuProvider>
      <div className="min-h-screen text-white">
        <CircularNav
          page={page}
          onNavigate={onNavigate}
          onLogout={logout}
        />
        <main className="min-w-0" aria-label="Contenuto principale">
          {children}
        </main>
      </div>
    </NavMenuProvider>
  )
}
