import { Pentagon } from '../ui/Pentagon'
import { RankRing }  from '../ui/RankRing'
import { STATS }     from '../../constants'
import { useClientRank } from '../../hooks/useClientRank'

export function PlayerCard({ client, onEnter }) {
  const { rankObj, color } = useClientRank(client)
  const xpPct   = client.xpNext > 0 ? Math.round((client.xp / client.xpNext) * 100) : 0

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"

    >
      {/* Card — dimensioni fisse 340×520 per condivisibilità */}
      <div className="relative overflow-hidden select-none" style={{
        width: 340, height: 520,
        background: '#0a1628',
        border: `1px solid ${color}33`,
        borderRadius: 20,
        boxShadow: `0 0 60px ${color}22`,
      }}>
        {/* Fascia colore in cima */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: color, borderRadius: '20px 20px 0 0' }} />

        {/* Header: nome + livello */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
            FITQUEST · PROFILO
          </div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 900, fontSize: 26, color: '#fff', lineHeight: 1.1, letterSpacing: '0.02em' }}>
            {client.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color, background: color + '22', border: `1px solid ${color}44`, borderRadius: 6, padding: '2px 8px', letterSpacing: '0.1em' }}>
              LVL {client.level}
            </span>
            {client.categoria && (
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '2px 8px' }}>
                {client.categoria}
              </span>
            )}
          </div>
        </div>

        {/* Ring sinistra + Pentagon destra (stat a sinistra del pentagon) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 16px 8px' }}>
          {/* Stat list + pentagon */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
            {STATS.map(({ key, label }) => {
              const val = client.stats?.[key] ?? 0
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.4)', width: 60, flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${val}%`, background: color + 'cc', borderRadius: 99 }} />
                  </div>
                  <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, color, width: 20, textAlign: 'right' }}>{val}</span>
                </div>
              )
            })}
          </div>
          <Pentagon stats={client.stats} color={color} size={110} />
        </div>

        {/* Ring + XP */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '4px 20px 12px' }}>
          <RankRing rankObj={rankObj} xp={client.xp} xpNext={client.xpNext} size={100} />
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em' }}>EXP</span>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, color, letterSpacing: '0.1em' }}>
                {client.xp.toLocaleString()} / {client.xpNext.toLocaleString()}
              </span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${xpPct}%`, background: color, borderRadius: 99, transition: 'width 1s ease' }} />
            </div>
          </div>
        </div>

        {/* Watermark */}
        <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', fontFamily: "'Rajdhani', sans-serif", fontSize: 9, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.3em' }}>
          FITQUEST
        </div>
      </div>

      {/* CTA — fuori dalla card, senza freccia */}
      <button
        onClick={onEnter}
        style={{
          marginTop: 24,
          background: 'transparent',
          border: `1px solid ${color}55`,
          borderRadius: 12,
          padding: '10px 32px',
          color: color,
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 13,
          letterSpacing: '0.2em',
          cursor: 'pointer',
          textTransform: 'uppercase',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = color + '22'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        ENTRA NELLA DASHBOARD
      </button>
    </div>
  )
}
