import { SectionLabel }  from '../../../components/ui'
import { BiaGaugeBar }   from './BiaGaugeBar'
import { BIA_PARAMS }    from '../../../constants/bia'

/**
 * Riepilogo BIA attuale — mostrato nel dashboard cliente e trainer.
 * color = biaColor calcolato nel parent (stesso sistema rank atletico).
 */
export function BiaSummary({ bia, prevBia, sex, age, color, rank }) {
  if (!bia) return null

  const displayParams = BIA_PARAMS.filter(p => !p.computed)

  return (
    <div className="rounded-[4px] p-5 rx-card">
      <div className="flex items-center justify-between mb-4">
        <SectionLabel className="mb-0">◈ Composizione corporea</SectionLabel>
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-[3px]"
          style={{ background: color + '11', border: `1px solid ${color}33` }}
        >
          <span className="font-display font-black text-[15px]" style={{ color }}>
            {rank}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {displayParams.map(param => (
          <BiaGaugeBar
            key={param.key}
            param={param}
            value={bia[param.key]}
            prevValue={prevBia?.[param.key] ?? null}
            sex={sex}
            age={age}
          />
        ))}
      </div>

      {bia.date && (
        <div className="mt-4 font-body text-[11px] text-white/20 text-right">
          Ultima misurazione: {bia.date}
        </div>
      )}
    </div>
  )
}
