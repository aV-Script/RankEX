import { useState }              from 'react'
import { useRecurrences }       from '../../features/calendar/useRecurrences'
import { useClients }           from '../../hooks/useClients'
import { RecurrenceDetailView } from './recurrences-page/RecurrenceDetailView'
import { RecurrenceCard }       from './recurrences-page/RecurrenceCard'

const STATUS_TABS = [
  { id: 'active',    label: 'ATTIVE' },
  { id: 'ended',     label: 'TERMINATE' },
  { id: 'cancelled', label: 'CANCELLATE' },
]

export function RecurrencesPage({ trainerId, initialRecurrenceId }) {
  const {
    recurrences, loading, error,
    handleUpdateTime, handleUpdateDays, handleExtendPeriod,
    handleAddClient, handleRemoveClient, handleCancel,
  } = useRecurrences(trainerId)

  const { clients } = useClients(trainerId)

  const [activeTab,  setActiveTab]  = useState('active')
  const [selectedId, setSelectedId] = useState(initialRecurrenceId ?? null)

  const filtered = recurrences.filter(r => (r.status ?? 'active') === activeTab)
  const selected = recurrences.find(r => r.id === selectedId) ?? null

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
          {recurrences.filter(r => (r.status ?? 'active') === 'active').length} attive
        </span>
      </div>

      {/* Tab status */}
      <div className="flex" style={{ paddingLeft: 24, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-3 font-display text-[11px] cursor-pointer border-none bg-transparent transition-all"
            style={activeTab === tab.id
              ? { color: '#0fd65a', borderBottom: '2px solid #0fd65a' }
              : { color: 'rgba(255,255,255,0.3)', borderBottom: '2px solid transparent' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista */}
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
              <div
                key={i}
                className="h-20 animate-pulse rounded-[4px]"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-body text-[13px] text-white/20">
              Nessuna ricorrenza {
                activeTab === 'active' ? 'attiva' :
                activeTab === 'ended'  ? 'terminata' : 'cancellata'
              }.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(rec => (
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
    </div>
  )
}
