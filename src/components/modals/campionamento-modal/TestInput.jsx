import { Input } from '../../ui'

/**
 * Card singolo test con input e percentile live.
 * Gestisce sia test semplici che test con variabili multiple.
 */
export function TestInput({ test, testValues, livePercentile, prevValue, errors, onUpdate }) {
  const delta = livePercentile !== null && prevValue !== undefined
    ? livePercentile - prevValue
    : null

  const color =
    livePercentile === null  ? 'rgba(255,255,255,0.25)' :
    livePercentile >= 75     ? '#6ee7b7' :
    livePercentile >= 40     ? '#f59e0b' :
                               '#f87171'

  return (
    <div
      className="rounded-2xl p-4 transition-colors"
      style={{
        background: livePercentile !== null ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border:     `1px solid ${livePercentile !== null ? color + '33' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      {/* Header test */}
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <span className="font-display text-[12px] text-white/80">{test.label}</span>
          <span className="text-white/25 font-body text-[10px] ml-1.5">{test.test}</span>
        </div>
        {livePercentile !== null && (
          <div className="flex items-baseline gap-1">
            <span className="font-display text-[20px] font-black leading-none" style={{ color }}>
              {livePercentile}
            </span>
            <span className="font-body text-[10px] text-white/30">/100</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        {test.variables ? (
          test.variables.map(v => (
            <div key={`${test.stat}_${v.key}`} className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="0"
                value={testValues[v.key] ?? ''}
                onChange={e => onUpdate(v.key, e.target.value)}
                className="flex-1"
              />
              <span className="text-white/30 font-body text-[11px] w-12 text-right">
                {v.unit}
              </span>
              {errors[v.key] && (
                <span className="text-red-400 text-[10px]">{errors[v.key]}</span>
              )}
            </div>
          ))
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="0"
              value={testValues[test.stat] ?? ''}
              onChange={e => onUpdate(test.stat, e.target.value)}
              className="flex-1"
            />
            <span className="text-white/30 font-body text-[11px] w-12 text-right">
              {test.unit}
            </span>
          </div>
        )}
      </div>

      {/* Barra percentile */}
      {livePercentile !== null && (
        <div
          className="mt-2.5 h-[3px] rounded-full overflow-hidden mb-1.5"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${livePercentile}%`, background: color }}
          />
        </div>
      )}

      {/* Delta e errore */}
      <div className="flex justify-between items-center text-[10px] mt-1">
        {delta !== null ? (
          <span style={{ color: delta > 0 ? '#34d399' : delta < 0 ? '#f87171' : 'rgba(255,255,255,0.2)' }}>
            {delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : '— invariato'} rispetto al precedente
          </span>
        ) : (
          <span className="text-white/20">Precedente: {prevValue ?? '—'}</span>
        )}
        {errors[test.stat] && (
          <span className="text-red-400">{errors[test.stat]}</span>
        )}
      </div>
    </div>
  )
}