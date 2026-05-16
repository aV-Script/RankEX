import { useState }                from 'react'
import { ActivityLog, StatsSection } from '../../../components/ui'
import { StatsChart }              from '../StatsChart'
import { BiaSummary }              from '../../bia/bia-view/BiaSummary'
import { BiaHistoryChart }         from '../../bia/bia-view/BiaHistoryChart'
import { getProfileCategory }      from '../../../constants/bia'
import { NotesSection }            from '../client-dashboard/NotesSection'
import { ClientWorkoutSection }    from '../client-dashboard/ClientWorkoutSection'
import { ClientCalendar }          from '../ClientCalendar'
import { calcAge }                 from '../../../utils/validation'
import { ClientWearableSection }   from './ClientWearableSection'
import { ClientCircularNav }       from './ClientCircularNav'
import { ClientHUD }               from './ClientHUD'

// ── Icons ─────────────────────────────────────────────────────────────────────

const ICON_TEST = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const ICON_CALENDAR = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const ICON_BIA = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)
const ICON_WORKOUT = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4v6a6 6 0 0 0 12 0V4"/>
    <line x1="6" y1="20" x2="18" y2="20"/>
  </svg>
)
const ICON_NOTES = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
const ICON_ACTIVITY = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)
const ICON_WEARABLE = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)

/**
 * Dashboard cliente — layout full-width per sezione.
 * Navigazione tramite ClientCircularNav (wheel overlay).
 */
export function ClientDashboardPage({ client, clientId, orgId, color, rankObj, biaRankObj, unreadCount = 0, onOpenNotifs }) {
  const prevStats   = client.campionamenti?.[1]?.stats ?? null
  const profileType = client.profileType ?? 'tests_only'
  const profile     = getProfileCategory(profileType)

  const TABS = [
    profile.hasTests       && { id: 'test',     label: 'Test',       icon: ICON_TEST },
    { id: 'calendar',         label: 'Calendario', icon: ICON_CALENDAR },
    profile.hasBia         && { id: 'bia',      label: 'BIA',        icon: ICON_BIA },
    orgId                  && { id: 'workout',  label: 'Scheda',     icon: ICON_WORKOUT },
    orgId                  && { id: 'notes',    label: 'Note',       icon: ICON_NOTES },
    { id: 'activity',         label: 'Attività',  icon: ICON_ACTIVITY },
    client.wearableEnabled && { id: 'wearable', label: 'Wearable',   icon: ICON_WEARABLE },
  ].filter(Boolean)

  const defaultTab = profile.hasTests ? 'test' : profile.hasBia ? 'bia' : 'calendar'
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <div className="min-h-screen flex flex-col pb-20">

      <ClientHUD client={client} color={color} rankObj={rankObj} activeTab={activeTab} tabs={TABS} />

      <div key={activeTab} className="rx-animate-in">

        {/* ── Test ─────────────────────────────────────────────────────── */}
        {activeTab === 'test' && (
          <>
            <section className="px-4 py-6">
              <div className="rounded-[4px] p-5 rx-card">
                <div className="font-display text-[10px] tracking-[3px] uppercase mb-3.5" style={{ color: '#0fd65a' }}>◈ Status</div>
                <StatsSection stats={client.stats} prevStats={prevStats} color={color} categoria={client.categoria} />
              </div>
            </section>
            <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <section className="px-4 py-6">
              <StatsChart campionamenti={client.campionamenti} color={color} categoria={client.categoria} />
            </section>
          </>
        )}

        {/* ── Calendario ───────────────────────────────────────────────── */}
        {activeTab === 'calendar' && (
          <div className="px-4 py-6">
            <ClientCalendar clientId={clientId} orgId={orgId} />
          </div>
        )}

        {/* ── BIA ──────────────────────────────────────────────────────── */}
        {activeTab === 'bia' && (
          <>
            <section className="px-4 py-6">
              <BiaSummary bia={client.lastBia} prevBia={client.biaHistory?.[1] ?? null} sex={client.sesso} age={calcAge(client.dataNascita)} color={color} />
            </section>
            <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <section className="px-4 py-6">
              <BiaHistoryChart biaHistory={client.biaHistory} color={color} />
            </section>
          </>
        )}

        {/* ── Scheda ───────────────────────────────────────────────────── */}
        {activeTab === 'workout' && (
          <ClientWorkoutSection orgId={orgId} clientId={clientId} color={color} />
        )}

        {/* ── Note ─────────────────────────────────────────────────────── */}
        {activeTab === 'notes' && orgId && (
          <NotesSection orgId={orgId} clientId={clientId} color={color}
            author={{ role: 'client', name: client.name }} />
        )}

        {/* ── Attività ─────────────────────────────────────────────────── */}
        {activeTab === 'activity' && (
          <section className="px-4 py-6">
            <ActivityLog log={client.log} color={color} />
          </section>
        )}

        {/* ── Wearable ─────────────────────────────────────────────────── */}
        {activeTab === 'wearable' && client.wearableEnabled && (
          <ClientWearableSection
            orgId={orgId}
            clientId={clientId}
            initialWearable={client.wearable ?? null}
            color={color}
          />
        )}

      </div>

      <ClientCircularNav
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadCount={unreadCount}
        onOpenNotifs={onOpenNotifs}
        color={color}
        clientName={client.name}
      />
    </div>
  )
}

