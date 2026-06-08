import { memo }                                        from 'react'
import { useTrainerState }                             from '../../../context/TrainerContext'
import { getModule, PLAYER_ROLES, SOCCER_AGE_GROUPS }  from '../../../config/modules.config'
import { getCategoriaById }                            from '../../../constants'
import { calcBiaScore, getBiaRankFromScore }           from '../../../utils/bia'
import { calcAge }                                     from '../../../utils/validation'
import { useClientRank }                               from '../../../hooks/useClientRank'

export const ClientCard = memo(function ClientCard({ client, onSelect }) {
  const { moduleType }  = useTrainerState()
  const isSoccer        = getModule(moduleType).isSoccer
  const { color: _rankColor } = useClientRank(client)

  const profileType = client.profileType ?? 'tests_only'
  const biaScore    = calcBiaScore(client.lastBia, client.sesso, calcAge(client.dataNascita))
  const biaRank     = biaScore > 0 ? getBiaRankFromScore(biaScore) : null

  const categoria = !isSoccer && client.categoria ? getCategoriaById(client.categoria) : null
  const roleObj   = isSoccer && client.ruolo ? PLAYER_ROLES.find(r => r.value === client.ruolo) : null
  const fasciaObj = isSoccer && client.categoria !== 'soccer'
    ? SOCCER_AGE_GROUPS.find(g => g.value === client.categoria)
    : null

  const xp     = client.xp     ?? 0
  const xpNext = client.xpNext ?? 500
  const xpPct  = xpNext > 0 ? Math.min(Math.round((xp / xpNext) * 100), 100) : 0

  return (
    <button
      onClick={() => onSelect(client)}
      className="text-left w-full rounded-[4px] p-4 cursor-pointer transition-all duration-200 flex items-start gap-3 group rx-card"
      onMouseEnter={e => {
        e.currentTarget.style.background  = 'color-mix(in srgb, var(--rx-green) 5%, transparent)'
        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--rx-green) 33%, transparent)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = ''
        e.currentTarget.style.borderColor = ''
      }}
    >
      {/* Badge rank */}
      {profileType === 'complete' ? (
        <div className="flex gap-1.5 shrink-0">
          <RankSquare label={client.rank ?? 'F'} sub="TEST" />
          <RankSquare label={biaRank?.label ?? 'F'} sub="BIA" />
        </div>
      ) : (
        <RankSquare
          label={profileType === 'bia_only' ? (biaRank?.label ?? 'F') : (client.rank ?? 'F')}
        />
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <span className="font-display font-bold text-[15px] text-white truncate leading-tight">
          {client.name}
        </span>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Livello */}
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-display"
            style={{
              color:  'color-mix(in srgb, var(--rx-green) 55%, transparent)',
              border: '1px solid color-mix(in srgb, var(--rx-green) 20%, transparent)',
            }}
          >
            LV.{client.level}
          </span>

          {/* Badge: categoria (PT) o ruolo (Soccer) */}
          {categoria && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-display font-bold tracking-wide"
              style={{
                background: 'color-mix(in srgb, var(--rx-green) 10%, transparent)',
                color:      'var(--rx-green)',
                border:     '1px solid color-mix(in srgb, var(--rx-green) 28%, transparent)',
              }}
            >
              {categoria.label}
            </span>
          )}
          {roleObj && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-display font-bold tracking-wide"
              style={{
                background: 'color-mix(in srgb, var(--rx-green) 10%, transparent)',
                color:      'var(--rx-green)',
                border:     '1px solid color-mix(in srgb, var(--rx-green) 28%, transparent)',
              }}
            >
              {roleObj.label}
            </span>
          )}
          {fasciaObj && (() => {
            const fc = client.categoria === 'soccer_junior' ? '#a78bfa' : '#facc15'
            return (
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-display font-bold tracking-wide"
                style={{
                  background: fc + '1a',
                  color:      fc,
                  border:     `1px solid ${fc}4d`,
                }}
              >
                {fasciaObj.label}
              </span>
            )
          })()}
        </div>

        {/* XP bar mini */}
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ background: 'color-mix(in srgb, var(--rx-green) 8%, transparent)' }}>
            <div className="h-full rounded-full"
              style={{ width: `${xpPct}%`, background: 'var(--rx-green)' }} />
          </div>
          <span className="font-display text-[9px] shrink-0"
            style={{ color: 'color-mix(in srgb, var(--rx-green) 55%, transparent)' }}>
            {xp.toLocaleString()} XP
          </span>
        </div>
      </div>

      <svg className="shrink-0 text-white/20 group-hover:text-white/50 transition-colors mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  )
})

function RankSquare({ label, sub }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="w-10 h-10 rounded-[3px] flex items-center justify-center"
        style={{
          background: 'color-mix(in srgb, var(--rx-green) 13%, transparent)',
          border:     '2px solid color-mix(in srgb, var(--rx-green) 38%, transparent)',
        }}
      >
        <span className="font-display font-black text-[14px]" style={{ color: 'var(--rx-green)' }}>
          {label}
        </span>
      </div>
      {sub && (
        <span className="font-display text-[8px] tracking-[1px]"
          style={{ color: 'color-mix(in srgb, var(--rx-green) 45%, transparent)' }}>
          {sub}
        </span>
      )}
    </div>
  )
}
