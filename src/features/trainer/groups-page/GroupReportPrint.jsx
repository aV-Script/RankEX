import { useEffect, createContext, useContext } from 'react'
import { createPortal }                        from 'react-dom'
import { ALL_TESTS, getRankFromMedia }          from '../../../constants/index'
import { Pentagon }                            from '../../../components/ui/Pentagon'

// ── Palette ────────────────────────────────────────────────────────────────────

const PCtx = createContext(null)
const useP  = () => useContext(PCtx)

const PALETTE = {
  dark: {
    BG:      '#07090e',
    SURFACE: '#0c1219',
    RAISED:  '#0f1820',
    BORDER:  '#1e293b',
    PRI:     '#f1f5f9',
    SEC:     '#94a3b8',
    TER:     '#475569',
    GREEN:   '#0ec452',
    DANGER:  '#ef4444',
    TRACK:   '#1e293b',
    MARKER:  'rgba(255,255,255,0.45)',
  },
  bw: {
    BG:      '#ffffff',
    SURFACE: '#f5f7fa',
    RAISED:  '#eaedf1',
    BORDER:  '#d0d5dd',
    PRI:     '#0f1117',
    SEC:     '#444c5c',
    TER:     '#7a8394',
    GREEN:   '#1a202c',
    DANGER:  '#6b7280',
    TRACK:   '#d0d5dd',
    MARKER:  'rgba(0,0,0,0.25)',
  },
}

// Podium: oro / argento / bronzo → in B&W scale di grigi
const PODIUM_DARK = ['#f59e0b', '#94a3b8', '#b45309']
const PODIUM_BW   = ['#111111', '#444444', '#777777']

// ── Componente principale ──────────────────────────────────────────────────────

export function GroupReportPrint({ group, clients, mode = 'dark', onClose }) {
  const p = { ...(PALETTE[mode] ?? PALETTE.dark), mode }
  const { BG, SURFACE, RAISED, BORDER, PRI, SEC, TER, GREEN, TRACK } = p
  const PODIUM = mode === 'bw' ? PODIUM_BW : PODIUM_DARK

  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'rankex-print-style'
    style.textContent = `
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        html, body { background: ${BG} !important; margin: 0 !important; padding: 0 !important; }
        body > *:not(#rankex-print-root) { display: none !important; }
        #rankex-print-root {
          position: static !important;
          display: block !important;
          width: 100% !important;
          min-height: 297mm !important;
          overflow: visible !important;
          background: ${BG} !important;
        }
        #rankex-print-controls { display: none !important; }
        @page { margin: 0; size: A4 portrait; }
      }
    `
    document.head.appendChild(style)
    const timer = setTimeout(() => window.print(), 350)
    window.addEventListener('afterprint', onClose)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('afterprint', onClose)
      document.getElementById('rankex-print-style')?.remove()
    }
  }, [onClose])

  // Classifica
  const sorted = [...clients]
    .filter(c => c.media != null)
    .sort((a, b) => (b.media ?? 0) - (a.media ?? 0))
  const noData = clients.filter(c => c.media == null)

  // Colonne stat
  const statKeys = Array.from(new Set(clients.flatMap(c => Object.keys(c.stats ?? {}))))
  const statCols = statKeys.map(key => ({
    key,
    label: ALL_TESTS.find(t => t.stat === key)?.label ?? key,
  }))

  // Campioni per disciplina
  const champions = statCols.map(col => {
    const withData = clients.filter(c => c.stats?.[col.key] != null)
    if (!withData.length) return null
    const max     = Math.max(...withData.map(c => c.stats[col.key]))
    const winners = withData.filter(c => c.stats[col.key] === max)
    return { key: col.key, label: col.label, max, winners }
  }).filter(Boolean)

  // Media di gruppo
  const avgMedia = sorted.length
    ? Math.round(sorted.reduce((s, c) => s + (c.media ?? 0), 0) / sorted.length)
    : null
  const avgRank  = avgMedia != null ? getRankFromMedia(avgMedia) : null
  const avgColor = mode === 'bw' ? '#2d3748' : (avgRank?.color ?? GREEN)

  // Stats medie di gruppo per Pentagon
  const avgStats = {}
  statCols.forEach(({ key }) => {
    const vals = clients.filter(c => c.stats?.[key] != null).map(c => c.stats[key])
    if (vals.length) avgStats[key] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  })
  const hasPentagon = statKeys.length >= 3

  return createPortal(
    <PCtx.Provider value={p}>
    <div id="rankex-print-root" style={{ background: BG, position: 'fixed', inset: 0, zIndex: 9999, overflow: 'auto' }}>

      {/* Barra controlli */}
      <div id="rankex-print-controls" style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 3, color: SEC, fontWeight: 700 }}>
          ANTEPRIMA PDF — REPORT GRUPPO
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{ background: GREEN, color: mode === 'bw' ? '#fff' : '#fff', border: 'none', borderRadius: 3, padding: '7px 18px', fontSize: 11, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', letterSpacing: 1, cursor: 'pointer' }}
          >
            STAMPA / SALVA PDF
          </button>
          <button
            onClick={onClose}
            style={{ background: RAISED, color: SEC, border: `1px solid ${BORDER}`, borderRadius: 3, padding: '7px 14px', fontSize: 15, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Documento */}
      <div style={{ maxWidth: 794, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', background: BG, minHeight: '100vh' }}>

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div style={{ padding: '18px 32px 14px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 20, letterSpacing: 4, color: PRI, lineHeight: 1 }}>
              RANK<span style={{ color: GREEN }}>EX</span>
            </div>
            <div style={{ fontSize: 8, letterSpacing: 3, color: TER, marginTop: 3, fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
              PERFORMANCE PLATFORM
            </div>
          </div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: 6, color: PRI, textTransform: 'uppercase' }}>
            Report Gruppo
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: SEC }}>{today}</div>
        </div>

        <div style={{ padding: '18px 32px 32px' }}>

          {/* ── HERO ───────────────────────────────────────────────────── */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '16px 20px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
              <div>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 26, color: PRI, lineHeight: 1, marginBottom: 6 }}>
                  {group.name}
                </div>
                <div style={{ fontSize: 11, color: SEC }}>
                  {clients.length} {clients.length === 1 ? 'atleta' : 'atleti'}
                  {noData.length > 0 && ` · ${noData.length} senza campionamento`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                <StatPill label="ATLETI"       value={clients.length} />
                {avgMedia != null && <StatPill label="MEDIA GRUPPO" value={`${avgMedia}°`} color={avgColor} />}
                {champions.length > 0 && <StatPill label="DISCIPLINE" value={champions.length} />}
                {avgMedia != null && (
                  <CircularGauge value={avgMedia} color={avgColor} sublabel={mode === 'bw' ? (avgRank?.label ?? '') : (avgRank?.label ?? '')} />
                )}
              </div>
            </div>
          </div>

          {/* ── RIGA CENTRALE: Pentagon + Campioni ─────────────────────── */}
          {hasPentagon && sorted.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '52fr 48fr', gap: 12, marginBottom: 14 }}>

              {/* Sinistra: Pentagon centrato + stat bars sotto */}
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
                <SectionTitle>Profilo Medio Gruppo</SectionTitle>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Pentagon
                      stats={avgStats}
                      statKeys={statKeys}
                      statLabels={statCols.map(c => c.label)}
                      color={avgColor}
                      size={180}
                      gridColor={mode === 'bw' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)'}
                      labelColor={mode === 'bw' ? TER : 'rgba(255,255,255,0.5)'}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {statCols.map(({ key, label }) => (
                      <div key={key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                          <span style={{ fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: SEC }}>{label}</span>
                          <span style={{ fontSize: 15, fontWeight: 900, fontFamily: 'Montserrat, sans-serif', color: PRI }}>{avgStats[key] ?? '—'}°</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 999, background: TRACK, overflow: 'hidden' }}>
                          <div style={{ width: `${avgStats[key] ?? 0}%`, height: '100%', borderRadius: 999, background: mode === 'bw' ? avgColor : `linear-gradient(90deg, ${avgColor}88, ${avgColor})` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Destra: Campioni per Disciplina */}
              {champions.length > 0 && (
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
                  <SectionTitle>Campioni per Disciplina</SectionTitle>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {champions.map(({ key, label, max, winners }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 4, background: RAISED, border: `1px solid ${BORDER}` }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 7, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: TER, marginBottom: 2 }}>{label}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: PRI, lineHeight: 1.2 }}>
                            {winners.map(w => w.name).join(', ')}
                          </div>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'Montserrat, sans-serif', color: GREEN, lineHeight: 1, flexShrink: 0 }}>
                          {Math.round(max)}°
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CLASSIFICA ─────────────────────────────────────────────── */}
          {sorted.length > 0 && (
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '16px 20px', marginBottom: 14 }}>
              <SectionTitle>Classifica</SectionTitle>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <Th style={{ width: 24 }}>#</Th>
                    <Th>Atleta</Th>
                    <Th right>Rank</Th>
                    <Th right>Lv.</Th>
                    <Th right>Media</Th>
                    <Th right>Δ</Th>
                    {statCols.map(col => <Th key={col.key} right>{col.label}</Th>)}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((client, i) => {
                    const rankObj     = getRankFromMedia(client.media)
                    const rankColor   = mode === 'bw' ? PRI : (rankObj?.color ?? SEC)
                    const podiumColor = PODIUM[i] ?? null
                    const prevMedia   = client.campionamenti?.[1]?.media ?? null
                    const delta       = prevMedia != null ? Math.round((client.media ?? 0) - prevMedia) : null
                    return (
                      <tr key={client.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '7px 8px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 900, fontFamily: 'Montserrat, sans-serif',
                            color: podiumColor ?? TER,
                          }}>
                            {i + 1}
                          </span>
                        </td>
                        <td style={{ padding: '7px 8px', fontWeight: 700, fontSize: 11, color: PRI }}>{client.name}</td>
                        <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 800, fontSize: 11, fontFamily: 'Montserrat, sans-serif', color: rankColor }}>{rankObj?.label ?? '—'}</td>
                        <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: 11, color: SEC }}>{client.level ?? '—'}</td>
                        <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 800, fontSize: 12, fontFamily: 'Montserrat, sans-serif', color: PRI }}>{Math.round(client.media)}°</td>
                        <td style={{ padding: '7px 8px', textAlign: 'right' }}><DeltaBadge delta={delta} compact /></td>
                        {statCols.map(col => (
                          <td key={col.key} style={{ padding: '7px 8px', textAlign: 'right', fontSize: 11, color: SEC }}>
                            {client.stats?.[col.key] != null ? `${Math.round(client.stats[col.key])}°` : '—'}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                  {noData.map(client => (
                    <tr key={client.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '7px 8px', color: TER, fontSize: 11 }}>—</td>
                      <td style={{ padding: '7px 8px', fontSize: 11, color: TER }}>{client.name}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: TER, fontSize: 11 }}>—</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: 11, color: TER }}>{client.level ?? '—'}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: 11, color: TER }}>N/D</td>
                      <td style={{ padding: '7px 8px' }} />
                      {statCols.map(col => <td key={col.key} style={{ padding: '7px 8px', textAlign: 'right', fontSize: 11, color: TER }}>—</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Campioni fallback — solo se non c'è pentagon */}
          {!hasPentagon && champions.length > 0 && (
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '16px 20px', marginBottom: 14 }}>
              <SectionTitle>Campioni per Disciplina</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {champions.map(({ key, label, max, winners }) => (
                  <div key={key} style={{ background: RAISED, border: `1px solid ${BORDER}`, borderRadius: 4, padding: '10px 12px' }}>
                    <div style={{ fontSize: 8, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: GREEN, marginBottom: 6 }}>
                      {label}
                    </div>
                    {winners.map(w => (
                      <div key={w.id} style={{ fontSize: 12, fontWeight: 700, color: PRI, lineHeight: 1.3 }}>{w.name}</div>
                    ))}
                    <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Montserrat, sans-serif', color: GREEN, marginTop: 6, lineHeight: 1 }}>
                      {Math.round(max)}°
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── FOOTER ─────────────────────────────────────────────────── */}
          <div style={{ paddingTop: 14, borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 8, color: TER, fontFamily: 'Montserrat, sans-serif', letterSpacing: 1, fontWeight: 600 }}>
              GENERATO DA RANKEX PLATFORM
            </span>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 13, letterSpacing: 3, color: SEC }}>
              RANK<span style={{ color: GREEN }}>EX</span>
            </div>
            <span style={{ fontSize: 8, color: TER }}>{today}</span>
          </div>

        </div>
      </div>
    </div>
    </PCtx.Provider>,
    document.body
  )
}

// ── SVG ────────────────────────────────────────────────────────────────────────

function CircularGauge({ value, color, sublabel }) {
  const { PRI, SEC, BORDER } = useP()
  const r = 32, cx = 48, cy = 48
  const circumference = 2 * Math.PI * r
  const dash = Math.min(1, value / 100) * circumference
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={BORDER} strokeWidth="8" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy - 3} textAnchor="middle" fill={PRI} fontSize="18" fontWeight="900" fontFamily="Montserrat">{value}°</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={SEC} fontSize="7" fontFamily="Montserrat" fontWeight="700" letterSpacing="1">{sublabel}</text>
    </svg>
  )
}

// ── UI micro-components ────────────────────────────────────────────────────────

function DeltaBadge({ delta, compact }) {
  const { SEC, GREEN, DANGER } = useP()
  if (delta === null || delta === undefined) return null
  if (delta === 0) return (
    <span style={{ fontSize: compact ? 9 : 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: SEC }}>—</span>
  )
  const positive = delta > 0
  const c = positive ? GREEN : DANGER
  return (
    <span style={{
      fontSize: compact ? 9 : 10,
      fontFamily: 'Montserrat, sans-serif', fontWeight: 800,
      color: c,
      background: c + '1a',
      border: `1px solid ${c}44`,
      borderRadius: 3,
      padding: compact ? '1px 4px' : '2px 7px',
      whiteSpace: 'nowrap',
    }}>
      {positive ? '↑' : '↓'} {positive ? `+${delta}°` : `${delta}°`}
    </span>
  )
}

function SectionTitle({ children }) {
  const { GREEN, SEC } = useP()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
      <div style={{ width: 2.5, height: 12, borderRadius: 2, background: GREEN, flexShrink: 0 }} />
      <span style={{ fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 800, color: SEC, fontFamily: 'Montserrat, sans-serif' }}>
        {children}
      </span>
    </div>
  )
}

function StatPill({ label, value, color }) {
  const { RAISED, BORDER, SEC, PRI } = useP()
  const c = color ?? null
  return (
    <div style={{ textAlign: 'center', background: c ? c + '14' : RAISED, border: `1px solid ${c ? c + '44' : BORDER}`, borderRadius: 4, padding: '7px 12px', minWidth: 60 }}>
      <div style={{ fontSize: 8, letterSpacing: 2, color: c ?? SEC, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 17, fontWeight: 900, fontFamily: 'Montserrat, sans-serif', color: c ?? PRI, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  )
}

function Th({ children, right, style: extraStyle }) {
  const { TER, BORDER } = useP()
  return (
    <th style={{ textAlign: right ? 'right' : 'left', padding: '6px 8px', color: TER, fontWeight: 700, fontSize: 8, letterSpacing: 1.5, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', borderBottom: `1px solid ${BORDER}`, ...extraStyle }}>
      {children}
    </th>
  )
}
