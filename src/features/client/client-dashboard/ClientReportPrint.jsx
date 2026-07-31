import { createPortal }                        from 'react-dom'
import { getStatsConfig, getCategoriaById, getRankFromMedia } from '../../../constants'
import { getProfileCategory }     from '../../../constants/bia'
import { SOCCER_AGE_GROUPS, PLAYER_ROLES } from '../../../config/modules.config'
import { calcAge }                from '../../../utils/validation'
import { Pentagon }               from '../../../components/ui/Pentagon'
import { useTheme }               from '../../../context/ThemeContext'
import {
  PALETTE, usePrintTheme, PrintThemeProvider, usePrintDocument,
  DarkModeWarning, DeltaBadge, SectionTitle, Th, CircularGauge,
} from '../../../components/common/reportPrintKit'

const isSoccerCat = (cat) => ['soccer', 'soccer_youth', 'soccer_junior'].includes(cat)

function getMediaDesc(media) {
  if (!media) return null
  if (media >= 85) return 'TOP PERFORMER'
  if (media >= 70) return 'BUON POTENZIALE'
  if (media >= 55) return 'IN CRESCITA'
  if (media >= 40) return 'BASE SOLIDA'
  return 'DA SVILUPPARE'
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
        GREEN:   theme.vars['--rx-accent']   ?? '#0ec452',
        CYAN:    theme.vars['--rx-accent-2']    ?? '#2ecfff',
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

  usePrintDocument(BG, onClose)

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
    <PrintThemeProvider value={p}>
    <div id="rankex-print-root" style={{ background: BG, position: 'fixed', inset: 0, zIndex: 9999, overflow: 'auto' }}>

      {/* Barra controlli — nascosta in stampa */}
      <div id="rankex-print-controls" style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 3, color: SEC, fontWeight: 700 }}>
            ANTEPRIMA PDF — SCHEDA ATLETA
          </span>
          {mode === 'dark' && <DarkModeWarning />}
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
          <div style={{ display: 'grid', gridTemplateColumns: profile.hasTests && statsConfig.length > 0 ? '58fr 42fr' : '1fr', gap: 12, marginBottom: 14, pageBreakInside: 'avoid' }}>

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
                    <span style={{ marginTop: 8, fontSize: 8, letterSpacing: 2, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: GREEN, background: `color-mix(in srgb, ${GREEN} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${GREEN} 27%, transparent)`, borderRadius: 3, padding: '3px 10px', textTransform: 'uppercase' }}>
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
    </PrintThemeProvider>,
    document.body
  )
}

// ── UI micro-components specifici della scheda atleta ───────────────────────────
// (CircularGauge, SectionTitle, Th, DeltaBadge sono condivisi — vedi reportPrintKit.jsx)

function Chip({ children, accent, color }) {
  const { GREEN, SEC, RAISED, BORDER } = usePrintTheme()
  const c = color ?? (accent ? GREEN : null)
  return (
    <span style={{
      fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
      color: c ?? SEC,
      background: c ? `color-mix(in srgb, ${c} 10%, transparent)` : RAISED,
      border: `1px solid ${c ? `color-mix(in srgb, ${c} 27%, transparent)` : BORDER}`,
      borderRadius: 4, padding: '2px 9px',
    }}>
      {children}
    </span>
  )
}

function AnagrRow({ label, value, isLast }) {
  const { BORDER, TER, PRI } = usePrintTheme()
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: isLast ? 'none' : `1px solid ${BORDER}` }}>
      <span style={{ fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: TER }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: PRI }}>{value}</span>
    </div>
  )
}

function BiaBox({ label, value }) {
  const { RAISED, BORDER, TER, PRI } = usePrintTheme()
  return (
    <div style={{ background: RAISED, border: `1px solid ${BORDER}`, borderRadius: 4, padding: '8px 10px' }}>
      <div style={{ fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: TER, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: PRI, fontFamily: 'Montserrat, sans-serif' }}>{value}</div>
    </div>
  )
}

function Td({ children, right, bold, style: extraStyle }) {
  const { SEC } = usePrintTheme()
  return (
    <td style={{ textAlign: right ? 'right' : 'left', padding: '7px 8px', color: SEC, fontWeight: bold ? 700 : 400, fontSize: 11, ...extraStyle }}>
      {children}
    </td>
  )
}
