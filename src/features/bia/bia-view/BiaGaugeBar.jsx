import { getBiaParamStatus } from '../../../utils/bia'

export function BiaGaugeBar({ param, value, prevValue, sex, age }) {
  const status = getBiaParamStatus(param.key, value, sex, age)

  const delta = (prevValue !== null && prevValue !== undefined && value !== null && value !== '')
    ? (Number(value) - Number(prevValue)).toFixed(1)
    : null

  const isGoodDelta = delta !== null && (
    param.direction === 'direct'  ? Number(delta) > 0 :
    param.direction === 'inverse' ? Number(delta) < 0 :
    false
  )
  const isBadDelta = delta !== null && (
    param.direction === 'direct'  ? Number(delta) < 0 :
    param.direction === 'inverse' ? Number(delta) > 0 :
    false
  )

  const displayValue = value !== '' && value !== null ? `${value}${param.unit}` : '—'
  const valueColor   = value !== '' && value !== null ? status.color : 'rgba(255,255,255,0.2)'

  return (
    <div className="flex items-center gap-3">
      <span className="font-body text-[12px] text-white/50 w-28 shrink-0">
        {param.label}
      </span>

      <div
        className="flex-1 h-[5px] rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width:      `${value !== '' && value !== null ? status.score : 0}%`,
            background: value !== '' && value !== null ? status.color : 'transparent',
          }}
        />
      </div>

      <span
        className="font-display text-[12px] text-right tabular-nums shrink-0"
        style={{ color: valueColor, minWidth: '3.5rem' }}
      >
        {displayValue}
      </span>

      {delta !== null && (
        <span
          className="font-display text-[10px] w-10 text-right tabular-nums shrink-0"
          style={{
            color: isGoodDelta ? 'var(--rx-green-bright)' :
                   isBadDelta  ? '#ef4444' :
                   'rgba(255,255,255,0.2)',
          }}
        >
          {Number(delta) > 0 ? `+${delta}` : delta}
        </span>
      )}
    </div>
  )
}
