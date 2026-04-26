import { useMemo } from 'react'
import { ALL_TESTS } from '../../../constants/index'

export function GroupChampions({ clients }) {
  const champions = useMemo(() => {
    const statKeys = new Set()
    clients.forEach(c => Object.keys(c.stats ?? {}).forEach(k => statKeys.add(k)))

    return Array.from(statKeys).map(stat => {
      const test    = ALL_TESTS.find(t => t.stat === stat)
      const withData = clients.filter(c => c.stats?.[stat] != null)
      if (withData.length === 0) return null

      const maxVal  = Math.max(...withData.map(c => c.stats[stat]))
      const winners = withData.filter(c => c.stats[stat] === maxVal)
      return { stat, label: test?.label ?? stat.toUpperCase(), maxVal, winners }
    }).filter(Boolean)
  }, [clients])

  if (champions.length === 0) return null

  return (
    <div className="rounded-[4px] p-5 rx-card">
      <div className="font-display text-[11px] font-semibold tracking-[2px] uppercase mb-5" style={{ color: '#0fd65a' }}>
        ◈ Campioni per disciplina
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {champions.map(({ stat, label, maxVal, winners }) => (
          <ChampionCard key={stat} label={label} maxVal={maxVal} winners={winners} />
        ))}
      </div>
    </div>
  )
}

function ChampionCard({ label, maxVal, winners }) {
  return (
    <div
      className="px-3 py-3 rounded-[3px] flex flex-col gap-1.5"
      style={{
        background: 'rgba(255,215,0,0.05)',
        border: '1px solid rgba(255,215,0,0.15)',
      }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-display text-[10px] font-semibold tracking-[1.5px] text-white/35 truncate uppercase">
          {label}
        </span>
        <span className="text-[11px] shrink-0">🥇</span>
      </div>
      <div className="flex flex-col gap-0.5">
        {winners.map(w => (
          <div key={w.id} className="font-display font-bold text-[13px] text-white/80 truncate">
            {w.name}
          </div>
        ))}
      </div>
      <div className="font-display font-black text-[18px] leading-none" style={{ color: '#ffd700' }}>
        {Math.round(maxVal)}°
      </div>
    </div>
  )
}
