import { useEffect }             from 'react'
import { createPortal }           from 'react-dom'
import { getStatsConfig, getCategoriaById, getRankFromMedia } from '../../../constants'
import { getProfileCategory }     from '../../../constants/bia'
import { SOCCER_AGE_GROUPS, PLAYER_ROLES } from '../../../config/modules.config'
import { calcAge }                         from '../../../utils/validation'

const isSoccerCat = (cat) => cat === 'soccer' || cat === 'soccer_youth' || cat === 'soccer_junior'

export function ClientReportPrint({ client, color, rankObj, onClose }) {
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
        body > *:not(#rankex-print-root) { display: none !important; }
        #rankex-print-root {
          position: static !important;
          display: block !important;
          width: 100% !important;
          overflow: visible !important;
        }
        #rankex-print-controls { display: none !important; }
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

  const stats       = client.stats ?? {}
  const prevStats   = client.campionamenti?.[1]?.stats ?? null
  const statsConfig = profile.hasTests ? getStatsConfig(client.categoria) : []
  const today       = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
  const age         = calcAge(client.dataNascita)

  return createPortal(
    <div id="rankex-print-root" style={{ background: '#fff', position: 'fixed', inset: 0, zIndex: 9999, overflow: 'auto' }}>

      {/* Barra controlli — nascosta in stampa via CSS iniettato */}
      <div id="rankex-print-controls" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 3, color: '#94a3b8', fontWeight: 700 }}>
          ANTEPRIMA PDF — SCHEDA ATLETA
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{ background: '#0ec452', color: '#fff', border: 'none', borderRadius: 3, padding: '7px 18px', fontSize: 11, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', letterSpacing: 1, cursor: 'pointer' }}
          >
            STAMPA / SALVA PDF
          </button>
          <button
            onClick={onClose}
            style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 3, padding: '7px 14px', fontSize: 15, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Documento */}
      <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Testata */}
        <div style={{ padding: '24px 40px 20px', borderBottom: '2px solid #0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 24, letterSpacing: 5, color: '#0f172a', lineHeight: 1 }}>
              RANK<span style={{ color: '#0ec452' }}>EX</span>
            </div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: '#94a3b8', marginTop: 5, fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
              PERFORMANCE PLATFORM
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
              Scheda Atleta
            </div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{today}</div>
          </div>
        </div>

        {/* Corpo */}
        <div style={{ padding: '32px 40px 48px' }}>

          {/* Hero atleta */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 36 }}>
            <div>
              <div style={{ fontSize: 30, fontWeight: 900, fontFamily: 'Montserrat, sans-serif', color: '#0f172a', lineHeight: 1, marginBottom: 14 }}>
                {client.name}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Pill>Lv.{client.level}</Pill>
                {rankObj     && <Pill green color={rankObj.color}>{rankObj.label}</Pill>}
                {client.media > 0 && <Pill>Media {Math.round(client.media)}°</Pill>}
                {categoriaLabel && <Pill>{categoriaLabel}</Pill>}
                {ruoloLabel  && <Pill>{ruoloLabel}</Pill>}
              </div>
            </div>
            {rankObj && (
              <div style={{
                flexShrink: 0, width: 68, height: 68, borderRadius: 6,
                background: rankObj.color + '14', border: `2px solid ${rankObj.color}44`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              }}>
                <div style={{ fontSize: 13, fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: rankObj.color }}>{rankObj.label}</div>
                <div style={{ fontSize: 8, color: '#94a3b8', letterSpacing: 1, fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>RANK</div>
              </div>
            )}
          </div>

          {/* Dati anagrafici */}
          <DocSection title="Dati Anagrafici">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <DataBox label="Età"     value={age != null ? `${age} anni` : '—'} />
              <DataBox label="Sesso"   value={client.sesso === 'M' ? 'Maschile' : client.sesso === 'F' ? 'Femminile' : '—'} />
              <DataBox label="Peso"    value={client.peso    ? `${client.peso} kg`    : '—'} />
              <DataBox label="Altezza" value={client.altezza ? `${client.altezza} cm` : '—'} />
            </div>
          </DocSection>

          {/* Performance test */}
          {profile.hasTests && statsConfig.length > 0 && Object.keys(stats).length > 0 && (
            <DocSection title="Performance Test">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {statsConfig.map(({ stat, label }) => {
                  const val   = stats[stat]  ?? 0
                  const prev  = prevStats?.[stat] ?? null
                  const delta = prev !== null ? val - prev : null
                  return (
                    <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 128, flexShrink: 0, fontSize: 12, color: '#475569' }}>{label}</span>
                      <div style={{ flex: 1, height: 7, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                        <div style={{ width: `${val}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #0ec452, #00c8ff)' }} />
                      </div>
                      <span style={{ width: 40, textAlign: 'right', fontSize: 14, fontWeight: 800, fontFamily: 'Montserrat, sans-serif', color: '#0f172a' }}>
                        {val}°
                      </span>
                      <span style={{ width: 44, textAlign: 'right', fontSize: 11, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
                        color: delta == null ? 'transparent' : delta > 0 ? '#0ec452' : delta < 0 ? '#ef4444' : '#94a3b8' }}>
                        {delta != null ? (delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '=') : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </DocSection>
          )}

          {/* BIA */}
          {profile.hasBia && client.lastBia && (
            <DocSection title="Composizione Corporea (BIA)">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <DataBox label="Massa grassa"     value={`${client.lastBia.fatMassPercent ?? '—'}%`} />
                <DataBox label="Massa muscolare"  value={`${client.lastBia.muscleMassKg   ?? '—'} kg`} />
                <DataBox label="Acqua corporea"   value={`${client.lastBia.waterPercent    ?? '—'}%`} />
                <DataBox label="BMI"              value={client.lastBia.bmi                ?? '—'} />
                <DataBox label="Età metabolica"   value={client.lastBia.metabolicAge ? `${client.lastBia.metabolicAge} anni` : '—'} />
                <DataBox label="Grasso viscerale" value={client.lastBia.visceralFat        ?? '—'} />
                <DataBox label="BMR"              value={client.lastBia.bmrKcal ? `${client.lastBia.bmrKcal} kcal` : '—'} />
                <DataBox label="Massa ossea"      value={client.lastBia.boneMassKg ? `${client.lastBia.boneMassKg} kg` : '—'} />
              </div>
            </DocSection>
          )}

          {/* Storico campionamenti */}
          {client.campionamenti?.length > 0 && profile.hasTests && (
            <DocSection title="Storico Campionamenti">
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <Th>Data</Th>
                    <Th right>Media</Th>
                    <Th right>Rank</Th>
                    {statsConfig.map(({ stat, label }) => <Th key={stat} right>{label}</Th>)}
                  </tr>
                </thead>
                <tbody>
                  {client.campionamenti.slice(0, 5).map((c, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <Td>{c.date ?? '—'}</Td>
                      <Td right bold>{c.media != null ? `${c.media}°` : '—'}</Td>
                      <Td right bold color="#0ec452">{c.media != null ? getRankFromMedia(c.media).label : '—'}</Td>
                      {statsConfig.map(({ stat }) => (
                        <Td key={stat} right>{c.stats?.[stat] != null ? `${c.stats[stat]}°` : '—'}</Td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </DocSection>
          )}

          {/* Footer */}
          <div style={{ marginTop: 48, paddingTop: 14, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'Montserrat, sans-serif', letterSpacing: 1, fontWeight: 600 }}>
              GENERATO DA RANKEX PLATFORM
            </span>
            <span style={{ fontSize: 9, color: '#94a3b8' }}>{today}</span>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Componenti locali ─────────────────────────────────────────────────────────

function DocSection({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: '#0ec452', flexShrink: 0 }} />
        <span style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 800, color: '#475569', fontFamily: 'Montserrat, sans-serif' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function DataBox({ label, value }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '10px 12px' }}>
      <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#94a3b8', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', fontFamily: 'Montserrat, sans-serif' }}>
        {value}
      </div>
    </div>
  )
}

function Pill({ children, green, color }) {
  const c = green ? (color ?? '#0ec452') : null
  return (
    <span style={{
      fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, letterSpacing: 0.5,
      border: `1px solid ${c ? c + '44' : '#e2e8f0'}`,
      background: c ? c + '12' : '#f8fafc',
      color: c ?? '#475569',
      borderRadius: 3, padding: '3px 10px',
    }}>
      {children}
    </span>
  )
}

function Th({ children, right }) {
  return (
    <th style={{ textAlign: right ? 'right' : 'left', padding: '8px 6px', color: '#64748b', fontWeight: 700, fontSize: 10, letterSpacing: 1, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>
      {children}
    </th>
  )
}

function Td({ children, right, bold, color }) {
  return (
    <td style={{ textAlign: right ? 'right' : 'left', padding: '7px 6px', color: color ?? (bold ? '#0f172a' : '#475569'), fontWeight: bold ? 700 : 400, borderBottom: '1px solid #f1f5f9' }}>
      {children}
    </td>
  )
}
