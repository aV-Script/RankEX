// Home dell'area cliente: Monete in alto a destra, testata, pentagono, striscia/prossima sessione,
// ultime notifiche. Mobile a una colonna; da `lg` pentagono a sinistra e blocchi a destra.

import { useUpcomingSessions } from '../useUpcomingSessions'
import { ClientHub } from './ClientHub'
import { ClientHomeHeader } from './ClientHomeHeader'
import { StreakCard, NextSessionCard, LatestNotificationsCard } from './ClientHomeCards'
import { CoinsBadge } from './CoinsBadge'

const CALENDAR_TAB = 'calendario'

export function ClientHome({
  client, clientId, orgId, color, rankObj, media, capabilities, terminology,
  notifications, notificationsStatus, onRetryNotifs, onOpenNotifs, onTabChange,
}) {
  const upcoming = useUpcomingSessions(orgId, clientId)

  // pb-[78px] = bottom nav fissa (62) + margine: l'ultima card resta raggiungibile scorrendo
  return (
    <div
      className="flex-1 w-full max-w-[1100px] mx-auto px-4 pt-3 flex flex-col gap-3 select-none pb-[78px] lg:pb-8"
    >
      <div className="flex justify-end">
        <CoinsBadge coins={client.coins ?? 0} />
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[auto_minmax(0,420px)] lg:gap-x-10 lg:gap-y-4 lg:justify-center lg:items-start">
        <div className="lg:col-start-2 lg:row-start-1 min-w-0">
          <ClientHomeHeader
            client={client}
            rankObj={rankObj}
            media={media}
            capabilities={capabilities}
            color={color}
          />
        </div>

        <div className="-mx-4 lg:mx-0 lg:col-start-1 lg:row-start-1 lg:row-span-2">
          <ClientHub client={client} orgId={orgId} color={color} onTabChange={onTabChange} />
        </div>

        <div className="flex flex-col gap-3 min-w-0 lg:col-start-2 lg:row-start-2">
          <div className="grid grid-cols-2 gap-3">
            <StreakCard client={client} terminology={terminology} color={color} />
            <NextSessionCard
              sessions={upcoming.sessions}
              status={upcoming.status}
              onRetry={upcoming.retry}
              onOpenCalendar={() => onTabChange(CALENDAR_TAB)}
              terminology={terminology}
            />
          </div>
          <LatestNotificationsCard
            notifications={notifications}
            status={notificationsStatus}
            onRetry={onRetryNotifs}
            onOpenAll={onOpenNotifs}
            color={color}
          />
        </div>
      </div>
    </div>
  )
}
