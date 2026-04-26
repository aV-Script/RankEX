import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ALL_TESTS, getRankFromMedia } from '../../../constants/index'

export function GroupReportPrint({ group, clients, onClose }) {
  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })

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

  const sorted = [...clients]
    .filter(c => c.media != null)
    .sort((a, b) => (b.media ?? 0) - (a.media ?? 0))
  const noData = clients.filter(c => c.media == null)

  const statKeys = new Set()
  clients.forEach(c => Object.keys(c.stats ?? {}).forEach(k => statKeys.add(k)))
  const statCols = Array.from(statKeys).map(key => ({
    key,
    label: ALL_TESTS.find(t => t.stat === key)?.label ?? key,
  }))

  const champions = statCols.map(col => {
    const withData = clients.filter(c => c.stats?.[col.key] != null)
    if (!withData.length) return null
    const max     = Math.max(...withData.map(c => c.stats[col.key]))
    const winners = withData.filter(c => c.stats[col.key] === max)
    return { label: col.label, max, winners }
  }).filter(Boolean)

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

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 40px 32px', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 20, borderBottom: '2px solid #0a0a0a' }}>
          <div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 22, letterSpacing: 4, color: '#0a0a0a' }}>RANKEX</div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#9ca3af', marginTop: 2, fontFamily: 'Montserrat, sans-serif' }}>PERFORMANCE PLATFORM</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, letterSpacing: 1, color: '#9ca3af', textTransform: 'uppercase' }}>Report Gruppo</div>
            <div style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>{today}</div>
          </div>
        </div>

        {/* Gruppo hero */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 26, color: '#0a0a0a' }}>{group.name}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{clients.length} {clients.length === 1 ? 'atleta' : 'atleti'}</div>
        </div>

        {/* Classifica */}
        {sorted.length > 0 && (
          <PrintSection title="Classifica">
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <Th style={{ width: 32 }}>#</Th>
                  <Th>Atleta</Th>
                  <Th right>Rank</Th>
                  <Th right>Lv.</Th>
                  <Th right>Media</Th>
                  {statCols.map(col => <Th key={col.key} right>{col.label}</Th>)}
                </tr>
              </thead>
              <tbody>
                {sorted.map((client, i) => {
                  const rankObj = getRankFromMedia(client.media)
                  return (
                    <tr key={client.id} style={{ borderBottom: '1px solid #f9fafb', background: i === 0 ? '#fffbeb' : 'transparent' }}>
                      <Td bold color={i === 0 ? '#b45309' : i === 1 ? '#6b7280' : i === 2 ? '#92400e' : '#9ca3af'}>
                        {i + 1}
                      </Td>
                      <Td bold>{client.name}</Td>
                      <Td right bold color={rankObj?.color}>{rankObj?.label ?? '—'}</Td>
                      <Td right>{client.level ?? '—'}</Td>
                      <Td right bold>{Math.round(client.media)}°</Td>
                      {statCols.map(col => (
                        <Td key={col.key} right>
                          {client.stats?.[col.key] != null ? `${Math.round(client.stats[col.key])}°` : '—'}
                        </Td>
                      ))}
                    </tr>
                  )
                })}
                {noData.map(client => (
                  <tr key={client.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <Td color="#d1d5db">—</Td>
                    <Td color="#9ca3af">{client.name}</Td>
                    <Td right color="#d1d5db">—</Td>
                    <Td right color="#9ca3af">{client.level ?? '—'}</Td>
                    <Td right color="#d1d5db">N/D</Td>
                    {statCols.map(col => <Td key={col.key} right color="#d1d5db">—</Td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </PrintSection>
        )}

        {/* Campioni per disciplina */}
        {champions.length > 0 && (
          <PrintSection title="Campioni per disciplina">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {champions.map(({ label, max, winners }) => (
                <div key={label} style={{ border: '1px solid #fde68a', borderRadius: 4, padding: '10px 12px', background: '#fffbeb' }}>
                  <div style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#92400e', marginBottom: 4 }}>
                    🥇 {label}
                  </div>
                  {winners.map(w => (
                    <div key={w.id} style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{w.name}</div>
                  ))}
                  <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'Montserrat, sans-serif', color: '#b45309', marginTop: 4 }}>
                    {Math.round(max)}°
                  </div>
                </div>
              ))}
            </div>
          </PrintSection>
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

function PrintSection({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, color: '#6b7280', fontFamily: 'Montserrat, sans-serif', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e5e7eb' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Th({ children, right, style }) {
  return (
    <th style={{ textAlign: right ? 'right' : 'left', padding: '6px 4px', color: '#9ca3af', fontWeight: 500, ...style }}>
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
