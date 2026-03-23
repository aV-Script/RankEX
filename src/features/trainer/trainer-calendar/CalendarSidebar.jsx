import { SectionLabel }                          from '../../../components/ui'
import { calcSessionConfig }      from '../../../utils/gamification'
import { calcMonthlyCompletion }  from '../../calendar/useCalendar'

/**
 * Sidebar del calendario — panoramica mensile per cliente e lista gruppi.
 */
export function CalendarSidebar({ clients, slots, groups }) {
  const monthlyOverview = clients
    .map(client => {
      const clientSlots          = slots.filter(s => s.clientIds.includes(client.id))
      const { planned, completed, pct } = calcMonthlyCompletion(clientSlots, client.id)
      const { monthlySessions }  = calcSessionConfig(client.sessionsPerWeek ?? 3)
      const overLimit            = planned > monthlySessions
      return { client, planned, completed, pct, monthlySessions, overLimit }
    })
    .filter(r => r.planned > 0)

  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-white/[.05] p-5 gap-4 sticky top-0 h-screen overflow-y-auto">

      <div>
        <SectionLabel>MESE IN CORSO</SectionLabel>
        {monthlyOverview.length === 0 ? (
          <p className="font-body text-[12px] text-white/20">Nessuna sessione pianificata.</p>
        ) : (
          monthlyOverview.map(({ client, planned, completed, pct, monthlySessions, overLimit }) => (
            <div key={client.id} className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-body text-[12px] text-white/70 truncate flex-1">
                  {client.name}
                </span>
                <span
                  className="font-display text-[11px] ml-2 shrink-0"
                  style={{ color: overLimit ? '#f87171' : pct === 100 ? '#34d399' : pct >= 50 ? '#f59e0b' : '#f87171' }}
                >
                  {completed}/{planned}
                  {overLimit && <span className="text-[9px] ml-1">⚠ max {monthlySessions}</span>}
                </span>
              </div>
              <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width:      `${Math.min(100, pct)}%`,
                    background: overLimit ? '#f87171' : pct === 100 ? '#34d399' : '#f59e0b',
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {groups.length > 0 && (
        <div>
          <SectionLabel>GRUPPI</SectionLabel>
          {groups.map(g => (
            <div key={g.id} className="flex items-center justify-between py-1.5">
              <span className="font-body text-[12px] text-white/50">{g.name}</span>
              <span className="font-display text-[10px] text-white/25">{g.clientIds.length} clienti</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}