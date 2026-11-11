import { useMemo, useId } from 'react'
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { BILATERAL_TESTS, MONO_SIDE, ASSESSMENT_OUTCOME } from '../../utils/lipedema'
import { SIDE_LABELS } from '../../config/lipedemaTests.config'
import { CHART_GRID_STROKE, CHART_TICK_STYLE, lineCursor } from '../../utils/chartTheme'
import { toTrendChartRows, describeTrend } from './assessmentTrend'
import { formatNumber, formatDateTime } from './assessmentFormat'

const CHART_HEIGHT_PX  = 180
const MARKER_RADIUS    = 3.5
const LINE_WIDTH       = 2
const CHART_MARGIN     = { top: 8, right: 8, bottom: 0, left: -20 }
// Stacca primo e ultimo punto dai bordi: l'etichetta centrata (anche "gg/mm hh:mm") resta intera (BUG-023)
const X_AXIS_PADDING   = { left: 28, right: 28 }
const APART_COLOR      = 'var(--rx-warning)'
const MIN_POINTS       = 2

// Il colore indica il lato, mai un giudizio; il marcatore lo distingue senza colore
const SIDE_COLOR = { [MONO_SIDE]: 'var(--rx-accent)', R: 'var(--rx-accent)', L: 'var(--rx-accent-2)' }

const OUTCOME_TEXT = {
  [ASSESSMENT_OUTCOME.STOPPED_EARLY]: 'interrotta',
  [ASSESSMENT_OUTCOME.INVALIDATED]:   'invalidata (uso braccia)',
}

const LEGEND_NOTE = 'Il delta è sempre rispetto all\'ultima valutazione precedente confrontabile, indicata con la data. ' +
  'Nessun valore normativo né giudizio clinico. Le valutazioni annullate non sono nel grafico.'

/**
 * Andamento di un test nel tempo (ADR-019 §3): linea a tratti, interrotta dove
 * cambia un parametro di protocollo o di setup; interrotte/invalidate come cerchio
 * vuoto fuori dalla linea; tetto OLS con triangolo; una serie per lato nei
 * bilaterali. Asse Y automatico: nessuna fascia, soglia o media.
 * @param {object} props.series — buildTrendSeries
 * @param {object} props.test   — voce di LIPEDEMA_TESTS
 * @param {string} props.describedById — id del titolo dello storico (alternativa testuale)
 */
export function AssessmentTrendChart({ series, test, describedById }) {
  const reactId = useId()
  const hintId  = `${reactId}-hint`
  const bilateral = BILATERAL_TESTS[test.id] ?? null
  const decimals  = bilateral?.displayDecimals ?? 0
  const model     = useMemo(() => toTrendChartRows(series), [series])
  const label     = useMemo(() => describeTrend(series, test), [series, test])
  const pointCount = new Set(series.points.map(point => point.assessmentId)).size

  if (pointCount < MIN_POINTS) {
    return <p className="font-body text-[12px] m-0" style={{ color: 'var(--rx-text-muted)' }}>Servono almeno 2 valutazioni per il grafico.</p>
  }

  const { rows, lines, aparts } = model
  return (
    <div className="flex flex-col gap-2">
      <div role="img" aria-label={label} aria-describedby={`${describedById} ${hintId}`} style={{ height: CHART_HEIGHT_PX }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
            <XAxis
              dataKey="x" tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} padding={X_AXIS_PADDING}
              interval="preserveStartEnd" tickFormatter={x => rows[x]?.label ?? ''}
            />
            <YAxis tick={CHART_TICK_STYLE} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip
              cursor={lineCursor('var(--rx-accent)')}
              content={<TrendTooltip unit={test.unit} decimals={decimals} />}
            />
            {lines.map(line => (
              <Line
                key={line.key}
                dataKey={line.key}
                type="linear"
                stroke={SIDE_COLOR[line.side]}
                strokeWidth={LINE_WIDTH}
                connectNulls
                isAnimationActive={false}
                dot={dotProps => renderMarker(dotProps, line.key, line.side)}
                activeDot={dotProps => renderMarker(dotProps, line.key, line.side)}
              />
            ))}
            {aparts.map(apart => (
              <Line
                key={apart.key}
                dataKey={apart.key}
                stroke="none"
                isAnimationActive={false}
                dot={dotProps => renderApartMarker(dotProps)}
                activeDot={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p id={hintId} className="sr-only">I valori del grafico sono elencati nello storico qui sotto.</p>
      <TrendLegend bilateral={bilateral} sides={series.sides} />
    </div>
  )
}

// ── Componenti locali ─────────────────────────────────────────────────────────

function TrendLegend({ bilateral, sides }) {
  return (
    <div className="flex flex-col gap-1 font-body text-[11px]" style={{ color: 'var(--rx-text-muted)' }}>
      <span>● confrontabili, unite dalla linea</span>
      <span>La linea si interrompe dove cambia un parametro di protocollo o di setup</span>
      {!bilateral && <span>○ interrotta o invalidata, fuori dalla linea</span>}
      {bilateral && (
        <span>{sides.map(side => `${side === 'L' ? '■' : '●'} ${SIDE_LABELS[side].short} ${SIDE_LABELS[side].label}`).join(' · ')}</span>
      )}
      {bilateral?.spec.ceiling != null && <span>▲ tetto {bilateral.spec.ceiling} s</span>}
      <span>{LEGEND_NOTE}</span>
    </div>
  )
}

function TrendTooltip({ active, payload, unit, decimals }) {
  const row = active ? payload?.[0]?.payload : null
  if (!row) return null
  const points = Object.values(row.points)
  return (
    <div className="rounded-[4px] px-3 py-2 font-body text-[12px] flex flex-col gap-0.5" style={{ background: 'var(--rx-surface)', border: '1px solid var(--rx-border)' }}>
      <span style={{ color: 'var(--rx-text-muted)' }}>{formatDateTime(row.performedAt)}</span>
      {points.map(point => (
        <span key={`${point.side}-${point.segment}-${point.kind}`} className="text-white">
          {point.side === MONO_SIDE ? '' : `${SIDE_LABELS[point.side].short} `}
          {formatNumber(point.value, decimals)} {unit}
          {OUTCOME_TEXT[point.outcome] ? ` · ${OUTCOME_TEXT[point.outcome]}` : ''}
          {point.ceiling ? ' · tetto' : ''}
        </span>
      ))}
    </div>
  )
}

// ── Funzioni helper pure ──────────────────────────────────────────────────────

function isDrawable({ cx, cy }) {
  return Number.isFinite(cx) && Number.isFinite(cy)
}

/** Cerchio (monolaterale, D), quadrato (S), triangolo (tetto OLS) */
function renderMarker(props, key, side) {
  if (!isDrawable(props)) return <g key={props.index} />
  const { cx, cy, payload, index } = props
  const color = SIDE_COLOR[side]
  const r     = MARKER_RADIUS
  if (payload.points?.[key]?.ceiling) {
    return <polygon key={index} points={`${cx},${cy - r - 1} ${cx - r - 1},${cy + r} ${cx + r + 1},${cy + r}`} fill={color} />
  }
  if (side === 'L') return <rect key={index} x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={color} />
  return <circle key={index} cx={cx} cy={cy} r={r} fill={color} />
}

/** Cerchio vuoto ambra: interrotta o invalidata, fuori dalla linea */
function renderApartMarker(props) {
  if (!isDrawable(props)) return <g key={props.index} />
  return <circle key={props.index} cx={props.cx} cy={props.cy} r={MARKER_RADIUS + 1} fill="none" stroke={APART_COLOR} strokeWidth={LINE_WIDTH} />
}
