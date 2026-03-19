import { useState } from 'react'
import { Pentagon } from '../ui/Pentagon'
import { RankRing } from '../ui/RankRing'
import { useClientRank } from '../../hooks/useClientRank'
import { getStatsConfig } from '../../constants'

export function PlayerCard({ client, onEnter }) {
  const { rankObj, color } = useClientRank(client)
  const xpPct = client.xpNext > 0 ? Math.round((client.xp / client.xpNext) * 100) : 0
  const [flipped, setFlipped] = useState(false)

  // ✅ CONFIG DINAMICA BASATA SU CATEGORIA
  const config = getStatsConfig(client.categoria)
  const statKeys = config.map(s => s.stat)
  const statLabels = config.map(s => s.label)
  
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 20% 0%, #0f1f3d 0%, #070b14 60%)' }}
    >
      <div style={{ width: 340, height: 520, perspective: '1000px' }}>
        <div style={{
          width: '100%', height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>

          {/* FRONTE */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: '#0a1628',
            border: `1px solid ${color}33`,
            borderRadius: 20,
            boxShadow: `0 0 60px ${color}22`,
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: color, borderRadius: '20px 20px 0 0' }} />

            {/* HEADER */}
            <div style={{ padding: '20px 20px 0' }}>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
                FITQUEST · PROFILO
              </div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 900, fontSize: 26, color: '#fff' }}>
                {client.name}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11, color, background: color + '22', border: `1px solid ${color}44`, borderRadius: 6, padding: '2px 8px' }}>
                  LVL {client.level}
                </span>
                {client.categoria && (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '2px 8px' }}>
                    {client.categoria}
                  </span>
                )}
              </div>
            </div>

            {/* STATS + PENTAGON */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 16px 8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
                
                {/* ✅ USO CONFIG DINAMICA */}
                {config.map(({ stat, label }) => {
                  const val = client.stats?.[stat] ?? 0

                  return (
                    <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', width: 60 }}>
                        {label}
                      </span>

                      <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: `${val}%`, background: color + 'cc' }} />
                      </div>

                      <span style={{ fontSize: 10, color, width: 20, textAlign: 'right' }}>
                        {val}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* ✅ Pentagon già corretto */}
              <Pentagon
                stats={client.stats}
                statKeys={statKeys}
                statLabels={statLabels}
                color={color}
                size={110}
              />
            </div>

            {/* XP */}
            <div style={{ padding: '4px 20px 12px' }}>
              <RankRing rankObj={rankObj} xp={client.xp} xpNext={client.xpNext} size={100} />

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>EXP</span>
                  <span style={{ fontSize: 10, color }}>
                    {client.xp} / {client.xpNext}
                  </span>
                </div>

                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${xpPct}%`, background: color }} />
                </div>
              </div>
            </div>

            <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.12)' }}>
              FITQUEST
            </div>
          </div>
        </div>
      </div>

      {/* BUTTON */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={onEnter}
          style={{
            border: `1px solid ${color}55`,
            borderRadius: 12,
            padding: '8px 28px',
            color,
            cursor: 'pointer'
          }}
        >
          ENTRA NELLA DASHBOARD
        </button>
      </div>
    </div>
  )
}