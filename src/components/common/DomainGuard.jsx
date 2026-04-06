import { isAdminDomain, isDev } from '../../utils/env'

const ADMIN_URL = 'https://rankex-admin.web.app'
const APP_URL   = 'https://rankex-app.web.app'

/**
 * Separazione fisica dei domini.
 *
 * Regole (solo in production — in dev non viene applicato nulla):
 *   admin domain + ruolo NON super_admin → bloccato, link all'app
 *   app domain   + ruolo super_admin     → bloccato, link all'admin
 *
 * Il guard si attiva solo dopo che il profilo è caricato (role != null).
 */
export function DomainGuard({ role, children }) {
  if (isDev || role == null) return children

  if (isAdminDomain() && role !== 'super_admin') {
    return <Blocked message="Questa area è riservata agli amministratori di sistema." href={APP_URL} label="Vai all'app" />
  }

  if (!isAdminDomain() && role === 'super_admin') {
    return <Blocked message="Gli amministratori di sistema devono accedere dal portale admin." href={ADMIN_URL} label="Vai all'admin" />
  }

  return children
}

function Blocked({ message, href, label }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <p className="font-display text-red-400 tracking-widest text-sm uppercase">
        Accesso negato
      </p>
      <p className="text-white/40 text-sm text-center max-w-xs">
        {message}
      </p>
      <a
        href={href}
        className="px-4 py-2 text-sm text-white/70 border rounded-[3px] hover:opacity-80 transition-opacity"
        style={{ borderColor: 'rgba(15,214,90,0.2)' }}
      >
        {label}
      </a>
    </div>
  )
}
