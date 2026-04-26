import { useEffect }             from 'react'
import { createPortal }           from 'react-dom'
import { getStatsConfig, getCategoriaById, getRankFromMedia } from '../../../constants'
import { getProfileCategory }     from '../../../constants/bia'
import { SOCCER_AGE_GROUPS, PLAYER_ROLES } from '../../../config/modules.config'

const isSoccerCat = (cat) => cat === 'soccer' || cat === 'soccer_youth'

/**
 * Overlay per la stampa / export PDF della scheda atleta.
 * Inietta @media print CSS per nascondere il resto dell'app durante la stampa.
 * Chiude automaticamente dopo la chiusura della finestra di stampa (afterprint).
 */
export function ClientReportPrint({ client, color, rankObj, onClose }) {
  const profile   = getProfileCategory(client.profileType ?? 'tests_only')
  const isSoccer  = isSoccerCat(client.categoria)

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

  return createPortal(
    <div id="rankex-print-root" className="fixed inset-0 z-[9999] bg-white text-black overflow-auto">

      {/* Controlli solo schermo */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => window.print()}
          style={{ background: '#0a0a0a', color: '#fff', borderRadius: 4, padding: '8px 16px', fontSize: 12, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', letterSpacing: 1, border: 'none', cursor: 'pointer' }}
        >
          STAMPA / SALVA PDF
        </button>
        <button
          onClick={onClose}
          style={{ background: '#f3f4f6', color: '#374151', borderRadius: 4, padding: '8px 12px', fontSize: 16, border: 'none', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      {/* Report */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 40px 32px', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 20, borderBottom: '2px solid #0a0a0a' }}>
          <div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 22, letterSpacing: 4, color: '#0a0a0a' }}>
              RANKEX
            </div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#9ca3af', marginTop: 2, fontFamily: 'Montserrat, sans-serif' }}>
              PERFORMANCE PLATFORM
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, letterSpacing: 1, color: '#9ca3af', textTransform: 'uppercase' }}>Scheda Atleta</div>
            <div style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>{today}</div>
          </div>
        </div>

        {/* Atleta hero */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `3px solid ${rankObj?.color ?? '#999'}`,
            background: (rankObj?.color ?? '#999') + '18',
          }}>
            <span style={{ fontSize: 26, fontWeight: 900, fontFamily: 'Montserrat, sans-serif', color: rankObj?.color ?? '#999' }}>
              {rankObj?.label ?? 'F'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Montserrat, sans-serif', color: '#0a0a0a', lineHeight: 1 }}>
              {client.name}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <Chip>Livello {client.level}</Chip>
              {categoriaLabel && <Chip accent color={color}>    {categoriaLabel}</Chip>}
              {ruoloLabel     && <Chip>{ruoloLabel}</Chip>}
              {client.media > 0 && <Chip>Media {client.media}%</Chip>}
            </div>
          </div>
        </div>

        {/* Dati anagrafici */}
        <Section title="Dati Anagrafici">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <DataPoint label="Età"     value={client.eta     ? `${client.eta} anni`    : '—'} />
            <DataPoint label="Sesso"   value={client.sesso === 'M' ? 'Maschile' : client.sesso === 'F' ? 'Femminile' : '—'} />
            <DataPoint label="Peso"    value={client.peso    ? `${client.peso} kg`     : '—'} />
            <DataPoint label="Altezza" value={client.altezza ? `${client.altezza} cm`  : '—'} />
          </div>
        </Section>

        {/* Status test */}
        {profile.hasTests && statsConfig.length > 0 && Object.keys(stats).length > 0 && (
          <Section title="Status Test">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {statsConfig.map(({ stat, label }) => {
                const val   = stats[stat]  ?? 0
                const prev  = prevStats?.[stat] ?? null
                const delta = prev !== null ? val - prev : null
                return (
                  <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 120, flexShrink: 0, fontSize: 13, color: '#6b7280' }}>{label}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#f3f4f6', overflow: 'hidden' }}>
                      <div style={{ width: `${val}%`, height: '100%', borderRadius: 999, background: color ?? '#0ec452' }} />
                    </div>
                    <span style={{ width: 36, textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#111827' }}>{val}%</span>
                    {delta !== null && (
                      <span style={{ width: 44, textAlign: 'right', fontSize: 12, fontWeight: 700, color: delta > 0 ? '#16a34a' : delta < 0 ? '#dc2626' : '#9ca3af' }}>
                        {delta > 0 ? '+' : ''}{delta}%
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </Section>
        )}

        {/* BIA */}
        {profile.hasBia && client.lastBia && (
          <Section title="Composizione Corporea (BIA)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <DataPoint label="Massa grassa"     value={`${client.lastBia.fatMassPercent ?? '—'}%`} />
              <DataPoint label="Massa muscolare"  value={`${client.lastBia.muscleMassKg   ?? '—'} kg`} />
              <DataPoint label="Acqua corporea"   value={`${client.lastBia.waterPercent    ?? '—'}%`} />
              <DataPoint label="BMI"              value={client.lastBia.bmi                ?? '—'} />
              <DataPoint label="Età metabolica"   value={client.lastBia.metabolicAge ? `${client.lastBia.metabolicAge} anni` : '—'} />
              <DataPoint label="Grasso viscerale" value={client.lastBia.visceralFat        ?? '—'} />
              <DataPoint label="BMR"              value={client.lastBia.bmrKcal ? `${client.lastBia.bmrKcal} kcal` : '—'} />
              <DataPoint label="Massa ossea"      value={client.lastBia.boneMassKg ? `${client.lastBia.boneMassKg} kg` : '—'} />
            </div>
          </Section>
        )}

        {/* Storico campionamenti */}
        {client.campionamenti?.length > 0 && profile.hasTests && (
          <Section title="Storico Campionamenti">
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <Th>Data</Th>
                  <Th right>Media</Th>
                  <Th right>Rank</Th>
                  {statsConfig.map(({ stat, label }) => <Th key={stat} right>{label}</Th>)}
                </tr>
              </thead>
              <tbody>
                {client.campionamenti.slice(0, 5).map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <Td>{c.date ?? '—'}</Td>
                    <Td right bold>{c.media != null ? `${c.media}%` : '—'}</Td>
                    <Td right bold color={color}>{c.media != null ? getRankFromMedia(c.media).label : '—'}</Td>
                    {statsConfig.map(({ stat }) => (
                      <Td key={stat} right>{c.stats?.[stat] != null ? `${c.stats[stat]}%` : '—'}</Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 16, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>Generato da RankEX Platform</span>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>{today}</span>
        </div>

      </div>
    </div>,
    document.body
  )
}

// ── Componenti locali ─────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, color: '#6b7280', fontFamily: 'Montserrat, sans-serif', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e5e7eb' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function DataPoint({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#9ca3af', fontFamily: 'Montserrat, sans-serif', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
        {value}
      </div>
    </div>
  )
}

function Chip({ children, accent, color }) {
  return (
    <span style={{
      fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
      border: `1px solid ${accent ? (color ?? '#0ec452') + '44' : '#e5e7eb'}`,
      background: accent ? (color ?? '#0ec452') + '12' : 'transparent',
      color: accent ? (color ?? '#0ec452') : '#6b7280',
      borderRadius: 3, padding: '2px 8px',
    }}>
      {children}
    </span>
  )
}

function Th({ children, right }) {
  return (
    <th style={{ textAlign: right ? 'right' : 'left', padding: '6px 4px', color: '#9ca3af', fontWeight: 500 }}>
      {children}
    </th>
  )
}

function Td({ children, right, bold, color }) {
  return (
    <td style={{ textAlign: right ? 'right' : 'left', padding: '5px 4px', color: color ?? (bold ? '#111827' : '#4b5563'), fontWeight: bold ? 700 : 400 }}>
      {children}
    </td>
  )
}
