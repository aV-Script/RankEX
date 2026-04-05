import { useState }              from 'react'
import { useRecurrences }       from '../../features/calendar/useRecurrences'
import { useClients }           from '../../hooks/useClients'
import { RecurrenceDetailView } from './recurrences-page/RecurrenceDetailView'
import { RecurrenceCard }       from './recurrences-page/RecurrenceCard'
import { usePagination }        from '../../hooks/usePagination'
import { Pagination }           from '../../components/common/Pagination'

export function RecurrencesPage({ orgId, initialRecurrenceId }) {
  const {
    recurrences, loading, error,
    handleUpdateTime, handleUpdateDays, handleExtendPeriod,
    handleAddClient, handleRemoveClient, handleCancel,
  } = useRecurrences(orgId)

  const { clients } = useClients(orgId)

  const [showArchive, setShowArchive] = useState(false)
  const [selectedId,  setSelectedId]  = useState(initialRecurrenceId ?? null)

  const active   = recurrences.filter(r => (r.status ?? 'active') === 'active')
  const archived = recurrences.filter(r => ['ended', 'cancelled'].includes(r.status ?? ''))
  const selected = recurrences.find(r => r.id === selectedId) ?? null

  const { paginatedItems: paginatedActive, ...activePagination } = usePagination(active, 10)

  if (selected) {
    return (
      <RecurrenceDetailView
        recurrence={selected}
        clients={clients}
        onBack={() => setSelectedId(null)}
        onUpdateTime={handleUpdateTime}
        onUpdateDays={handleUpdateDays}
        onExtendPeriod={handleExtendPeriod}
        onAddClient={handleAddClient}
        onRemoveClient={handleRemoveClient}
        onCancel={handleCancel}
      />
    )
  }

  return (
    <div className="text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 className="font-display font-black text-[20px] text-white m-0">Ricorrenze</h1>
        <span className="font-display text-[11px] text-white/30">
          {active.length} attive
        </span>
      </div>

      {/* Lista attive */}
      <div className="px-6 py-5">
        {error ? (
          <div className="text-center py-16">
            <p className="font-body text-[12px]" style={{ color: 'rgba(248,113,113,0.6)' }}>
              Errore caricamento: {error}
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 animate-pulse rounded-[4px]" style={{ background: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        ) : active.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-body text-[13px] text-white/20">Nessuna ricorrenza attiva.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {paginatedActive.map(rec => (
              <RecurrenceCard
                key={rec.id}
                recurrence={rec}
                clients={clients}
                onClick={() => setSelectedId(rec.id)}
              />
            ))}
          </div>
          <Pagination {...activePagination} />
        )}

        {/* Archivio collassabile */}
        {archived.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowArchive(v => !v)}
              className="flex items-center gap-2 font-display text-[10px] tracking-[2px] text-white/25 hover:text-white/45 transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ transform: showArchive ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
              ARCHIVIO ({archived.length})
            </button>

            {showArchive && (
              <div className="flex flex-col gap-3 mt-3">
                {archived.map(rec => (
                  <RecurrenceCard
                    key={rec.id}
                    recurrence={rec}
                    clients={clients}
                    onClick={() => setSelectedId(rec.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
