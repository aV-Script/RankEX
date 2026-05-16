import { useMemo }        from 'react'
import { usePagination }  from '../../../hooks/usePagination'
import { Pagination }     from '../../../components/common/Pagination'
import { EmptyState }     from '../../../components/ui'
import { SLOT_STATUS }    from '../../../constants/slotStatus'

export function GroupSessionsPanel({ slots, loading }) {
  const today = new Date().toISOString().slice(0, 10)

  const upcoming = useMemo(() =>
    slots
      .filter(s => s.date >= today && s.status === SLOT_STATUS.PLANNED)
      .sort((a, b) => a.date.localeCompare(b.date))
  , [slots, today])

  const recent = useMemo(() =>
    slots
      .filter(s => s.date < today && s.status === SLOT_STATUS.COMPLETED)
      .sort((a, b) => b.date.localeCompare(a.date))
  , [slots, today])

  const upcomingPagination = usePagination(upcoming, 5)
  const recentPagination   = usePagination(recent,   10)

  const stats = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const cutoffStr = cutoff.toISOString().slice(0, 10)

    const completedLast30 = slots.filter(s =>
      s.status === SLOT_STATUS.COMPLETED && s.date >= cutoffStr && s.date < today
    )
    const allCompleted = slots.filter(s =>
      s.status === SLOT_STATUS.COMPLETED && s.date < today
    )

    let attendanceRate = null
    if (allCompleted.length > 0) {
      const ratioSum = allCompleted.reduce((sum, s) => {
        const invited  = s.clientIds?.length ?? 0
        const attended = s.attendees?.length ?? 0
        return sum + (invited > 0 ? attended / invited : 1)
      }, 0)
      attendanceRate = Math.round(ratioSum / allCompleted.length * 100)
    }

    return { completedLast30: completedLast30.length, plannedCount: upcoming.length, attendanceRate }
  }, [slots, today, upcoming])

  if (loading) return (
    <div className="rounded-[4px] p-5 rx-card">
      <div className="font-display text-[11px] font-semibold tracking-[3px] uppercase mb-4" style={{ color: '#0fd65a' }}>◈ Sessioni</div>
      <div className="flex flex-col gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-10 rounded-[3px]" />
        ))}
      </div>
    </div>
  )

  const isEmpty = upcoming.length === 0 && recent.length === 0

  return (
    <div className="rounded-[4px] p-5 rx-card">
      <div className="font-display text-[11px] font-semibold tracking-[3px] uppercase mb-4" style={{ color: '#0fd65a' }}>◈ Sessioni</div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <SessionStat label="COMPLETATE (30GG)" value={stats.completedLast30} />
        <SessionStat label="IN PROGRAMMA"      value={stats.plannedCount} />
        <SessionStat
          label="PRESENZE MEDIE"
          value={stats.attendanceRate != null ? `${stats.attendanceRate}%` : '—'}
          highlight={stats.attendanceRate != null && stats.attendanceRate >= 75}
        />
      </div>

      {isEmpty ? (
        <EmptyState
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          title="Nessuna sessione"
          description="Le sessioni del gruppo appariranno qui dopo la chiusura dal calendario."
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          {upcoming.length > 0 && (
            <div className="flex-1">
              <div className="font-display text-[10px] tracking-[1.5px] text-white/30 mb-2">
                PROSSIME ({upcoming.length})
              </div>
              <div className="rounded-[3px] overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                {upcomingPagination.paginatedItems.map((slot, i) => (
                  <SlotRow key={slot.id} slot={slot} upcoming border={i < upcomingPagination.paginatedItems.length - 1} />
                ))}
              </div>
              <Pagination {...upcomingPagination} />
            </div>
          )}
          {recent.length > 0 && (
            <div className="flex-1">
              <div className="font-display text-[10px] tracking-[1.5px] text-white/30 mb-2">
                RECENTI ({recent.length})
              </div>
              <div className="rounded-[3px] overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                {recentPagination.paginatedItems.map((slot, i) => (
                  <SlotRow key={slot.id} slot={slot} border={i < recentPagination.paginatedItems.length - 1} />
                ))}
              </div>
              <Pagination {...recentPagination} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SessionStat({ label, value, highlight }) {
  return (
    <div
      className="px-3 py-2.5 rounded-[3px] flex flex-col gap-1"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <span className="font-display text-[10px] tracking-[1px] text-white/30">{label}</span>
      <span
        className="font-display font-black text-[17px] leading-tight"
        style={{ color: highlight ? '#0fd65a' : 'rgba(255,255,255,0.75)' }}
      >
        {value}
      </span>
    </div>
  )
}

function SlotRow({ slot, upcoming, border }) {
  const dateLabel = formatSlotDate(slot.date)
  const timeLabel = slot.startTime ? `${slot.startTime}${slot.endTime ? ` – ${slot.endTime}` : ''}` : null
  const attended  = slot.attendees?.length ?? 0
  const invited   = slot.clientIds?.length ?? 0

  return (
    <div
      className="flex items-center justify-between px-3 py-2.5"
      style={{
        background:   upcoming ? 'rgba(46,207,255,0.04)' : 'rgba(255,255,255,0.02)',
        borderBottom: border   ? '1px solid rgba(255,255,255,0.04)' : 'none',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: upcoming ? '#2ecfff' : '#0fd65a' }} />
        <div>
          <div className="font-display text-[12px] text-white/70">{dateLabel}</div>
          {timeLabel && <div className="font-body text-[11px] text-white/30 mt-0.5">{timeLabel}</div>}
        </div>
      </div>
      {!upcoming && invited > 0 && (
        <div className="font-display text-[11px]" style={{ color: attended === invited ? '#0fd65a' : 'rgba(255,255,255,0.3)' }}>
          {attended}/{invited}
        </div>
      )}
      {upcoming && (
        <div className="font-display text-[10px] tracking-[0.5px]" style={{ color: '#2ecfff66' }}>PIANIF.</div>
      )}
    </div>
  )
}

function formatSlotDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
}
