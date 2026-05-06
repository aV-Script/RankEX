import { useMemo, useState }                                        from 'react'
import { BarChart, Bar, XAxis, LabelList, ResponsiveContainer, Cell } from 'recharts'
import { SectionLabel }                                               from '../../../components/ui'
import { useClientWearable }                                          from '../../../hooks/useWearable'
import {
  getActivityLevel, formatSteps, formatSyncTime, formatCalories,
} from '../../../utils/wearable'

const DAY_LABELS  = ['L', 'M', 'M', 'G', 'V', 'S', 'D']
const RING_SIZE   = 88
const RING_STROKE = 7

function Ring({ value, unit, label, pct, color }) {
  const r    = (RING_SIZE - RING_STROKE * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(pct ?? 0, 100) / 100)
  const cx   = RING_SIZE / 2
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg width={RING_SIZE} height={RING_SIZE} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cx} r={r} fill="none"
            stroke="rgba(255,255,255,0.07)" strokeWidth={RING_STROKE} />
          <circle cx={cx} cy={cx} r={r} fill="none"
            stroke={color} strokeWidth={RING_STROKE} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 4px ${color}88)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="font-display font-black tabular-nums leading-none" style={{ color, fontSize: 17 }}>
            {value ?? '—'}
          </span>
          {unit && value != null && (
            <span className="font-body leading-none" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>{unit}</span>
          )}
        </div>
      </div>
      <span className="font-body text-center text-white/40 leading-tight" style={{ fontSize: 10, maxWidth: RING_SIZE }}>
        {label}
      </span>
    </div>
  )
}

function StepsChart({ chartData, color, barSize }) {
  const maxSteps = chartData.length > 0 ? Math.max(...chartData.map(d => d.steps)) : 0
  return (
    <ResponsiveContainer width="100%" height={76}>
      <BarChart data={chartData} barSize={barSize} margin={{ top: 14, right: 0, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10, fontFamily: 'Montserrat' }}
          axisLine={false} tickLine={false}
        />
        <Bar dataKey="steps" radius={[2, 2, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.steps === maxSteps ? color : color + '44'} />
          ))}
          <LabelList
            dataKey="steps" position="top"
            formatter={v => v > 0 ? formatSteps(v) : ''}
            style={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'Montserrat' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ClientWearableSection({ orgId, clientId, initialWearable, color }) {
  const { wearable, loading, handleLink, handleSync, handleUnlink } =
    useClientWearable(orgId, clientId, initialWearable)

  const [period, setPeriod] = useState('7gg')
  const data     = wearable?.lastData ?? null
  const level    = getActivityLevel(data?.stepsAvg7d)
  const syncTime = formatSyncTime(wearable?.lastSync)
  const is7d     = period === '7gg'

  const avgSteps    = is7d ? data?.stepsAvg7d      : data?.stepsAvg30d
  const avgMins     = is7d ? data?.activeMinsAvg7d : data?.activeMinsAvg30d
  const avgCalories = is7d ? data?.caloriesAvg7d   : data?.caloriesAvg30d

  const stepsPct    = avgSteps    ? Math.min(100, (avgSteps / 10000) * 100)   : 0
  const minsPct     = avgMins     ? Math.min(100, (avgMins / 30) * 100)       : 0
  const caloriesPct = avgCalories ? Math.min(100, (avgCalories / 2000) * 100) : 0

  const chartData = useMemo(() => {
    const raw = data?.steps30d ?? []
    if (!raw.length) return []
    if (is7d) {
      return raw.slice(-7).map((steps, i) => ({ label: DAY_LABELS[i % 7] ?? '', steps }))
    }
    const days = raw.slice(-28)
    return [0, 1, 2, 3].map(w => {
      const slice = days.slice(w * 7, (w + 1) * 7).filter(v => v > 0)
      return {
        label: `Sett ${w + 1}`,
        steps: slice.length ? Math.round(slice.reduce((s, v) => s + v, 0) / slice.length) : 0,
      }
    })
  }, [data?.steps30d, is7d])

  return (
    <section className="px-4 pt-6">
      <div className="rounded-[4px] p-5 rx-card flex flex-col gap-5">

        <SectionLabel>◈ La mia attività</SectionLabel>

        {!wearable && (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="font-body text-[13px] text-white/40 text-center leading-relaxed">
              Collega Google Fit per condividere con il trainer passi,
              minuti attivi e calorie bruciate al giorno.
            </p>
            <button
              onClick={handleLink}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[4px] font-display text-[11px] tracking-[1.5px] cursor-pointer transition-all disabled:opacity-50"
              style={{ background: color + '22', border: `1px solid ${color}55`, color }}
            >
              <GoogleFitIcon />
              {loading ? 'COLLEGAMENTO…' : 'COLLEGA GOOGLE FIT'}
            </button>
          </div>
        )}

        {wearable && level && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-[4px]"
            style={{ background: level.color + '10', border: `1px solid ${level.color}25` }}
          >
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: level.color, boxShadow: `0 0 8px ${level.color}88`,
              flexShrink: 0, display: 'inline-block',
            }} />
            <span className="font-display text-[14px] font-bold" style={{ color: level.color }}>
              {level.label}
            </span>
            <span className="font-body text-[11px] text-white/30 ml-auto">
              {formatSteps(data?.stepsAvg7d)} passi/gg (7gg)
            </span>
          </div>
        )}

        {wearable && data && (
          <>
            <div className="flex items-center gap-1">
              {[{ id: '7gg', label: '7 GIORNI' }, { id: '30gg', label: '30 GIORNI' }].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className="font-display text-[9px] tracking-[1px] px-3 py-1 rounded-[3px] border cursor-pointer transition-all"
                  style={period === p.id
                    ? { background: color + '22', borderColor: color + '55', color }
                    : { background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
                  }
                >
                  {p.label}
                </button>
              ))}
              <span className="font-body text-[10px] text-white/20 ml-auto">media / giorno</span>
            </div>

            <div className="grid grid-cols-3 gap-2 justify-items-center py-1">
              <Ring
                label="Passi"
                value={avgSteps != null ? formatSteps(avgSteps) : null}
                unit={null}
                pct={stepsPct}
                color={color}
              />
              <Ring
                label="Min. attivi"
                value={avgMins ?? null}
                unit="min"
                pct={minsPct}
                color="#2ecfff"
              />
              <Ring
                label="Calorie"
                value={avgCalories != null ? formatCalories(avgCalories) : null}
                unit="kcal"
                pct={caloriesPct}
                color="#facc15"
              />
            </div>

            {chartData.length > 0 && (
              <div>
                <div className="font-display text-[10px] tracking-[2px] uppercase text-white/25 mb-1">
                  Passi — {is7d ? 'ultimi 7 giorni' : 'media settimanale'}
                </div>
                <StepsChart chartData={chartData} color={color} barSize={is7d ? 20 : 36} />
              </div>
            )}
          </>
        )}

        {wearable && !data && (
          <p className="font-body text-[13px] text-white/30 text-center py-2">
            Dati in arrivo — torna tra qualche ora.
          </p>
        )}

        {wearable && (
          <div className="flex items-center justify-between pt-1 border-t border-white/[.05]">
            <span className="font-body text-[11px] text-white/25">
              {syncTime ? `Ultimo sync: ${syncTime}` : 'Mai sincronizzato'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSync}
                disabled={loading}
                className="font-display text-[10px] tracking-[0.5px] px-2 py-1 rounded-[3px] border cursor-pointer transition-all disabled:opacity-40"
                style={{ color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.12)' }}
              >
                {loading ? '…' : '↻'}
              </button>
              <button
                onClick={handleUnlink}
                disabled={loading}
                className="font-display text-[10px] tracking-[0.5px] px-2 py-1 rounded-[3px] border cursor-pointer transition-all disabled:opacity-40"
                style={{ color: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                Scollega
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  )
}

function GoogleFitIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
