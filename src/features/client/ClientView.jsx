import { useState, useCallback }          from 'react'
import { useClient }                      from './useClient'
import { Skeleton }                       from '../../components/common/Skeleton'
import { useClientRank }                  from '../../hooks/useClientRank'
import { useNotifications }               from '../../hooks/useNotifications'
import { ClientShell }                    from './client-view/ClientShell'
import { ClientDashboardPage }            from './client-view/ClientDashboardPage'
import { NotificationsPanel }             from '../notification/NotificationsPanel'
import { calcBiaScore, getBiaRankFromScore } from '../../utils/bia'

/**
 * Entry point dell'area cliente.
 * Gestisce fetch, notifiche e passa tutto al layout 2-colonne.
 */
export default function ClientView({ clientId, orgId }) {
  const { client, loading } = useClient(orgId, clientId)
  const { rankObj: testRankObj, color: testColor } = useClientRank(client)

  const profileType = client?.profileType ?? 'tests_only'
  const biaScore    = calcBiaScore(client?.lastBia, client?.sesso, client?.eta)
  const biaRankObj  = biaScore > 0 ? getBiaRankFromScore(biaScore) : { label: 'F', color: '#4a5568' }

  const rankObj = profileType === 'bia_only' ? biaRankObj : testRankObj
  const color   = profileType === 'bia_only' ? biaRankObj.color : testColor

  const { notifications, unreadCount, markAllRead, remove } = useNotifications(orgId, clientId)

  const [showNotifs, setShowNotifs] = useState(false)

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

  return (
    <ClientShell
      color={color}
      unreadCount={unreadCount}
      onOpenNotifs={handleOpenNotifs}
    >
      <ClientDashboardPage
        client={client}
        clientId={clientId}
        orgId={orgId}
        color={color}
        rankObj={rankObj}
        biaRankObj={profileType === 'complete' ? biaRankObj : null}
      />

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
