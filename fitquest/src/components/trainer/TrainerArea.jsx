import { useState, useCallback, useMemo } from 'react'
import { useClients }       from '../../hooks/useClients'
import { useClientSearch }  from '../../hooks/useClientSearch'
import { useClientRank }    from '../../hooks/useClientRank'
import { NewClientWizard }  from '../modals/NewClientWizard'
import { AppNav }           from '../layout/AppNav'
import { Input }            from '../ui'
import { logout }           from '../../firebase/services'
import { calcStatMedia }    from '../../utils/percentile'
import { RANKS }            from '../../constants'

export function TrainerArea({ trainerId }) {
  const { clients, loading, error, handleAddClient, selectClient } = useClients(trainerId)
  const { query, setQuery, filtered } = useClientSearch(clients)
  const [showWizard,      setShowWizard]      = useState(false)
  const [filterCategoria, setFilterCategoria] = useState('tutti')
  const [sortBy,          setSortBy]          = useState('name')

  const handleAdd = useCallback(async (formData) => {
    await handleAddClient(formData)
    setShowWizard(false)
  }, [handleAddClient])

  const stats = useMemo(() => {
    const total    = clients.length
    const avgLevel = total > 0
      ? Math.round(clients.reduce((s, c) => s + (c.level ?? 1), 0) / total) : 0
    const rankCounts = {}
    clients.forEach(c => { const r = c.rank ?? 'F'; rankCounts[r] = (rankCounts[r] ?? 0) + 1 })
    const topRanks = Object.entries(rankCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
    return { total, avgLevel, topRanks }
  }, [clients])

  const categorie = useMemo(() => {
    const set = new Set(clients.map(c => c.categoria).filter(Boolean))
    return ['tutti', ...Array.from(set)]
  }, [clients])

  const displayed = useMemo(() => {
    let list = filterCategoria !== 'tutti'
      ? filtered.filter(c => c.categoria === filterCategoria)
      : [...filtered]
    return list.sort((a, b) => {
      if (sortBy === 'name')  return a.name.localeCompare(b.name)
      if (sortBy === 'level') return (b.level ?? 1) - (a.level ?? 1)
      if (sortBy === 'rank')  return calcStatMedia(b.stats ?? {}) - calcStatMedia(a.stats ?? {})
      return 0
    })
  }, [filtered, filterCategoria, sortBy])

  const SORT_OPTIONS = [['name', 'Nome A→Z'], ['rank', 'Rank migliore'], ['level', 'Livello più alto']]

  return (
    <div className="min-h-screen text-white">

      <AppNav
        left={<span className="hidden sm:block font-display text-[11px] text-white/20 tracking-[2px]">TRAINER DASHBOARD</span>}
        right={
          <button onClick={logout}
            className="bg-transparent border border-white/10 rounded-xl px-4 py-2 text-white/40 font-body text-[13px] cursor-pointer hover:text-white/60 transition-all">
            Logout
          </button>
        }
      />

      <div className="flex min-h-[calc(100vh-57px)]">

        {/* Sidebar desktop */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 border-r border-white/[.05] p-8 gap-6 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
          <SidebarSection label="PANORAMICA">
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Clienti totali" value={stats.total}    color="#60a5fa" />
              <StatBox label="Livello medio"  value={stats.avgLevel || '—'} color="#a78bfa" />
            </div>
            {stats.topRanks.length > 0 && (
              <div className="mt-3">
                <p className="font-display text-[10px] text-white/20 tracking-[2px] mb-2">RANK PIÙ COMUNI</p>
                <div className="flex gap-2 flex-wrap">
                  {stats.topRanks.map(([rank, count]) => {
                    const r = RANKS.find(r => r.label === rank) ?? RANKS[RANKS.length - 1]
                    return (
                      <span key={rank} className="font-display text-[12px] px-2.5 py-1 rounded-lg"
                        style={{ background: r.color + '22', color: r.color, border: `1px solid ${r.color}44` }}>
                        {rank} <span className="opacity-50">×{count}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </SidebarSection>

          <Separator />

          <SidebarSection label="RICERCA">
            <Input placeholder="Nome cliente..." value={query} onChange={e => setQuery(e.target.value)} className="w-full" />
          </SidebarSection>

          {categorie.length > 1 && (
            <SidebarSection label="CATEGORIA">
              <div className="flex flex-col gap-1.5">
                {categorie.map(cat => (
                  <SidebarButton key={cat} active={filterCategoria === cat} onClick={() => setFilterCategoria(cat)}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SidebarButton>
                ))}
              </div>
            </SidebarSection>
          )}

          <SidebarSection label="ORDINA PER">
            <div className="flex flex-col gap-1.5">
              {SORT_OPTIONS.map(([val, label]) => (
                <SidebarButton key={val} active={sortBy === val} onClick={() => setSortBy(val)}>
                  {label}
                </SidebarButton>
              ))}
            </div>
          </SidebarSection>

          <div className="mt-auto">
            <GradientButton onClick={() => setShowWizard(true)}>NUOVO CLIENTE</GradientButton>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 min-w-0">

          {/* Header mobile */}
          <div className="lg:hidden mb-6">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="font-display text-[10px] text-blue-400 tracking-[3px] m-0 mb-1">TRAINER DASHBOARD</p>
                <h1 className="font-display font-black text-[26px] text-white m-0">I tuoi clienti</h1>
              </div>
              <GradientButton onClick={() => setShowWizard(true)} className="px-5 py-2.5 text-[12px]">
                NUOVO
              </GradientButton>
            </div>
            <Input placeholder="Cerca cliente..." value={query} onChange={e => setQuery(e.target.value)} className="w-full mb-3" />
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {SORT_OPTIONS.map(([val, label]) => (
                <button key={val} onClick={() => setSortBy(val)}
                  className="shrink-0 rounded-xl px-3 py-1.5 font-display text-[11px] tracking-wide cursor-pointer border transition-all whitespace-nowrap"
                  style={sortBy === val
                    ? { background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }
                    : { background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }
                  }>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Contatore desktop */}
          <div className="hidden lg:block mb-6">
            <h1 className="font-display font-black text-[26px] text-white m-0">I tuoi clienti</h1>
            <p className="font-body text-white/30 text-[13px] m-0 mt-1">
              {loading ? 'Caricamento...' : `${displayed.length} ${displayed.length === 1 ? 'cliente' : 'clienti'}`}
            </p>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-2.5 bg-red-500/10 border border-red-400/20 mb-4">
              <p className="text-red-400 font-body text-[13px] m-0">{error}</p>
            </div>
          )}

          {loading ? <EmptyState message="Caricamento..." /> :
           displayed.length === 0 ? <EmptyState message={clients.length === 0 ? 'Nessun cliente. Aggiungine uno!' : 'Nessun risultato.'} /> :
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
             {displayed.map(c => <ClientCard key={c.id} client={c} onClick={() => selectClient(c)} />)}
           </div>
          }
        </main>
      </div>

      {showWizard && <NewClientWizard onClose={() => setShowWizard(false)} onAdd={handleAdd} />}
    </div>
  )
}

// ── Sub-componenti ────────────────────────────────────────────────────────────

function ClientCard({ client, onClick }) {
  const { rankObj, color } = useClientRank(client)
  const xpPct = client.xpNext > 0 ? Math.round((client.xp / client.xpNext) * 100) : 0

  return (
    <button onClick={onClick}
      className="text-left w-full rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col gap-3 group"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => { e.currentTarget.style.background = color + '0d'; e.currentTarget.style.borderColor = color + '55' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color + '22', border: `2px solid ${color}55` }}>
          <span className="font-display font-black text-[16px]" style={{ color }}>{client.rank ?? 'F'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-body font-bold text-[16px] text-white truncate">{client.name}</div>
          <div className="flex gap-2 mt-0.5 flex-wrap">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-display" style={{ background: color + '22', color }}>
              LVL {client.level}
            </span>
            {client.categoria && (
              <span className="text-white/20 text-[10px] font-body border border-white/10 rounded-full px-2 py-0.5">
                {client.categoria}
              </span>
            )}
          </div>
        </div>
        <span className="text-white/20 text-[18px] group-hover:text-white/40 transition-colors">›</span>
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <span className="font-display text-[9px] text-white/20 tracking-[2px]">EXP</span>
          <span className="font-display text-[9px]" style={{ color: color + 'aa' }}>{xpPct}%</span>
        </div>
        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full" style={{ width: `${xpPct}%`, background: color }} />
        </div>
      </div>

      {client.stats && Object.values(client.stats).some(v => v > 0) && (
        <div className="flex gap-1 flex-wrap">
          {Object.entries(client.stats).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1 rounded-lg px-2 py-1"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="h-[3px] rounded-full" style={{ width: 24, background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ width: `${val}%`, height: '100%', background: color + 'cc', borderRadius: 99 }} />
              </div>
              <span className="font-display text-[10px]" style={{ color: color + 'aa' }}>{val}</span>
            </div>
          ))}
        </div>
      )}
    </button>
  )
}

// ── Componenti UI locali alla sidebar ─────────────────────────────────────────

function SidebarSection({ label, children }) {
  return (
    <div>
      <p className="font-display text-[10px] text-white/30 tracking-[3px] mb-3">{label}</p>
      {children}
    </div>
  )
}

function SidebarButton({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`text-left px-3 py-2 rounded-xl font-body text-[13px] cursor-pointer border transition-all
        ${active ? 'text-white border-white/20 bg-white/[.06]' : 'text-white/40 border-transparent bg-transparent hover:text-white/60'}`}>
      {children}
    </button>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div className="rounded-xl p-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="font-display font-black text-[26px] leading-none" style={{ color }}>{value}</div>
      <div className="font-body text-[11px] text-white/30 mt-1">{label}</div>
    </div>
  )
}

function GradientButton({ onClick, children, className = 'w-full py-3 text-[12px] tracking-widest' }) {
  return (
    <button onClick={onClick}
      className={`rounded-xl font-display cursor-pointer border-0 transition-opacity hover:opacity-85 ${className}`}
      style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff' }}>
      {children}
    </button>
  )
}

function Separator() {
  return <div className="w-full h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="font-body text-white/20 text-[15px]">{message}</div>
    </div>
  )
}
