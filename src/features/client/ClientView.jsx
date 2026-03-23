import { useState, useCallback }          from 'react'
import { useClient }                      from './useClient'
import { Skeleton }                       from '../../components/common/Skeleton'
import { useClientRank }                  from '../../hooks/useClientRank'
import { useNotifications }               from '../../hooks/useNotifications'
import { ClientShell }                    from './client-view/ClientShell'
import { ClientDashboardPage }            from './client-view/ClientDashboardPage'
import { ClientProfilePage }              from './client-view/ClientProfilePage'
import { ClientCalendar }                 from './ClientCalendar'
import { PlayerCard }                     from './PlayerCard'
import { NotificationsPanel }             from '../notification/NotificationsPanel'

// Mappa pagina → componente
const PAGES = {
  dashboard: ClientDashboardPage,
  calendar:  null, // gestito inline per via delle props
  profile:   null, // gestito inline per via di onCard
}

/**
 * Entry point dell'area cliente.
 * Gestisce fetch, navigazione, notifiche e player card.
 */
export default function ClientView({ clientId }) {
  const { client, loading } = useClient(clientId)
  const { rankObj, color }  = useClientRank(client)
  const { notifications, unreadCount, markAllRead, remove } = useNotifications(clientId)

  const [view,        setView]        = useState('dashboard') // 'dashboard' | 'card'
  const [activePage,  setActivePage]  = useState('dashboard')
  const [showNotifs,  setShowNotifs]  = useState(false)

  const handleOpenNotifs = useCallback(async () => {
    setShowNotifs(true)
    await markAllRead()
  }, [markAllRead])

  if (loading) return (
    <div className="min-h-screen p-6 flex flex-col gap-4 max-w-md mx-auto pt-12">
      <Skeleton variant="circle" size={64} />
      <Skeleton variant="text" count={2} />
      <Skeleton variant="card" count={2} />
    </div>
  )
  if (!client) return <FullScreenMsg>Profilo non trovato.</FullScreenMsg>

  // Player card — vista a schermo intero
  if (view === 'card') {
    return <PlayerCard client={client} onEnter={() => setView('dashboard')} />
  }

  return (
    <ClientShell
      activePage={activePage}
      onNavigate={setActivePage}
      color={color}
      unreadCount={unreadCount}
      onOpenNotifs={handleOpenNotifs}
    >
      {activePage === 'dashboard' && (
        <ClientDashboardPage
          client={client}
          color={color}
          rankObj={rankObj}
        />
      )}

      {activePage === 'calendar' && (
        <div className="px-4 py-6">
          <ClientCalendar
            clientId={clientId}
            sessionsPerWeek={client.sessionsPerWeek}
          />
        </div>
      )}

      {activePage === 'profile' && (
        <ClientProfilePage
          client={client}
          color={color}
          onCard={() => setView('card')}
        />
      )}

      {showNotifs && (
        <NotificationsPanel
          notifications={notifications}
          color={color}
          onClose={() => setShowNotifs(false)}
          onDelete={remove}
        />
      )}
    </ClientShell>
  )
}

function FullScreenMsg({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="font-display text-white/30 tracking-[3px] text-[13px]">{children}</div>
    </div>
  )
}
