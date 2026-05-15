import { logout }          from '../../firebase/services/auth'
import { AppNav }          from './trainer-shell/AppNav'
import { NavMenuProvider } from '../../context/NavMenuContext'

export function TrainerShell({ page, onNavigate, children }) {
  return (
    <NavMenuProvider>
      <div className="min-h-screen text-white flex flex-col">
        <AppNav page={page} onNavigate={onNavigate} onLogout={logout} />
        <main className="flex-1 min-w-0 pb-16 lg:pb-0" aria-label="Contenuto principale">
          {children}
        </main>
      </div>
    </NavMenuProvider>
  )
}
