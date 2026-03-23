import { logout }    from '../../firebase/services/auth'
import { Sidebar }   from './trainer-shell/Sidebar'
import { MobileNav } from './trainer-shell/MobileNav'

/**
 * Shell principale dell'area trainer.
 * Compone sidebar desktop e navigazione mobile.
 * È l'unico posto che conosce `logout` — lo passa ai figli come prop.
 *
 * Props:
 *   page       — pagina attiva ('clients' | 'calendar' | 'guide' | 'profile')
 *   onNavigate — callback chiamato al cambio pagina
 *   children   — contenuto della pagina corrente
 */
export function TrainerShell({ page, onNavigate, children }) {
  return (
    <div className="min-h-screen text-white flex flex-col lg:flex-row">

      <Sidebar
        page={page}
        onNavigate={onNavigate}
        onLogout={logout}
      />

      <MobileNav
        page={page}
        onNavigate={onNavigate}
        onLogout={logout}
      />

      <main
        className="flex-1 min-w-0"
        aria-label="Contenuto principale"
      >
        {children}
      </main>

    </div>
  )
}