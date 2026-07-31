import { useState, useMemo } from 'react'
import { usePagination }           from '../../../hooks/usePagination'
import { Pagination }              from '../../../components/common/Pagination'
import { Pentagon }                from '../../../components/ui/Pentagon'
import { SectionLabel }            from '../../../components/ui'
import {
  pickDefaultComparisonClients, buildComparisonStatCols, isMaxValue,
} from '../../../utils/groupAnalysis'

// Il secondo colore era '#2ecfff' letterale — un secondo "ciano di brand" in
// parallelo a --rx-accent-2 (var(--rx-accent-2) reale a runtime), non allineato
// al tema attivo. Corretto lug 2026.
const COMPARISON_COLORS  = ['var(--rx-accent)', 'var(--rx-accent-2)', 'var(--rx-gold)']
const MAX_SELECTED       = 2
const SELECTOR_PAGE_SIZE = 6

export function GroupComparison({ clients }) {
  const defaultSelected = useMemo(() => pickDefaultComparisonClients(clients, MAX_SELECTED), [clients])

  const [selected, setSelected] = useState(defaultSelected)

  const selectedClients = useMemo(
    () => selected.map(id => clients.find(c => c.id === id)).filter(Boolean),
    [selected, clients]
  )

  const unselectedClients = useMemo(
    () => clients.filter(c => !selected.includes(c.id)),
    [clients, selected]
  )

  const statCols = useMemo(() => buildComparisonStatCols(selectedClients), [selectedClients])

  const radarStatKeys   = useMemo(() => statCols.map(s => s.key),   [statCols])
  const radarStatLabels = useMemo(() => statCols.map(s => s.label), [statCols])
  const radarColors     = useMemo(
    () => selectedClients.map((_, i) => COMPARISON_COLORS[i]),
    [selectedClients]
  )

  const selectorPagination = usePagination(unselectedClients, SELECTOR_PAGE_SIZE)

  const handleToggle = (id) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= MAX_SELECTED) return prev
      return [...prev, id]
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

      {/* Col 1: Selettore atleti */}
      <div className="rounded-[4px] p-5 rx-card min-w-0">
        <SectionLabel className="mb-1">◈ Confronto atleti</SectionLabel>
        <div className="font-display text-[10px] text-white/60 tracking-[1px] mb-4">
          {selected.length}/{MAX_SELECTED} selezionati
        </div>

        {/* Selezionati — sempre visibili */}
        {selectedClients.length > 0 && (
          <div className={selected.length < MAX_SELECTED ? 'mb-4' : ''}>
            <div className="font-display text-[9px] tracking-[1.5px] text-white/60 mb-2 uppercase">
              Selezionati
            </div>
            <div className="flex flex-col gap-2">
              {selectedClients.map((c, i) => (
                <ComparisonAthleteRow
                  key={c.id}
                  client={c}
                  selIdx={i}
                  disabled={false}
                  onToggle={() => handleToggle(c.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Non selezionati — paginati, solo se c'è ancora spazio */}
        {selected.length < MAX_SELECTED && (
          <div>
            {selectedClients.length > 0 && unselectedClients.length > 0 && (
              <div className="font-display text-[9px] tracking-[1.5px] text-white/60 mb-2 uppercase">
                Aggiungi
              </div>
            )}
            <div className="flex flex-col gap-2">
              {selectorPagination.paginatedItems.map(c => (
                <ComparisonAthleteRow
                  key={c.id}
                  client={c}
                  selIdx={-1}
                  disabled={false}
                  onToggle={() => handleToggle(c.id)}
                />
              ))}
            </div>
            {unselectedClients.length > SELECTOR_PAGE_SIZE && (
              <Pagination {...selectorPagination} />
            )}
          </div>
        )}
      </div>

      {/* Col 2: Radar (centro) */}
      <div className="rounded-[4px] p-5 rx-card flex flex-col items-center gap-4 min-w-0">
        <SectionLabel className="w-full mb-0">◈ Radar</SectionLabel>
        {selectedClients.length > 0 && statCols.length > 0 ? (
          <div style={{ width: '100%', aspectRatio: '1 / 1' }}>
            <Pentagon
              size={300}
              statKeys={radarStatKeys}
              statLabels={radarStatLabels}
              multi={selectedClients.map((c, i) => ({ id: c.id, stats: c.stats ?? {}, color: radarColors[i] }))}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <span className="font-body text-white/60 text-[13px] text-center">
              {selectedClients.length === 0
                ? 'Seleziona almeno un atleta.'
                : 'Nessun campionamento per gli atleti selezionati.'}
            </span>
          </div>
        )}
      </div>

      {/* Col 3: Tabella valori */}
      <div className="rounded-[4px] p-5 rx-card min-w-0">
        <SectionLabel className="mb-4">◈ Valori</SectionLabel>
        {selectedClients.length > 0 && statCols.length > 0 ? (
          <>
            <div className="flex gap-3 flex-wrap mb-4">
              {selectedClients.map((c, i) => (
                <div key={c.id} className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COMPARISON_COLORS[i] }} />
                  <span className="font-display font-bold text-[12px] truncate" style={{ color: COMPARISON_COLORS[i] }}>{c.name}</span>
                </div>
              ))}
            </div>
            <div
              className="rounded-[3px] p-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <ComparisonTable clients={selectedClients} statCols={statCols} />
            </div>
          </>
        ) : (
          <p className="font-body text-[13px] text-white/60">
            {selectedClients.length === 0
              ? 'Seleziona atleti per vedere i valori.'
              : 'Nessun dato disponibile.'}
          </p>
        )}
      </div>

    </div>
  )
}

// ── Riga selettore atleta ─────────────────────────────────────────────────────

function ComparisonAthleteRow({ client, selIdx, disabled, onToggle }) {
  const isSelected = selIdx !== -1
  const color      = isSelected ? COMPARISON_COLORS[selIdx] : null

  return (
    <div
      className="flex items-center justify-between px-3 py-2.5 rounded-[3px] transition-all"
      style={isSelected
        ? { background: `color-mix(in srgb, ${color} 5%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 20%, transparent)` }
        : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }
      }
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: isSelected ? color : 'transparent', border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.1)' }}
        />
        <div
          className="w-7 h-7 rounded-[3px] flex items-center justify-center shrink-0"
          style={{ background: isSelected ? `color-mix(in srgb, ${color} 10%, transparent)` : 'rgba(255,255,255,0.05)' }}
        >
          <span className="font-display text-[11px] font-bold" style={{ color: isSelected ? color : 'rgba(255,255,255,0.35)' }}>
            {client.name?.[0]?.toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <div className="font-display font-bold text-[12px] text-white/80 truncate">{client.name}</div>
          {client.rank && (
            <div className="font-display text-[10px] text-white/30 mt-0.5">
              {client.rank} · Lv.{client.level}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        className="font-display text-[10px] px-2.5 py-1.5 rounded-[3px] cursor-pointer border transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 ml-2"
        style={isSelected
          ? { color: '#f87171', borderColor: 'rgba(248,113,113,0.2)', background: 'transparent' }
          : { color: 'var(--rx-accent)', borderColor: 'color-mix(in srgb, var(--rx-accent) 20%, transparent)', background: 'color-mix(in srgb, var(--rx-accent) 6%, transparent)' }
        }
      >
        {isSelected ? '−' : '+'}
      </button>
    </div>
  )
}

// ── Tabella confronto ──────────────────────────────────────────────────────────

function ComparisonTable({ clients, statCols }) {
  return (
    <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', tableLayout: 'fixed' }}>
      <thead>
        <tr>
          <th className="text-left pb-3" style={{ width: '44%' }}>
            <span className="font-display text-[10px] font-semibold tracking-[1px] text-white/60">STAT</span>
          </th>
          {clients.map((c, i) => (
            <th key={c.id} className="pb-3 px-1 text-right">
              <span className="font-display text-[10px] font-semibold tracking-[1px] block truncate" style={{ color: COMPARISON_COLORS[i] }}>
                {c.name.split(' ')[0].toUpperCase()}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {statCols.map(col => (
          <tr key={col.key}>
            <td className="py-1.5 pr-2 border-t border-white/[.04]" style={{ overflow: 'hidden' }}>
              <span className="font-display text-[10px] text-white/35 block truncate">{col.label}</span>
            </td>
            {clients.map((c, i) => {
              const val   = c.stats?.[col.key]
              const isMax = isMaxValue(clients, col.key, c.id)
              return (
                <td key={c.id} className="py-1.5 px-1 text-right border-t border-white/[.04]">
                  <span
                    className="font-display font-black text-[13px]"
                    style={{ color: val != null ? (isMax ? COMPARISON_COLORS[i] : 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.15)' }}
                  >
                    {val != null ? `${Math.round(val)}°` : '—'}
                  </span>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
