import { memo }                                        from 'react'
import { useClientRank }                               from '../../../hooks/useClientRank'
import { useTrainerState }                             from '../../../context/TrainerContext'
import { getModule, PLAYER_ROLES, SOCCER_AGE_GROUPS }  from '../../../config/modules.config'
import { getCategoriaById }                            from '../../../constants'
import { calcBiaScore, getBiaRankFromScore }           from '../../../utils/bia'

export const ClientCard = memo(function ClientCard({ client, onSelect }) {
  const { moduleType }       = useTrainerState()
  const isSoccer             = getModule(moduleType).isSoccer
  const { color: testColor } = useClientRank(client)

  const profileType = client.profileType ?? 'tests_only'
  const biaScore    = calcBiaScore(client.lastBia, client.sesso, client.eta)
  const biaRank     = biaScore > 0 ? getBiaRankFromScore(biaScore) : null
  const biaColor    = biaRank?.color ?? '#4a5568'
  const color       = profileType === 'bia_only' ? biaColor : testColor

  const categoria   = !isSoccer && client.categoria ? getCategoriaById(client.categoria) : null
  const roleObj     = isSoccer && client.ruolo ? PLAYER_ROLES.find(r => r.value === client.ruolo) : null
  const fasciaObj   = isSoccer && client.categoria === 'soccer_youth'
    ? SOCCER_AGE_GROUPS.find(g => g.value === 'soccer_youth')
    : null

  const xp     = client.xp     ?? 0
  const xpNext = client.xpNext ?? 500
  const xpPct  = xpNext > 0 ? Math.min(Math.round((xp / xpNext) * 100), 100) : 0

  return (
    <button
      onClick={() => onSelect(client)}
      className="text-left w-full rounded-[4px] p-4 cursor-pointer transition-all duration-200 flex items-start gap-3 group rx-card"
      onMouseEnter={e => {
        e.currentTarget.style.background  = color + '0d'
        e.currentTarget.style.borderColor = color + '55'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = ''
        e.currentTarget.style.borderColor = ''
      }}
    >
      {/* Badge rank */}
      {profileType === 'complete' ? (
        <div className="flex gap-1.5 shrink-0">
          <RankSquare label={client.rank ?? 'F'} color={testColor} sub="TEST" />
          <RankSquare label={biaRank?.label ?? 'F'} color={biaColor} sub="BIA" />
        </div>
      ) : (
        <RankSquare
          label={profileType === 'bia_only' ? (biaRank?.label ?? 'F') : (client.rank ?? 'F')}
          color={color}
        />
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <span className="font-display font-bold text-[15px] text-white truncate leading-tight">
          {client.name}
        </span>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Livello */}
          <span className="rounded-full px-2 py-0.5 text-[10px] font-display text-white/40 border border-white/10">
            LV.{client.level}
          </span>

          {/* Badge: categoria (PT) o ruolo (Soccer) */}
          {categoria && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-display font-bold tracking-wide"
              style={{
                background: categoria.color + '1a',
                color:      categoria.color,
                border:     `1px solid ${categoria.color}44`,
              }}
            >
              {categoria.label}
            </span>
          )}
          {roleObj && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-display font-bold tracking-wide"
              style={{
                background: '#00c8ff1a',
                color:      '#00c8ff',
                border:     '1px solid #00c8ff44',
              }}
            >
              {roleObj.label}
            </span>
          )}
          {fasciaObj && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-display font-bold tracking-wide"
              style={{
                background: 'rgba(250,204,21,0.1)',
                color:      '#facc15',
                border:     '1px solid rgba(250,204,21,0.3)',
              }}
            >
              {fasciaObj.label}
            </span>
          )}
        </div>

        {/* XP bar mini */}
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full" style={{ width: `${xpPct}%`, background: color }} />
          </div>
          <span className="font-display text-[9px] shrink-0" style={{ color: color + '99' }}>
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

function RankSquare({ label, color, sub }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="w-10 h-10 rounded-[3px] flex items-center justify-center"
        style={{ background: color + '22', border: `2px solid ${color}55` }}
      >
        <span className="font-display font-black text-[14px]" style={{ color }}>
          {label}
        </span>
      </div>
      {sub && (
        <span className="font-display text-[8px] tracking-[1px]" style={{ color: color + '88' }}>
          {sub}
        </span>
      )}
    </div>
  )
}
