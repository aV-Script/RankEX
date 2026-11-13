// Testata della Home cliente: nome, rank, media (D2), categoria (solo PT), barra XP.
// Il centro del pentagono resta l'avatar: rank e media vivono qui.

import { RankBadge } from '../../../components/ui'
import { ProgressTrack } from '../../../components/ui/XPBar'
import { CATEGORIE } from '../../../constants'
import { getHomeCategoryLabel, getHomeMedia, getXpProgress } from '../../../utils/clientHome'

export function ClientHomeHeader({ client, rankObj, media, capabilities, color }) {
  const profileType = client.profileType ?? 'tests_only'
  const progress = getXpProgress({ xp: client.xp, xpNext: client.xpNext, level: client.level ?? 1 })
  const mediaRounded = getHomeMedia({ media, campionamenti: client.campionamenti, profileType })
  const categoryLabel = getHomeCategoryLabel(capabilities, client, CATEGORIE)

  return (
    <header className="min-w-0 text-center lg:text-left">
      <h1
        className="font-display font-black uppercase text-white leading-tight m-0 break-words text-[16px] lg:text-[20px]"
        style={{ letterSpacing: '0.06em', textShadow: '0 0 28px var(--rx-accent-glow)' }}
      >
        {client.name}
      </h1>
      {categoryLabel && (
        <div className="font-body text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Categoria {categoryLabel}
        </div>
      )}
      <div className="mt-2 flex items-center justify-center lg:justify-start gap-1.5 flex-wrap">
        {rankObj && <RankBadge label={rankObj.label} color={color} />}
        {mediaRounded !== null && (
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-[3px] font-display font-black"
            style={{ fontSize: 11, background: color + '12', color: color + 'bb', border: `1px solid ${color}28` }}
          >
            MEDIA {mediaRounded}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="font-display text-[11px] font-semibold tracking-[0.1em] mb-1.5" style={{ color }}>
          {progress.levelText} · {progress.xpText}
        </div>
        <div
          role="progressbar"
          aria-label={progress.ariaLabel}
          aria-valuemin={0}
          aria-valuenow={progress.now}
          aria-valuemax={progress.max}
        >
          <ProgressTrack pct={progress.pct} color={color} height="h-2" />
        </div>
      </div>
    </header>
  )
}
