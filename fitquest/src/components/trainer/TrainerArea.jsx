import { useState, useCallback, useMemo } from 'react'
import { useClients }      from '../../hooks/useClients'
import { useClientSearch } from '../../hooks/useClientSearch'
import { NewClientWizard } from '../modals/NewClientWizard'
import { Input, Button }   from '../ui'
import { logout }          from '../../firebase/services'
import { getRankFromMedia } from '../../constants'
import { calcStatMedia }   from '../../utils/percentile'
import { RANKS }           from '../../constants'

export function TrainerArea({ trainerId }) {
  const { clients, loading, error, handleAddClient, selectClient } = useClients(trainerId)
  const { query, setQuery, filtered } = useClientSearch(clients)
  const [showWizard,    setShowWizard]    = useState(false)
  const [filterCategoria, setFilterCategoria] = useState('tutti')
  const [sortBy,        setSortBy]        = useState('name') // 'name' | 'rank' | 'level'

  const handleAdd = useCallback(async (formData) => {
    await handleAddClient(formData)
    setShowWizard(false)
  }, [handleAddClient])

  // Stats aggregate per l'header
  const stats = useMemo(() => {
    const total = clients.length
    const avgLevel = total > 0
      ? Math.round(clients.reduce((s, c) => s + (c.level ?? 1), 0) / total)
      : 0
    const rankCounts = {}
    clients.forEach(c => {
      const r = c.rank ?? 'F'
      rankCounts[r] = (rankCounts[r] ?? 0) + 1
    })
    // Top 3 rank per freq
    const topRanks = Object.entries(rankCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
    return { total, avgLevel, topRanks }
  }, [clients])

  // Categorie disponibili
  const categorie = useMemo(() => {
    const set = new Set(clients.map(c => c.categoria).filter(Boolean))
    return ['tutti', ...Array.from(set)]
  }, [clients])

  // Filtro categoria + sort applicati dopo la ricerca testo
  const displayed = useMemo(() => {
    let list = filtered
    if (filterCategoria !== 'tutti') {
      list = list.filter(c => c.categoria === filterCategoria)
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'name')  return a.name.localeCompare(b.name)
      if (sortBy === 'level') return (b.level ?? 1) - (a.level ?? 1)
      if (sortBy === 'rank') {
        const mi = calcStatMedia(a.stats ?? {})
        const mj = calcStatMedia(b.stats ?? {})
        return mj - mi
      }
      return 0
    })
  }, [filtered, filterCategoria, sortBy])

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: 'radial-gradient(ellipse at 20% 0%, #0f1f3d 0%, #070b14 60%)' }}
    >
      {/* ── Navbar ── */}
      <nav className="px-6 lg:px-10 py-4 border-b border-white/[.05] flex items-center justify-between sticky top-0 z-20"
        style={{ background: 'rgba(7,11,20,0.9)', backdropFilter: 'blur(10px)' }}>
        <span className="font-display font-black text-[18px] bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
          FIT<span className="font-normal">QUEST</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block font-display text-[11px] text-white/20 tracking-[2px]">
            TRAINER DASHBOARD
          </span>
          <button
            onClick={logout}
            className="bg-transparent border border-white/10 rounded-xl px-4 py-2 text-white/40 font-body text-[13px] cursor-pointer hover:text-white/60 transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ── Layout principale ── */}
      <div className="flex min-h-[calc(100vh-57px)]">

        {/* ── Sidebar sinistra — solo desktop ── */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 border-r border-white/[.05] p-8 gap-6 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
          {/* Stats aggregate */}
          <div>
            <p className="font-display text-[10px] text-white/30 tracking-[3px] mb-4">PANORAMICA</p>
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Clienti totali" value={stats.total} color="#60a5fa" />
              <StatBox label="Livello medio" value={stats.avgLevel || '—'} color="#a78bfa" />
            </div>
            {stats.topRanks.length > 0 && (
              <div className="mt-3">
                <p className="font-display text-[10px] text-white/20 tracking-[2px] mb-2">RANK PIÙ COMUNI</p>
                <div className="flex gap-2 flex-wrap">
                  {stats.topRanks.map(([rank, count]) => {
                    const rankObj = RANKS.find(r => r.label === rank) ?? RANKS[RANKS.length - 1]
                    return (
                      <span
                        key={rank}
                        className="font-display text-[12px] px-2.5 py-1 rounded-lg"
                        style={{ background: rankObj.color + '22', color: rankObj.color, border: `1px solid ${rankObj.color}44` }}
                      >
                        {rank} <span className="opacity-50">×{count}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="w-full h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

          {/* Ricerca */}
          <div>
            <p className="font-display text-[10px] text-white/30 tracking-[3px] mb-3">RICERCA</p>
            <Input
              placeholder="Nome cliente..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Filtro categoria */}
          {categorie.length > 1 && (
            <div>
              <p className="font-display text-[10px] text-white/30 tracking-[3px] mb-3">CATEGORIA</p>
              <div className="flex flex-col gap-1.5">
                {categorie.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategoria(cat)}
                    className={`text-left px-3 py-2 rounded-xl font-body text-[13px] cursor-pointer border transition-all ${filterCategoria === cat ? 'text-white border-white/20 bg-white/[.06]' : 'text-white/40 border-transparent bg-transparent hover:text-white/60'}`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ordinamento */}
          <div>
            <p className="font-display text-[10px] text-white/30 tracking-[3px] mb-3">ORDINA PER</p>
            <div className="flex flex-col gap-1.5">
              {[['name', 'Nome A→Z'], ['rank', 'Rank migliore'], ['level', 'Livello più alto']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setSortBy(val)}
                  className={`text-left px-3 py-2 rounded-xl font-body text-[13px] cursor-pointer border transition-all ${sortBy === val ? 'text-white border-white/20 bg-white/[.06]' : 'text-white/40 border-transparent bg-transparent hover:text-white/60'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottone aggiungi */}
          <div className="mt-auto">
            <button
              onClick={() => setShowWizard(true)}
              className="w-full rounded-xl py-3 font-display text-[12px] tracking-widest cursor-pointer transition-all border-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6cc, #8b5cf6cc)' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <span style={{ color: '#fff' }}>+ NUOVO CLIENTE</span>
            </button>
          </div>
        </aside>

        {/* ── Area principale ── */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 min-w-0">

          {/* Header mobile — titolo + bottone aggiungi */}
          <div className="lg:hidden mb-6">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="font-display text-[10px] text-blue-400 tracking-[3px] m-0 mb-1">TRAINER DASHBOARD</p>
                <h1 className="font-display font-black text-[26px] text-white m-0">I tuoi clienti</h1>
              </div>
              <button
                onClick={() => setShowWizard(true)}
                className="shrink-0 rounded-xl px-5 py-2.5 font-display text-[12px] tracking-widest cursor-pointer border-0 transition-opacity hover:opacity-85"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff' }}
              >
                + NUOVO
              </button>
            </div>
            {/* Ricerca + filtro su mobile */}
            <div className="grid grid-cols-[1fr_auto] gap-3 mb-3">
              <Input placeholder="Cerca cliente..." value={query} onChange={e => setQuery(e.target.value)} />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="input-base px-3"
                style={{ width: 'auto' }}
              >
                <option value="name">A→Z</option>
                <option value="rank">Rank</option>
                <option value="level">Livello</option>
              </select>
            </div>
          </div>

          {/* Intestazione desktop con contatore risultati */}
          <div className="hidden lg:flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display font-black text-[26px] text-white m-0">I tuoi clienti</h1>
              <p className="font-body text-white/30 text-[13px] m-0 mt-1">
                {loading ? 'Caricamento...' : `${displayed.length} ${displayed.length === 1 ? 'cliente' : 'clienti'}`}
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-2.5 bg-red-500/10 border border-red-400/20 mb-4">
              <p className="text-red-400 font-body text-[13px] m-0">⚠️ {error}</p>
            </div>
          )}

          {loading ? (
            <EmptyState message="Caricamento..." />
          ) : displayed.length === 0 ? (
            <EmptyState message={clients.length === 0 ? 'Nessun cliente. Aggiungine uno!' : 'Nessun risultato.'} />
          ) : (
            /* Griglia: 1 col mobile → 2 col tablet → 2-3 col desktop */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {displayed.map(client => (
                <ClientCard key={client.id} client={client} onClick={() => selectClient(client)} />
              ))}
            </div>
          )}
        </main>
      </div>

      {showWizard && <NewClientWizard onClose={() => setShowWizard(false)} onAdd={handleAdd} />}
    </div>
  )
}

// ── Sub-componenti ────────────────────────────────────────────────────────────

function StatBox({ label, value, color }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="font-display font-black text-[26px] leading-none" style={{ color }}>{value}</div>
      <div className="font-body text-[11px] text-white/30 mt-1">{label}</div>
    </div>
  )
}

function ClientCard({ client, onClick }) {
  const media   = calcStatMedia(client.stats ?? {})
  const rankObj = getRankFromMedia(media)
  const color   = client.rankColor ?? rankObj.color
  const xpPct   = client.xpNext > 0
    ? Math.round((client.xp / client.xpNext) * 100)
    : 0

  return (
    <button
      onClick={onClick}
      className="text-left w-full rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col gap-3 group"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = color + '0d'
        e.currentTarget.style.borderColor = color + '55'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
      }}
    >
      {/* Header: rank badge + nome */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color + '22', border: `2px solid ${color}55` }}
        >
          <span className="font-display font-black text-[16px]" style={{ color }}>
            {client.rank ?? 'F'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-body font-bold text-[16px] text-white truncate">{client.name}</div>
          <div className="flex gap-2 mt-0.5 flex-wrap">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-display"
              style={{ background: color + '22', color }}
            >
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

      {/* XP bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="font-display text-[9px] text-white/20 tracking-[2px]">EXP</span>
          <span className="font-display text-[9px]" style={{ color: color + 'aa' }}>{xpPct}%</span>
        </div>
        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${xpPct}%`, background: color }}
          />
        </div>
      </div>

      {/* Stats pillole */}
      {client.stats && Object.values(client.stats).some(v => v > 0) && (
        <div className="flex gap-1 flex-wrap">
          {Object.entries(client.stats).map(([key, val]) => (
            <div
              key={key}
              className="flex items-center gap-1 rounded-lg px-2 py-1"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <div
                className="h-[3px] rounded-full"
                style={{ width: 24, background: 'rgba(255,255,255,0.08)' }}
              >
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

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="font-body text-white/20 text-[15px]">{message}</div>
    </div>
  )
}
