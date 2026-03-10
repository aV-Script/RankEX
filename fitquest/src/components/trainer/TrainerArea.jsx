import { useState, useCallback } from 'react'
import { useClients } from '../../hooks/useClients'
import { useClientSearch } from '../../hooks/useClientSearch'
import { NewClientWizard } from '../modals/NewClientWizard'
import { Input, Button } from '../ui'
import { logout } from '../../firebase/services'
import { getRankFromMedia } from '../../constants'
import { calcStatMedia } from '../../utils/percentile'

export function TrainerArea({ trainerId }) {
  const { clients, loading, error, handleAddClient, selectClient } = useClients(trainerId)
  const { query, setQuery, filtered } = useClientSearch(clients)
  const [showWizard, setShowWizard] = useState(false)

  const handleAdd = useCallback(async (formData) => {
    await handleAddClient(formData)
    setShowWizard(false)
  }, [handleAddClient])

  return (
    <div className="px-8 py-10 max-w-xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="font-display text-[11px] text-blue-400 tracking-[3px] m-0 mb-2">PERSONAL TRAINER DASHBOARD</p>
          <h1 className="font-display text-[28px] text-white font-black m-0">I Tuoi Clienti</h1>
        </div>
        <button onClick={logout}
          className="bg-transparent border border-white/10 rounded-xl px-4 py-2 text-white/40 font-body text-[13px] cursor-pointer hover:text-white/60 transition-all">
          Logout
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3 mb-6">
        <Input placeholder="🔍 Cerca cliente..." value={query} onChange={e => setQuery(e.target.value)} />
        <Button variant="primary" className="px-5 whitespace-nowrap" onClick={() => setShowWizard(true)}>
          + AGGIUNGI
        </Button>
      </div>

      {error && <p className="text-red-400 font-body text-[13px] mb-4">⚠️ {error}</p>}

      {loading ? (
        <EmptyState message="Caricamento..." />
      ) : filtered.length === 0 ? (
        <EmptyState message={clients.length === 0 ? 'Nessun cliente. Aggiungine uno! 👆' : 'Nessun risultato.'} />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(client => (
            <ClientRow key={client.id} client={client} onClick={() => selectClient(client)} />
          ))}
        </div>
      )}

      {showWizard && <NewClientWizard onClose={() => setShowWizard(false)} onAdd={handleAdd} />}
    </div>
  )
}

function ClientRow({ client, onClick }) {
  const media   = calcStatMedia(client.stats ?? {})
  const rankObj = getRankFromMedia(client.rank ? { label: client.rank } : media)
  // usa rankColor salvato o calcola dal vivo
  const color   = client.rankColor ?? getRankFromMedia(media).color

  return (
    <button onClick={onClick}
      className="bg-white/[.03] border border-white/[.07] rounded-2xl px-5 py-4 cursor-pointer flex items-center gap-4 text-left w-full transition-all duration-200 hover:bg-white/[.07]"
      onMouseEnter={e => e.currentTarget.style.borderColor = color + '66'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>

      {/* Rank badge */}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: color + '22', border: `2px solid ${color}55` }}>
        <span className="font-display font-black text-[16px]" style={{ color }}>{client.rank ?? 'F'}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-body font-bold text-[18px] text-white truncate">{client.name}</div>
        <div className="flex gap-2.5 mt-1 flex-wrap items-center">
          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-display" style={{ background: color + '22', color }}>
            LVL {client.level}
          </span>
          {client.eta    && <span className="text-white/30 text-[11px] font-body">🎂 {client.eta} anni</span>}
          {client.categoria && (
            <span className="text-white/20 text-[11px] font-body border border-white/10 rounded-full px-2 py-0.5">
              {client.categoria}
            </span>
          )}
        </div>
      </div>
      <span className="text-white/20 text-[20px]">›</span>
    </button>
  )
}

function EmptyState({ message }) {
  return <div className="text-center text-white/30 font-body py-10">{message}</div>
}
