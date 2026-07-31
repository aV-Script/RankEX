import { logout }          from '../../firebase/services/auth'
import { AppNav }          from './trainer-shell/AppNav'

export function TrainerShell({ page, onNavigate, children }) {
  return (
    <div className="min-h-screen text-white flex flex-col">
      <a href="#main-content" className="skip-to-content">Vai al contenuto</a>
      <AppNav page={page} onNavigate={onNavigate} onLogout={logout} />
      <main id="main-content" className="flex-1 min-w-0 pb-16 lg:pb-0" aria-label="Contenuto principale">
        {children}
      </main>
    </div>
  )
}
