import { SOCCER_AGE_GROUPS } from '../../config/modules.config'

const FASCIA_COLORS = {
  soccer_youth:  '#fbbf24',
  soccer_junior: '#a78bfa',
}

/**
 * Badge row condivisa tra ClientDashboard (trainer) e ClientDashboardPage (client).
 * Mostra categoria / ruolo / fascia / rank test / rank BIA.
 */
export function ClientBadges({ categoriaObj, ruoloObj, color, categoria, hasTests, hasBia, rankObj, biaRankObj }) {
  const fasciaGroup = (categoria === 'soccer_youth' || categoria === 'soccer_junior')
    ? SOCCER_AGE_GROUPS.find(g => g.value === categoria)
    : null
  const fasciaColor = FASCIA_COLORS[categoria] ?? '#fbbf24'

  return (
    <div className="flex items-center gap-2 mt-2.5 flex-wrap justify-center">
      {categoriaObj && (
        <span
          className="font-display text-[11px] px-3 py-1 rounded-[3px]"
          style={{ background: `color-mix(in srgb, ${categoriaObj.color} 9%, transparent)`, color: categoriaObj.color, border: `1px solid color-mix(in srgb, ${categoriaObj.color} 27%, transparent)` }}
        >
          {categoriaObj.label.toUpperCase()}
        </span>
      )}
      {ruoloObj && (
        <span
          className="font-display text-[11px] px-3 py-1 rounded-[3px]"
          style={{ background: `color-mix(in srgb, ${color} 9%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 27%, transparent)` }}
        >
          {ruoloObj.label.toUpperCase()}
        </span>
      )}
      {fasciaGroup && (
        <span
          className="font-display text-[11px] px-3 py-1 rounded-[3px]"
          style={{ background: `color-mix(in srgb, ${fasciaColor} 13%, transparent)`, color: fasciaColor, border: `1px solid color-mix(in srgb, ${fasciaColor} 25%, transparent)` }}
        >
          {fasciaGroup.label.toUpperCase()}
        </span>
      )}
      {hasTests && rankObj && (
        <span
          className="font-display font-bold text-[11px] px-3 py-1 rounded-[3px]"
          style={{ background: `color-mix(in srgb, ${rankObj.color} 13%, transparent)`, color: rankObj.color, border: `1px solid color-mix(in srgb, ${rankObj.color} 31%, transparent)` }}
        >
          {rankObj.label}
        </span>
      )}
      {hasBia && biaRankObj && (
        <span
          className="font-display text-[11px] px-3 py-1 rounded-[3px]"
          style={{ background: `color-mix(in srgb, ${biaRankObj.color} 13%, transparent)`, color: biaRankObj.color, border: `1px solid color-mix(in srgb, ${biaRankObj.color} 31%, transparent)` }}
        >
          BIA {biaRankObj.label}
        </span>
      )}
    </div>
  )
}
