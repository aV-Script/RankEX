import { useState, useCallback, useMemo } from 'react'
import { useClients }      from '../../hooks/useClients'
import { useClientSearch } from '../../hooks/useClientSearch'
import { useClientRank }         from '../../hooks/useClientRank'
import { useGroups }            from '../../hooks/useGroups'
import { NewClientWizard } from '../modals/NewClientWizard'
import { Input }           from '../ui'
import { calcStatMedia }   from '../../utils/percentile'
import { RANKS }           from '../../constants'

const SORT_OPTIONS = [['name', 'Nome A→Z'], ['rank', 'Rank migliore'], ['level', 'Livello più alto']]

export function ClientsPage({ trainerId }) {
  const { clients, loading, error, handleAddClient, selectClient } = useClients(trainerId)
  const { query, setQuery, filtered } = useClientSearch(clients)
  const [showWizard,      setShowWizard]      = useState(false)
  const [filterCategoria, setFilterCategoria] = useState('tutti')
  const [filterGroup,     setFilterGroup]     = useState(null)  // null = tutti i gruppi
  const [sortBy,          setSortBy]          = useState('name')
  const { groups } = useGroups(trainerId)

  const handleAdd = useCallback(async (formData) => {
    const newClient = await handleAddClient(formData)
    setShowWizard(false)
    if (newClient) selectClient(newClient)
  }, [handleAddClient, selectClient])

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
    let baseList = [...clients]
    // Filtra per gruppo
    if (filterGroup) {
      const grp = groups.find(g => g.id === filterGroup)
      if (grp) baseList = baseList.filter(c => grp.clientIds.includes(c.id))
    }
    // Filtra per categoria
    let list = filterCategoria !== 'tutti'
      ? baseList.filter(c => c.categoria === filterCategoria) : baseList
    // Filtra per ricerca
    list = query ? list.filter(c => c.name.toLowerCase().includes(query.toLowerCase())) : list
    // Ordina
    return list.sort((a, b) => {
      if (sortBy === 'name')  return a.name.localeCompare(b.name)
      if (sortBy === 'level') return (b.level ?? 1) - (a.level ?? 1)
      if (sortBy === 'rank')  return calcStatMedia(b.stats ?? {}) - calcStatMedia(a.stats ?? {})
      return 0
    })
  }, [clients, groups, filterGroup, filterCategoria, query, sortBy])

  return (
    <div className="flex min-h-screen">

      {/* ── Sidebar filtraggio — solo desktop ── */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 border-r border-white/[.05] p-6 gap-5 sticky top-0 h-screen overflow-y-auto">

        <div>
          <GradientBtn onClick={() => setShowWizard(true)}>NUOVO CLIENTE</GradientBtn>
        </div>

        {/* Ricerca */}
        <div>
          <p className="font-display text-[10px] text-white/30 tracking-[3px] mb-2">RICERCA</p>
          <Input placeholder="Nome cliente..." value={query} onChange={e => setQuery(e.target.value)} className="w-full" />
        </div>

        {/* Categoria */}
        {categorie.length > 1 && (
          <div>
            <p className="font-display text-[10px] text-white/30 tracking-[3px] mb-2">CATEGORIA</p>
            <div className="flex flex-col gap-1">
              {categorie.map(cat => (
                <FilterBtn key={cat} active={filterCategoria === cat} onClick={() => setFilterCategoria(cat)}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </FilterBtn>
              ))}
            </div>
          </div>
        )}

        {/* Gruppi */}
        {groups.length > 0 && (
          <div>
            <p className="font-display text-[10px] text-white/30 tracking-[3px] mb-2">GRUPPO</p>
            <div className="flex flex-col gap-1">
              <FilterBtn active={filterGroup === null} onClick={() => setFilterGroup(null)}>
                Tutti
              </FilterBtn>
              {groups.map(g => (
                <FilterBtn key={g.id} active={filterGroup === g.id} onClick={() => setFilterGroup(g.id)}>
                  {g.name}
                  <span className="ml-1 opacity-40 text-[10px]">({g.clientIds.length})</span>
                </FilterBtn>
              ))}
            </div>
          </div>
        )}

        {/* Ordinamento */}
        <div>
          <p className="font-display text-[10px] text-white/30 tracking-[3px] mb-2">ORDINA PER</p>
          <div className="flex flex-col gap-1">
            {SORT_OPTIONS.map(([val, label]) => (
              <FilterBtn key={val} active={sortBy === val} onClick={() => setSortBy(val)}>
                {label}
              </FilterBtn>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Area principale ── */}
      <main className="flex-1 px-4 sm:px-6 py-6 min-w-0">

        {/* Header mobile */}
        <div className="lg:hidden mb-5">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display font-black text-[22px] text-white m-0">Clienti</h1>
            <GradientBtn onClick={() => setShowWizard(true)} small>NUOVO</GradientBtn>
          </div>
          <Input placeholder="Cerca..." value={query} onChange={e => setQuery(e.target.value)} className="w-full mb-2" />
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {SORT_OPTIONS.map(([val, label]) => (
              <button key={val} onClick={() => setSortBy(val)}
                className="shrink-0 rounded-xl px-3 py-1.5 font-display text-[10px] tracking-wide cursor-pointer border transition-all whitespace-nowrap"
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
        <div className="hidden lg:flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display font-black text-[24px] text-white m-0">I tuoi clienti</h1>
            <p className="font-body text-white/30 text-[13px] m-0 mt-0.5">
              {loading ? 'Caricamento...' : `${displayed.length} ${displayed.length === 1 ? 'cliente' : 'clienti'}`}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-2.5 bg-red-500/10 border border-red-400/20 mb-4">
            <p className="text-red-400 font-body text-[13px] m-0">{error}</p>
          </div>
        )}

        {loading ? (
          <EmptyState>Caricamento...</EmptyState>
        ) : displayed.length === 0 ? (
          <EmptyState>{clients.length === 0 ? 'Nessun cliente. Aggiungine uno!' : 'Nessun risultato.'}</EmptyState>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {displayed.map(client => (
              <ClientCard key={client.id} client={client} onClick={() => selectClient(client)} />
            ))}
          </div>
        )}
      </main>

      {showWizard && <NewClientWizard onClose={() => setShowWizard(false)} onAdd={handleAdd} trainerId={trainerId} />}
    </div>
  )
}

// ── Componenti locali ─────────────────────────────────────────────────────────

function FilterBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className="text-left px-3 py-2 rounded-xl font-body text-[12px] cursor-pointer border transition-all"
      style={active
        ? { background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)', color: '#fff' }
        : { background: 'transparent', borderColor: 'transparent', color: 'rgba(255,255,255,0.4)' }}>
      {children}
    </button>
  )
}

function GradientBtn({ onClick, children, small = false }) {
  return (
    <button onClick={onClick}
      className={`rounded-xl font-display tracking-widest cursor-pointer border-0 transition-opacity hover:opacity-85 ${small ? 'px-4 py-2 text-[11px]' : 'w-full py-2.5 text-[11px]'}`}
      style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff' }}>
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-full h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
}

function EmptyState({ children }) {
  return (
    <div className="flex items-center justify-center py-20">
      <span className="font-body text-white/20 text-[15px]">{children}</span>
    </div>
  )
}

function ClientCard({ client, onClick }) {
  const { rankObj, color } = useClientRank(client)
  const xpPct = client.xpNext > 0 ? Math.round((client.xp / client.xpNext) * 100) : 0

  return (
    <button onClick={onClick}
      className="text-left w-full rounded-2xl p-4 cursor-pointer transition-all duration-200 flex flex-col gap-3 group"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => { e.currentTarget.style.background = color + '0d'; e.currentTarget.style.borderColor = color + '55' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color + '22', border: `2px solid ${color}55` }}>
          <span className="font-display font-black text-[15px]" style={{ color }}>{client.rank ?? 'F'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-body font-bold text-[15px] text-white truncate">{client.name}</div>
          <div className="flex gap-1.5 mt-0.5 flex-wrap">
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
        <span className="text-white/20 text-[16px] group-hover:text-white/50 transition-colors">›</span>
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
            <div key={key} className="flex items-center gap-1 rounded-lg px-2 py-0.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="h-[3px] rounded-full" style={{ width: 20, background: 'rgba(255,255,255,0.08)' }}>
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
