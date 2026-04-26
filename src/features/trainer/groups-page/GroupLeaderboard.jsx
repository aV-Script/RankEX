import { useState, useMemo } from 'react'
import { ALL_TESTS, getRankFromMedia } from '../../../constants/index'

const POSITION_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'] // oro, argento, bronzo

// ── Componente principale ─────────────────────────────────────────────────────

export function GroupLeaderboard({ clients }) {
  const [sortStat, setSortStat] = useState('media')

  // Opzioni ordinamento: "MEDIA" + una pill per ogni stat disponibile nel gruppo
  const statOptions = useMemo(() => {
    const statKeys = new Set()
    clients.forEach(c => {
      Object.keys(c.stats ?? {}).forEach(k => statKeys.add(k))
    })
    return Array.from(statKeys).map(key => {
      const test = ALL_TESTS.find(t => t.stat === key)
      return { key, label: test?.label ?? key.toUpperCase() }
    })
  }, [clients])

  // Separazione clienti con/senza dato per la metrica selezionata
  const { sorted, sortedNoData, getScore } = useMemo(() => {
    const hasScore = (c) => sortStat === 'media'
      ? c.media != null
      : c.stats?.[sortStat] != null

    const getScore = (c) => sortStat === 'media'
      ? c.media
      : c.stats?.[sortStat]

    const withData = clients.filter(hasScore)
    const noData   = clients.filter(c => !hasScore(c))

    const sorted = [...withData].sort((a, b) => (getScore(b) ?? 0) - (getScore(a) ?? 0))
    const sortedNoData = [...noData].sort((a, b) => a.name.localeCompare(b.name))

    return { sorted, sortedNoData, getScore }
  }, [clients, sortStat])

  if (clients.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="font-body text-white/20 text-[14px]">
          Nessun atleta nel gruppo.
        </span>
      </div>
    )
  }

  return (
    <div>
      {/* Opzioni ordinamento */}
      {statOptions.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-5">
          <SortPill active={sortStat === 'media'} onClick={() => setSortStat('media')}>
            MEDIA
          </SortPill>
          {statOptions.map(opt => (
            <SortPill
              key={opt.key}
              active={sortStat === opt.key}
              onClick={() => setSortStat(opt.key)}
            >
              {opt.label}
            </SortPill>
          ))}
        </div>
      )}

      {/* Lista classifica */}
      <div className="flex flex-col gap-2">
        {sorted.map((client, idx) => (
          <LeaderboardRow
            key={client.id}
            position={idx + 1}
            client={client}
            score={getScore(client)}
            sortStat={sortStat}
          />
        ))}

        {/* Separatore "nessun dato" */}
        {sorted.length > 0 && sortedNoData.length > 0 && (
          <div className="mt-3 mb-1">
            <div className="font-display text-[10px] font-semibold text-white/25 tracking-[2px] uppercase">
              Nessun dato ({sortedNoData.length})
            </div>
          </div>
        )}

        {sortedNoData.map(client => (
          <LeaderboardRow
            key={client.id}
            position={null}
            client={client}
            score={null}
            sortStat={sortStat}
          />
        ))}
      </div>

      {/* Empty state — nessun dato in nessun cliente */}
      {sorted.length === 0 && (
        <div className="flex items-center justify-center py-10">
          <span className="font-body text-white/20 text-[13px] text-center">
            Nessun campionamento ancora registrato per questo gruppo.
          </span>
        </div>
      )}
    </div>
  )
}

// ── Componenti locali ─────────────────────────────────────────────────────────

function SortPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="font-display text-[10px] px-3 py-1.5 rounded-[3px] cursor-pointer border transition-all tracking-[1px]"
      style={active
        ? { background: 'rgba(15,214,90,0.12)', borderColor: 'rgba(15,214,90,0.35)', color: '#0fd65a' }
        : { background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }
      }
    >
      {children}
    </button>
  )
}

function LeaderboardRow({ position, client, score, sortStat }) {
  const isTop3    = position != null && position <= 3
  const posColor  = isTop3 ? POSITION_COLORS[position - 1] : null
  const rankObj   = client.media != null ? getRankFromMedia(client.media) : null

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-[3px] transition-all"
      style={
        position === 1
          ? { background: 'rgba(255,215,0,0.05)',  border: '1px solid rgba(255,215,0,0.18)' }
          : isTop3
          ? { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }
          : { background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }
      }
    >
      {/* Posizione */}
      <div
        className="w-7 text-center font-display font-black text-[12px] shrink-0"
        style={{ color: posColor ?? 'rgba(255,255,255,0.18)' }}
      >
        {position != null ? `#${position}` : '—'}
      </div>

      {/* Avatar iniziale */}
      <div
        className="w-8 h-8 rounded-[3px] flex items-center justify-center shrink-0"
        style={{ background: posColor ? `${posColor}18` : 'rgba(255,255,255,0.04)' }}
      >
        <span
          className="font-display text-[11px] font-bold"
          style={{ color: posColor ?? 'rgba(255,255,255,0.35)' }}
        >
          {client.name?.[0]?.toUpperCase()}
        </span>
      </div>

      {/* Nome + livello */}
      <div className="flex-1 min-w-0">
        <div className="font-display font-bold text-[13px] text-white/80 truncate">{client.name}</div>
        <div className="font-display text-[10px] text-white/30 mt-0.5">Lv.{client.level}</div>
      </div>

      {/* Rank badge (sempre dal media complessivo) */}
      {rankObj && (
        <div
          className="font-display font-black text-[11px] px-2 py-0.5 rounded-[3px] shrink-0"
          style={{
            color:      rankObj.color,
            background: `${rankObj.color}18`,
            border:     `1px solid ${rankObj.color}44`,
          }}
        >
          {rankObj.label}
        </div>
      )}

      {/* Score */}
      <div className="text-right shrink-0 min-w-[46px]">
        {score != null ? (
          <>
            <div
              className="font-display font-black text-[16px] leading-none"
              style={{ color: posColor ?? 'rgba(255,255,255,0.6)' }}
            >
              {Math.round(score)}
            </div>
            <div className="font-display text-[10px] font-semibold text-white/25 mt-0.5 tracking-[1px]">
              {sortStat === 'media' ? 'MEDIA' : 'PERC.'}
            </div>
          </>
        ) : (
          <span className="font-display text-[11px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
            N/D
          </span>
        )}
      </div>
    </div>
  )
}
