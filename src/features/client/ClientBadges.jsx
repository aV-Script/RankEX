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
          style={{ background: categoriaObj.color + '18', color: categoriaObj.color, border: `1px solid ${categoriaObj.color}44` }}
        >
          {categoriaObj.label.toUpperCase()}
        </span>
      )}
      {ruoloObj && (
        <span
          className="font-display text-[11px] px-3 py-1 rounded-[3px]"
          style={{ background: color + '18', color, border: `1px solid ${color}44` }}
        >
          {ruoloObj.label.toUpperCase()}
        </span>
      )}
      {fasciaGroup && (
        <span
          className="font-display text-[11px] px-3 py-1 rounded-[3px]"
          style={{ background: fasciaColor + '20', color: fasciaColor, border: `1px solid ${fasciaColor}40` }}
        >
          {fasciaGroup.label.toUpperCase()}
        </span>
      )}
      {hasTests && rankObj && (
        <span
          className="font-display font-bold text-[11px] px-3 py-1 rounded-[3px]"
          style={{ background: rankObj.color + '20', color: rankObj.color, border: `1px solid ${rankObj.color}50` }}
        >
          {rankObj.label}
        </span>
      )}
      {hasBia && biaRankObj && (
        <span
          className="font-display text-[11px] px-3 py-1 rounded-[3px]"
          style={{ background: biaRankObj.color + '20', color: biaRankObj.color, border: `1px solid ${biaRankObj.color}50` }}
        >
          BIA {biaRankObj.label}
        </span>
      )}
    </div>
  )
}
