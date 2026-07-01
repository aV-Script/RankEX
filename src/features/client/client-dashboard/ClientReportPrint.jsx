import { useEffect, createContext, useContext } from 'react'
import { createPortal }                        from 'react-dom'
import { getStatsConfig, getCategoriaById, getRankFromMedia } from '../../../constants'
import { getProfileCategory }     from '../../../constants/bia'
import { SOCCER_AGE_GROUPS, PLAYER_ROLES } from '../../../config/modules.config'
import { calcAge }                from '../../../utils/validation'
import { Pentagon }               from '../../../components/ui/Pentagon'
import { useTheme }               from '../../../context/ThemeContext'

const isSoccerCat = (cat) => ['soccer', 'soccer_youth', 'soccer_junior'].includes(cat)

function getMediaDesc(media) {
  if (!media) return null
  if (media >= 85) return 'TOP PERFORMER'
  if (media >= 70) return 'BUON POTENZIALE'
  if (media >= 55) return 'IN CRESCITA'
  if (media >= 40) return 'BASE SOLIDA'
  return 'DA SVILUPPARE'
}

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

export function ClientReportPrint({ client, _color, rankObj, mode = 'dark', onClose }) {
  const { theme } = useTheme()

  const p = mode === 'dark'
    ? {
        BG:      theme.bg.base,
        SURFACE: theme.vars['--rx-surface'] ?? '#0c1219',
        RAISED:  theme.vars['--rx-raised']  ?? '#0f1820',
        BORDER:  theme.vars['--rx-border']  ?? '#1e293b',
        PRI:     '#f1f5f9',
        SEC:     '#94a3b8',
        TER:     '#475569',
        GREEN:   theme.vars['--rx-green']   ?? '#0ec452',
        CYAN:    theme.vars['--rx-cyan']    ?? '#2ecfff',
        DANGER:  '#ef4444',
        TRACK:   theme.vars['--rx-raised']  ?? '#1e293b',
        MARKER:  'rgba(255,255,255,0.45)',
        mode,
      }
    : { ...PALETTE.bw, CYAN: '#2ecfff', mode }

  const { BG, SURFACE, RAISED, BORDER, PRI, SEC, TER, GREEN, CYAN, TRACK } = p
  const rankColor = mode === 'bw' ? '#2d3748' : (rankObj?.color ?? GREEN)
  const profile        = getProfileCategory(client.profileType ?? 'tests_only')
  const isSoccer       = isSoccerCat(client.categoria)
  const categoriaLabel = isSoccer
    ? SOCCER_AGE_GROUPS.find(g => g.value === client.categoria)?.label
    : getCategoriaById(client.categoria)?.label
  const ruoloLabel = isSoccer && client.ruolo
    ? PLAYER_ROLES.find(r => r.value === client.ruolo)?.label
    : null

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
  }, [onClose, BG])

  const stats       = client.stats ?? {}
  // campionamenti[0] = più recente, [1] = precedente per il delta
  const prevStats   = client.campionamenti?.[1]?.stats ?? null
  const statsConfig = profile.hasTests ? getStatsConfig(client.categoria) : []
  const statKeys    = statsConfig.map(t => t.stat)
  const statLabels  = statsConfig.map(t => t.label)
  const today       = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })

  // Fix ETÀ: usa dataNascita se disponibile, altrimenti fallback sul campo eta (numero intero)
  const age = calcAge(client.dataNascita) ?? client.eta

  const media        = Math.round(client.media ?? 0)
  const campionamenti = client.campionamenti ?? []

  // Trend: primo vs ultimo nel range visibile
  const trendDelta = campionamenti.length >= 2
    ? Math.round((campionamenti[0].media ?? 0) - (campionamenti[campionamenti.length - 1].media ?? 0))
    : null

  return createPortal(
    <PCtx.Provider value={p}>
    <div id="rankex-print-root" style={{ background: BG, position: 'fixed', inset: 0, zIndex: 9999, overflow: 'auto' }}>

      {/* Barra controlli — nascosta in stampa */}
      <div id="rankex-print-controls" style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 3, color: SEC, fontWeight: 700 }}>
            ANTEPRIMA PDF — SCHEDA ATLETA
          </span>
          {mode === 'dark' && (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#f59e0b' }}>
              ⚠ Nel dialogo di stampa attiva <strong>Grafici di sfondo</strong> per preservare lo sfondo scuro
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: 3, padding: '7px 18px', fontSize: 11, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', letterSpacing: 1, cursor: 'pointer' }}
          >
            STAMPA / SALVA PDF
          </button>
          <button
            onClick={onClose}
            style={{ background: RAISED, color: SEC, border: 'none', borderRadius: 3, padding: '7px 14px', fontSize: 15, cursor: 'pointer' }}
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
              {isSoccer ? 'YOUTH SOCCER PROJECT' : 'PERFORMANCE PLATFORM'}
            </div>
          </div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: 6, color: PRI, textTransform: 'uppercase' }}>
            Scheda Atleta
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: SEC }}>
            {today}
          </div>
        </div>

        <div style={{ padding: '18px 32px 32px' }}>

          {/* ── HERO BLOCK ─────────────────────────────────────────────── */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '16px 20px', marginBottom: 14, pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 24, color: PRI, lineHeight: 1, marginBottom: 10 }}>
                  {client.name}
                </div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Chip accent>Lv. {client.level}</Chip>
                  {rankObj && <Chip color={mode === 'bw' ? null : rankObj.color}>{rankObj.label} RANK</Chip>}
                  {categoriaLabel && <Chip>{categoriaLabel}</Chip>}
                  {ruoloLabel     && <Chip>{ruoloLabel}</Chip>}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 9, letterSpacing: 2, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: TER }}>XP</span>
                <span style={{ fontSize: 9, color: SEC }}>{client.xp ?? 0} / {client.xpNext ?? 500} XP</span>
              </div>
              <div style={{ height: 5, borderRadius: 999, background: TRACK, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, ((client.xp ?? 0) / (client.xpNext ?? 500)) * 100)}%`,
                  height: '100%', borderRadius: 999,
                  background: mode === 'bw' ? GREEN : `linear-gradient(90deg, ${GREEN}, ${CYAN})`,
                }} />
              </div>
            </div>
          </div>

          {/* ── RIGA CENTRALE ──────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '58fr 42fr', gap: 12, marginBottom: 14, pageBreakInside: 'avoid' }}>

            {/* Sinistra: Pentagon centrato + stat list — card flex per riempire l'altezza della grid */}
            {profile.hasTests && statsConfig.length > 0 && (
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
                <SectionTitle>Performance Test</SectionTitle>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Pentagon
                      stats={stats}
                      statKeys={statKeys}
                      statLabels={statLabels}
                      color={GREEN}
                      size={200}
                      gridColor={mode === 'bw' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)'}
                      labelColor={mode === 'bw' ? TER : 'rgba(255,255,255,0.5)'}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {statsConfig.map(({ stat, label }) => {
                      const val   = stats[stat] ?? 0
                      const prev  = prevStats?.[stat] ?? null
                      const delta = prev !== null ? val - prev : null
                      return (
                        <div key={stat} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ flex: 1, fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: SEC }}>
                              {label}
                            </span>
                            <span style={{ fontSize: 16, fontWeight: 900, fontFamily: 'Montserrat, sans-serif', color: PRI, lineHeight: 1 }}>
                              {val}°
                            </span>
                            <DeltaBadge delta={delta} />
                          </div>
                          <div style={{ position: 'relative', height: 7, borderRadius: 999, background: TRACK, overflow: 'hidden' }}>
                            <div style={{ width: `${val}%`, height: '100%', borderRadius: 999, background: GREEN }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Destra: Dati anagrafici + Overall Score — flex colonna, OS card si espande */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '12px 16px' }}>
                <SectionTitle>Dati Anagrafici</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <AnagrRow label="ETÀ"     value={age != null ? `${age} anni` : '—'} />
                  <AnagrRow label="SESSO"   value={client.sesso === 'M' ? 'Maschile' : client.sesso === 'F' ? 'Femminile' : '—'} />
                  <AnagrRow label="PESO"    value={client.peso    ? `${client.peso} kg`    : '—'} />
                  <AnagrRow label="ALTEZZA" value={client.altezza ? `${client.altezza} cm` : '—'} isLast />
                </div>
              </div>

              {media > 0 && (
                <div style={{ flex: 1, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <SectionTitle>Overall Score</SectionTitle>
                  <CircularGauge value={media} color={rankColor} sublabel={rankObj?.label ?? ''} />
                  {getMediaDesc(media) && (
                    <span style={{ marginTop: 8, fontSize: 8, letterSpacing: 2, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: GREEN, background: GREEN + '18', border: `1px solid ${GREEN}44`, borderRadius: 3, padding: '3px 10px', textTransform: 'uppercase' }}>
                      {getMediaDesc(media)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── STORICO CAMPIONAMENTI — tabella statica, nessuna tab interattiva ── */}
          {campionamenti.length > 0 && profile.hasTests && (
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '16px 20px', marginBottom: 14, pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <SectionTitle noMargin>Storico Campionamenti</SectionTitle>
                {trendDelta !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: RAISED, border: `1px solid ${BORDER}`, borderRadius: 4, padding: '4px 10px' }}>
                    <span style={{ fontSize: 8, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: SEC, letterSpacing: 1.5 }}>TREND</span>
                    <span style={{ fontSize: 13, fontFamily: 'Montserrat, sans-serif', fontWeight: 900,
                      color: trendDelta > 0 ? GREEN : trendDelta < 0 ? '#ef4444' : SEC }}>
                      {trendDelta > 0 ? `+${trendDelta}°` : `${trendDelta}°`}
                    </span>
                  </div>
                )}
              </div>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <Th>Data</Th>
                    <Th right>Media</Th>
                    <Th right>Rank</Th>
                    <Th right>Δ</Th>
                    {statsConfig.map(({ label }) => <Th key={label} right>{label}</Th>)}
                  </tr>
                </thead>
                <tbody>
                  {campionamenti.slice(0, 5).map((c, i, arr) => {
                    const rowRank  = c.media != null ? getRankFromMedia(c.media) : null
                    const nextC    = arr[i + 1]
                    const mediaDelta = c.media != null && nextC?.media != null
                      ? Math.round(c.media - nextC.media)
                      : null
                    return (
                      <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <Td>{c.date ?? '—'}</Td>
                        <Td right bold>{c.media != null ? `${c.media}°` : '—'}</Td>
                        <Td right bold style={{ color: mode === 'bw' ? PRI : (rowRank?.color ?? SEC) }}>{rowRank?.label ?? '—'}</Td>
                        <Td right><DeltaBadge delta={mediaDelta} compact /></Td>
                        {statsConfig.map(({ stat }) => (
                          <Td key={stat} right>{c.stats?.[stat] != null ? `${c.stats[stat]}°` : '—'}</Td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── BIA ────────────────────────────────────────────────────── */}
          {profile.hasBia && client.lastBia && (
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '16px 20px', marginBottom: 14, pageBreakInside: 'avoid' }}>
              <SectionTitle>Composizione Corporea (BIA)</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <BiaBox label="Massa grassa"     value={`${client.lastBia.fatMassPercent ?? '—'}%`} />
                <BiaBox label="Massa muscolare"  value={`${client.lastBia.muscleMassKg   ?? '—'} kg`} />
                <BiaBox label="Acqua corporea"   value={`${client.lastBia.waterPercent    ?? '—'}%`} />
                <BiaBox label="BMI"              value={client.lastBia.bmi ?? '—'} />
                <BiaBox label="Età metabolica"   value={client.lastBia.metabolicAge ? `${client.lastBia.metabolicAge} anni` : '—'} />
                <BiaBox label="Grasso viscerale" value={client.lastBia.visceralFat ?? '—'} />
                <BiaBox label="BMR"              value={client.lastBia.bmrKcal ? `${client.lastBia.bmrKcal} kcal` : '—'} />
                <BiaBox label="Massa ossea"      value={client.lastBia.boneMassKg ? `${client.lastBia.boneMassKg} kg` : '—'} />
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

// ── SVG Components ─────────────────────────────────────────────────────────────

function AvatarSvg({ color }) {
  return (
    <svg width="68" height="86" viewBox="0 0 68 86" fill="none" style={{ flexShrink: 0 }}>
      <rect width="68" height="86" rx="6" fill={color + '14'} stroke={color + '44'} strokeWidth="1.5" />
      <circle cx="34" cy="27" r="13" fill={color + '30'} stroke={color + '80'} strokeWidth="1.5" />
      <path d="M9 83 Q9 57 34 52 Q59 57 59 83" fill={color + '20'} stroke={color + '60'} strokeWidth="1.5" />
      <text x="34" y="79" textAnchor="middle" fontSize="5.5" fill={color} fontFamily="Montserrat" fontWeight="900" letterSpacing="1">RANKEX</text>
    </svg>
  )
}

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
      <text x={cx} y={cy - 4} textAnchor="middle" fill={PRI} fontSize="18" fontWeight="900" fontFamily="Montserrat">{value}°</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fill={SEC} fontSize="7" fontFamily="Montserrat" fontWeight="700" letterSpacing="1">{sublabel}</text>
    </svg>
  )
}

// ── UI micro-components ────────────────────────────────────────────────────────

function DeltaBadge({ delta, compact }) {
  const { SEC, GREEN, DANGER } = useP()
  if (delta === null) return null
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

function SectionTitle({ children, noMargin }) {
  const { GREEN, SEC } = useP()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: noMargin ? 0 : 12 }}>
      <div style={{ width: 2.5, height: 12, borderRadius: 2, background: GREEN, flexShrink: 0 }} />
      <span style={{ fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 800, color: SEC, fontFamily: 'Montserrat, sans-serif' }}>
        {children}
      </span>
    </div>
  )
}

function Chip({ children, accent, color }) {
  const { GREEN, SEC, RAISED, BORDER } = useP()
  const c = color ?? (accent ? GREEN : null)
  return (
    <span style={{
      fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
      color: c ?? SEC,
      background: c ? c + '18' : RAISED,
      border: `1px solid ${c ? c + '44' : BORDER}`,
      borderRadius: 4, padding: '2px 9px',
    }}>
      {children}
    </span>
  )
}

function AnagrRow({ label, value, isLast }) {
  const { BORDER, TER, PRI } = useP()
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: isLast ? 'none' : `1px solid ${BORDER}` }}>
      <span style={{ fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: TER }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: PRI }}>{value}</span>
    </div>
  )
}

function BiaBox({ label, value }) {
  const { RAISED, BORDER, TER, PRI } = useP()
  return (
    <div style={{ background: RAISED, border: `1px solid ${BORDER}`, borderRadius: 4, padding: '8px 10px' }}>
      <div style={{ fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: TER, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: PRI, fontFamily: 'Montserrat, sans-serif' }}>{value}</div>
    </div>
  )
}

function Th({ children, right }) {
  const { TER, BORDER } = useP()
  return (
    <th style={{ textAlign: right ? 'right' : 'left', padding: '6px 8px', color: TER, fontWeight: 700, fontSize: 8, letterSpacing: 1.5, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', borderBottom: `1px solid ${BORDER}` }}>
      {children}
    </th>
  )
}

function Td({ children, right, bold, style: extraStyle }) {
  const { SEC } = useP()
  return (
    <td style={{ textAlign: right ? 'right' : 'left', padding: '7px 8px', color: SEC, fontWeight: bold ? 700 : 400, fontSize: 11, ...extraStyle }}>
      {children}
    </td>
  )
}
