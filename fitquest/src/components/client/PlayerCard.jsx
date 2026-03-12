import { Pentagon } from '../ui/Pentagon'
import { RankRing }  from '../ui/RankRing'
import { STATS }     from '../../constants'
import { calcStatMedia } from '../../utils/percentile'
import { getRankFromMedia } from '../../constants'

/**
 * PlayerCard — vista "trading card" mostrata al login prima della dashboard.
 * Dimensioni fisse 340×520px per garantire condivisibilità futura via screenshot.
 *
 * Props:
 *   client      — oggetto cliente da Firestore
 *   onEnter     — callback per passare alla dashboard (tap/click)
 */
export function PlayerCard({ client, onEnter }) {
  const media   = calcStatMedia(client.stats ?? {})
  const rankObj = getRankFromMedia(media)
  const color   = client.rankColor ?? rankObj.color
  const xpPct   = client.xpNext > 0
    ? Math.round((client.xp / client.xpNext) * 100)
    : 0

  return (
    // Contenitore che centra la card sullo schermo
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 20% 0%, #0f1f3d 0%, #070b14 60%)' }}
    >
      {/* La card vera e propria — dimensioni fisse per screenshot */}
      <div
        className="relative overflow-hidden select-none"
        style={{
          width: 340,
          height: 520,
          background: '#0a1628',
          border: `1px solid ${color}33`,
          borderRadius: 20,
          boxShadow: `0 0 60px ${color}22`,
        }}
      >
        {/* Fascia colorata in cima */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: color,
          borderRadius: '20px 20px 0 0',
        }} />

        {/* Header: nome + livello */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}>
            FitQuest · Hunter Profile
          </div>
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 900,
            fontSize: 26,
            color: '#fff',
            lineHeight: 1.1,
            letterSpacing: '0.02em',
          }}>
            {client.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 11,
              color,
              background: color + '22',
              border: `1px solid ${color}44`,
              borderRadius: 6,
              padding: '2px 8px',
              letterSpacing: '0.1em',
            }}>
              LVL {client.level}
            </span>
            {client.categoria && (
              <span style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 11,
                color: 'rgba(255,255,255,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                padding: '2px 8px',
              }}>
                {client.categoria}
              </span>
            )}
          </div>
        </div>

        {/* Ring centrale + pentagon affiancati */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '20px 20px 12px',
        }}>
          <RankRing rankObj={rankObj} xp={client.xp} xpNext={client.xpNext} size={120} />
          <Pentagon stats={client.stats} color={color} size={110} />
        </div>

        {/* XP bar */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 10,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.2em',
            }}>EXP</span>
            <span style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 10,
              color,
              letterSpacing: '0.1em',
            }}>
              {client.xp.toLocaleString()} / {client.xpNext.toLocaleString()}
            </span>
          </div>
          {/* Track */}
          <div style={{
            height: 5,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 99,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${xpPct}%`,
              background: color,
              borderRadius: 99,
              transition: 'width 1s ease',
            }} />
          </div>
        </div>

        {/* 5 stat pillole */}
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {STATS.map(({ key, icon, label }) => {
            const val = client.stats?.[key] ?? 0
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, width: 16 }}>{icon}</span>
                <span style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.4)',
                  width: 72,
                }}>
                  {label}
                </span>
                <div style={{
                  flex: 1,
                  height: 4,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 99,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${val}%`,
                    background: color + 'cc',
                    borderRadius: 99,
                  }} />
                </div>
                <span style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 11,
                  color,
                  width: 24,
                  textAlign: 'right',
                }}>
                  {val}
                </span>
              </div>
            )
          })}
        </div>

        {/* Footer watermark */}
        <div style={{
          position: 'absolute', bottom: 12, left: 0, right: 0,
          textAlign: 'center',
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 9,
          color: 'rgba(255,255,255,0.12)',
          letterSpacing: '0.3em',
        }}>
          FITQUEST
        </div>
      </div>

      {/* CTA sotto la card — non dentro, non fa parte dello screenshot */}
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
        Entra nella dashboard →
      </button>

      <p style={{
        marginTop: 12,
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 11,
        color: 'rgba(255,255,255,0.2)',
        letterSpacing: '0.1em',
      }}>
        swipe up oppure premi per continuare
      </p>
    </div>
  )
}
