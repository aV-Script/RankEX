import { useState, useCallback } from 'react'
import { useClients } from '../../hooks/useClients'
import { CampionamentoModal } from '../modals/CampionamentoModal'
import { AddXPModal } from '../modals/AddXPModal'
import { Pentagon } from '../ui/Pentagon'
import { Card, XPBar, SectionLabel } from '../ui'
import { STATS } from '../../constants'
import { calcStatMedia } from '../../utils/percentile'
import { getRankFromMedia } from '../../constants'

export function ClientDashboard({ client }) {
  const { handleCampionamento, handleAddXP, deselectClient } = useClients()
  const [showCampionamento, setShowCampionamento] = useState(false)
  const [showAddXP,         setShowAddXP]         = useState(false)

  const media    = calcStatMedia(client.stats ?? {})
  const rankObj  = getRankFromMedia(media)
  const color    = client.rankColor ?? rankObj.color

  return (
    <div className="px-5 py-7 max-w-2xl mx-auto">
      <button onClick={deselectClient}
        className="bg-transparent border-none text-white/40 font-body text-[14px] cursor-pointer mb-5 flex items-center gap-1.5 hover:text-white/70 transition-colors">
        ‹ Torna alla lista
      </button>

      {/* TOP ROW */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <ClientInfoCard client={client} color={color} rankObj={rankObj} media={media} />
        <Card className="flex items-center justify-center">
          <Pentagon stats={client.stats} color={color} />
        </Card>
      </div>

      {/* CENTER */}
      <Card className="flex items-center gap-8 px-5 py-8 mb-4">
        <RankBlock rankObj={rankObj} color={color} />
        <StatsBlock client={client} color={color} />
      </Card>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <ActivityLog log={client.log} />
        <BadgeList badges={client.badges} />
      </div>

      {client.campionamenti?.length > 1 && (
        <CampionamentiHistory campionamenti={client.campionamenti} className="mb-5" />
      )}

      {/* CTA */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setShowCampionamento(true)}
          className="rounded-2xl py-[18px] text-white font-display text-[13px] font-bold cursor-pointer tracking-widest transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${color}cc, ${color}44)`, border: `1px solid ${color}66`, boxShadow: `0 0 30px ${color}22` }}>
          📊 NUOVO CAMPIONAMENTO
        </button>
        <button onClick={() => setShowAddXP(true)}
          className="rounded-2xl py-[18px] text-white font-display text-[13px] font-bold cursor-pointer tracking-widest transition-opacity hover:opacity-90 bg-white/[.04] border border-white/10">
          ⭐ AGGIUNGI XP
        </button>
      </div>

      {showCampionamento && (
        <CampionamentoModal client={client} onClose={() => setShowCampionamento(false)}
          onSave={async (s, t, n) => { await handleCampionamento(client, s, t, n) }} />
      )}
      {showAddXP && (
        <AddXPModal client={client} onClose={() => setShowAddXP(false)}
          onSave={async (xp, n) => { await handleAddXP(client, xp, n) }} />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ClientInfoCard({ client, color, rankObj, media }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        {/* Rank badge grande */}
        <div className="flex flex-col items-center justify-center rounded-2xl w-14 h-14 shrink-0"
          style={{ background: color + '22', border: `2px solid ${color}55` }}>
          <span className="font-display font-black text-[18px] leading-none" style={{ color }}>{rankObj.label}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-body font-bold text-[18px] text-white truncate">{client.name}</div>
          <div className="flex gap-2 mt-1 flex-wrap items-center">
            <span className="rounded-full px-2.5 py-0.5 text-[11px] font-display" style={{ background: color + '22', color }}>
              LVL {client.level}
            </span>
            {client.categoria && (
              <span className="text-white/30 text-[11px] font-body border border-white/10 rounded-full px-2 py-0.5">
                {client.categoria}
              </span>
            )}
          </div>
          <div className="flex gap-3 mt-1 text-[11px] text-white/30 font-body flex-wrap">
            {client.eta    && <span>🎂 {client.eta} anni</span>}
            {client.peso   && <span>⚖️ {client.peso} kg</span>}
            {client.sesso  && <span>{client.sesso === 'M' ? '♂' : '♀'}</span>}
          </div>
          <XPBar xp={client.xp} xpNext={client.xpNext} color={color} />
        </div>
      </div>
    </Card>
  )
}

function RankBlock({ rankObj, color }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-[90px]">
      <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center"
        style={{ border: `3px solid ${color}`, background: color + '11', boxShadow: `0 0 30px ${color}44` }}>
        <span className="font-display font-black text-[32px]" style={{ color }}>{rankObj.label}</span>
      </div>
      <div className="text-center">
        <div className="text-[11px] text-white/40 font-body tracking-[2px]">RANK</div>
        <div className="font-display text-[13px] font-bold" style={{ color }}>{rankObj.label}</div>
      </div>
    </div>
  )
}

function StatsBlock({ client, color }) {
  return (
    <div className="flex-1">
      <SectionLabel>STATISTICHE</SectionLabel>
      {STATS.map(({ key, icon, label }) => {
        const val        = client.stats?.[key] ?? 0
        const statColor  = val >= 75 ? '#6ee7b7' : val >= 40 ? color : '#f87171'
        return (
          <div key={key} className="flex items-center gap-2.5 mb-2.5">
            <span className="w-4 text-[14px]">{icon}</span>
            <span className="w-[90px] text-white/50 font-body text-[13px]">{label}</span>
            <div className="flex-1 bg-white/[.06] rounded-full h-[5px]">
              <div className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${val}%`, background: `linear-gradient(90deg, ${statColor}, ${statColor}aa)` }} />
            </div>
            <span className="w-[30px] text-right font-display text-[11px]" style={{ color: statColor }}>{val}</span>
          </div>
        )
      })}
    </div>
  )
}

function ActivityLog({ log = [] }) {
  return (
    <Card>
      <SectionLabel>📋 Attività Recenti</SectionLabel>
      {log.slice(0, 5).map((entry, i) => (
        <div key={i} className="flex gap-2.5 items-start mb-2.5">
          <span className="text-white/20 font-body text-[11px] whitespace-nowrap mt-0.5">{entry.date}</span>
          <div>
            <div className="text-white/70 font-body text-[13px]">{entry.action}</div>
            {entry.xp > 0 && <div className="text-emerald-300 font-display text-[10px]">+{entry.xp} XP</div>}
          </div>
        </div>
      ))}
      {log.length === 0 && <p className="m-0 text-white/20 font-body text-[13px]">Nessuna attività ancora.</p>}
    </Card>
  )
}

function BadgeList({ badges = [] }) {
  return (
    <Card>
      <SectionLabel>🏅 Badge Conquistati</SectionLabel>
      {badges.map((b, i) => (
        <div key={i} className="bg-white/[.04] rounded-xl px-3 py-2 font-body text-[14px] text-white/80 mb-2">{b}</div>
      ))}
      {badges.length === 0 && <p className="m-0 text-white/20 font-body text-[13px]">Nessun badge ancora.</p>}
    </Card>
  )
}

function CampionamentiHistory({ campionamenti, className = '' }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? campionamenti : campionamenti.slice(0, 3)
  return (
    <Card className={className}>
      <SectionLabel>📈 Storico Campionamenti</SectionLabel>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px] font-body">
          <thead>
            <tr className="text-white/30">
              <th className="text-left pb-2 font-normal">Data</th>
              {STATS.map(s => <th key={s.key} className="text-center pb-2 font-normal">{s.icon}</th>)}
              <th className="text-center pb-2 font-normal">Media</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white/[.02]' : ''}>
                <td className="py-1.5 pr-3 text-white/40 whitespace-nowrap">{c.date}</td>
                {STATS.map(s => {
                  const val   = c.stats?.[s.key] ?? '-'
                  const color = val >= 75 ? '#6ee7b7' : val >= 40 ? '#60a5fa' : '#f87171'
                  return (
                    <td key={s.key} className="text-center py-1.5 font-display text-[11px]"
                      style={{ color: typeof val === 'number' ? color : 'rgba(255,255,255,0.2)' }}>
                      {val}
                    </td>
                  )
                })}
                <td className="text-center py-1.5 font-display text-[11px] text-white/60">{c.media ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {campionamenti.length > 3 && (
        <button onClick={() => setExpanded(!expanded)}
          className="mt-2 text-white/30 font-body text-[12px] bg-transparent border-none cursor-pointer hover:text-white/50 transition-colors">
          {expanded ? '▲ Mostra meno' : `▼ Mostra tutti (${campionamenti.length})`}
        </button>
      )}
    </Card>
  )
}
