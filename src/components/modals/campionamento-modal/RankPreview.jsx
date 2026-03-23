import { Pentagon } from '../../ui/Pentagon'
import { getStatsConfig } from '../../../constants'

/**
 * Colonna destra del modal campionamento.
 * Mostra rank proiettato, pentagon e contatore test completati.
 */
export function RankPreview({ client, statsForPreview, newRankObj, newMedia, oldRankObj, oldMedia, filledCount }) {
  const config     = getStatsConfig(client.categoria)
  const statKeys   = config.map(t => t.stat)
  const statLabels = config.map(t => t.label)
  const rankChanged = newRankObj.label !== oldRankObj.label

  return (
    <div className="hidden lg:flex flex-col gap-4 w-64 xl:w-72 shrink-0">

      {/* Rank proiettato */}
      <div
        className="rounded-2xl p-5 text-center"
        style={{ background: newRankObj.color + '11', border: `1px solid ${newRankObj.color}33` }}
      >
        <div className="font-display text-[10px] text-white/30 tracking-[3px] mb-2">
          RANK PROIETTATO
        </div>
        <div
          className="font-display font-black text-[48px]"
          style={{ color: newRankObj.color }}
        >
          {newRankObj.label}
        </div>
        <div className="font-body text-[12px] text-white/40 mt-1">
          Media: {Math.round(newMedia)}/100
        </div>
        {rankChanged && (
          <div
            className="mt-3 rounded-lg px-3 py-1.5 text-[11px] font-display"
            style={{
              background: newMedia > oldMedia ? '#34d39922' : '#f8717122',
              color:      newMedia > oldMedia ? '#34d399'   : '#f87171',
              border:     `1px solid ${newMedia > oldMedia ? '#34d39944' : '#f8717144'}`,
            }}
          >
            {newMedia > oldMedia ? '▲' : '▼'} {oldRankObj.label} → {newRankObj.label}
          </div>
        )}
      </div>

      {/* Pentagon */}
      <div
        className="rounded-2xl p-5 flex flex-col items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="font-display text-[10px] text-white/30 tracking-[3px]">STATISTICHE</div>
        <Pentagon
          stats={statsForPreview}
          statKeys={statKeys}
          statLabels={statLabels}
          color={newRankObj.color}
          size={160}
        />
      </div>

      {/* Contatore test */}
      <div
        className="rounded-xl px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span className="font-body text-[12px] text-white/40">Test completati</span>
        <span
          className="font-display text-[14px]"
          style={{ color: filledCount === statKeys.length ? '#34d399' : '#f59e0b' }}
        >
          {filledCount}/{statKeys.length}
        </span>
      </div>
    </div>
  )
}