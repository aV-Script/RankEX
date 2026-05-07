import { useState }                from 'react'
import { XPBar }                   from '../../../components/ui/XPBar'
import { ActivityLog, StatsSection } from '../../../components/ui'
import { StatsChart }              from '../StatsChart'
import { getCategoriaById }        from '../../../constants'
import { BiaSummary }              from '../../bia/bia-view/BiaSummary'
import { BiaHistoryChart }         from '../../bia/bia-view/BiaHistoryChart'
import { getProfileCategory }      from '../../../constants/bia'
import { NotesSection }            from '../client-dashboard/NotesSection'
import { ClientWorkoutSection }    from '../client-dashboard/ClientWorkoutSection'
import { ClientCalendar }          from '../ClientCalendar'
import { PLAYER_ROLES }            from '../../../config/modules.config'
import { calcAge }                 from '../../../utils/validation'
import { ClientBadges }            from '../ClientBadges'
import { ClientWearableSection }   from './ClientWearableSection'
import { ClientCircularNav }       from './ClientCircularNav'

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
const ICON_PROFILE = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

/**
 * Dashboard cliente — layout full-width per sezione.
 * Navigazione tramite ClientCircularNav (wheel overlay).
 */
export function ClientDashboardPage({ client, clientId, orgId, color, rankObj, biaRankObj, unreadCount = 0, onOpenNotifs }) {
  const prevStats    = client.campionamenti?.[1]?.stats ?? null
  const profileType  = client.profileType ?? 'tests_only'
  const profile      = getProfileCategory(profileType)
  const isSoccer     = ['soccer', 'soccer_youth', 'soccer_junior'].includes(client.categoria)
  const categoriaObj = !isSoccer ? getCategoriaById(client.categoria) : null
  const ruoloObj     = isSoccer
    ? PLAYER_ROLES.find(r => r.value === client.ruolo) ?? null
    : null

  const TABS = [
    profile.hasTests          && { id: 'test',     label: 'Test',       icon: ICON_TEST },
    { id: 'calendar',            label: 'Calendario', icon: ICON_CALENDAR },
    profile.hasBia            && { id: 'bia',      label: 'BIA',        icon: ICON_BIA },
    orgId                     && { id: 'workout',  label: 'Scheda',     icon: ICON_WORKOUT },
    orgId                     && { id: 'notes',    label: 'Note',       icon: ICON_NOTES },
    { id: 'activity',            label: 'Attività',  icon: ICON_ACTIVITY },
    client.wearableEnabled    && { id: 'wearable', label: 'Wearable',   icon: ICON_WEARABLE },
    { id: 'profile',             label: 'Profilo',   icon: ICON_PROFILE },
  ].filter(Boolean)

  const defaultTab = profile.hasTests ? 'test' : profile.hasBia ? 'bia' : 'calendar'
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <div className="min-h-screen pb-20">

      <div key={activeTab} className="rx-animate-in">

        {/* ── Profilo ──────────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <section className="px-4 pt-10 pb-6 flex flex-col items-center gap-5 max-w-lg mx-auto">

            <AvatarPlaceholder color={color} level={client.level} />

            <div className="font-display font-black text-[26px] text-white leading-tight tracking-wide uppercase text-center">
              {client.name}
            </div>

            <ClientBadges
              categoriaObj={categoriaObj}
              ruoloObj={ruoloObj}
              color={color}
              categoria={client.categoria}
              hasTests={profile.hasTests}
              hasBia={profile.hasBia}
              rankObj={rankObj}
              biaRankObj={biaRankObj ?? rankObj}
            />

            <div className="self-stretch">
              <XPBar xp={client.xp} xpNext={client.xpNext} color={color} fullWidth />
            </div>

            {/* Card account */}
            <div className="rx-card rounded-[4px] p-5 w-full">
              <div className="font-display text-[10px] text-white/30 tracking-[3px] mb-4">ACCOUNT</div>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-[4px] flex items-center justify-center shrink-0"
                  style={{ background: color + '22', border: `1px solid ${color}44` }}
                >
                  <span className="font-display font-black text-[20px]" style={{ color }}>
                    {client.name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-display font-black text-[15px] text-white">{client.name}</div>
                  <div className="font-body text-[13px] text-white/40 mt-0.5">{client.email ?? '—'}</div>
                </div>
              </div>
            </div>

          </section>
        )}

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

// ── AvatarPlaceholder ─────────────────────────────────────────────────────────

function AvatarPlaceholder({ color, level }) {
  return (
    <div style={{ width: 174 }}>
      <div
        className="relative overflow-hidden rounded-[4px]"
        style={{
          height: 218,
          background: 'linear-gradient(170deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
          border: `1px solid ${color}28`,
        }}
      >
        <div className="absolute inset-0 bg-hex" style={{ opacity: 0.14 }} />

        <div className="absolute top-0 left-0 right-0 h-28"
          style={{ background: `radial-gradient(ellipse at 50% -20%, ${color}22 0%, transparent 65%)` }} />

        <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: 28 }}>
          <svg viewBox="0 0 80 112" width={90} height={126}>
            <circle cx="40" cy="26" r="19" fill={color} opacity="0.18" />
            <circle cx="40" cy="26" r="19" fill="none" stroke={color} strokeWidth="1.4" opacity="0.45" />
            <path d="M6,112 Q6,62 40,62 Q74,62 74,112Z" fill={color} opacity="0.14" />
            <path d="M6,112 Q6,62 40,62 Q74,62 74,112Z" fill="none" stroke={color} strokeWidth="1.4" opacity="0.38" />
            <path d="M24,62 Q28,76 40,78 Q52,76 56,62" fill="none" stroke={color} strokeWidth="1" opacity="0.2" />
          </svg>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-20"
          style={{ background: `linear-gradient(to top, ${color}22, transparent)` }} />

        <div
          className="absolute top-2 left-2 font-display font-black text-[10px] px-1.5 py-0.5 rounded-[3px]"
          style={{ background: 'rgba(0,0,0,0.65)', color, border: `1px solid ${color}50` }}
        >
          LV.{level}
        </div>

        <div
          className="absolute bottom-2.5 right-2.5 font-display text-[7px] tracking-[3px] uppercase"
          style={{ color: color + '45' }}
        >
          Avatar
        </div>
      </div>
    </div>
  )
}
