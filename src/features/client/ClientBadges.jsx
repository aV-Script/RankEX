/**
 * Badge row condivisa tra ClientDashboard (trainer) e ClientDashboardPage (client).
 * Mostra categoria / ruolo / fascia / rank test / rank BIA.
 */
export function ClientBadges({ categoriaObj, ruoloObj, color, categoria, hasTests, hasBia, rankObj, biaRankObj }) {
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
      {categoria === 'soccer_youth' && (
        <span
          className="font-display text-[11px] px-3 py-1 rounded-[3px]"
          style={{ background: '#fbbf2420', color: '#fbbf24', border: '1px solid #fbbf2440' }}
        >
          PICCOLI
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
