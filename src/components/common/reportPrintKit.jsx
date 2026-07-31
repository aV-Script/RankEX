import { createContext, useContext, useEffect } from 'react'

/**
 * Kit condiviso tra ClientReportPrint.jsx e GroupReportPrint.jsx — prima
 * ciascuno ridichiarava la stessa palette, lo stesso context, lo stesso
 * useEffect di stampa e gli stessi micro-componenti (CircularGauge,
 * SectionTitle, Th, DeltaBadge) con piccole derive senza motivo (es. offset
 * testo del CircularGauge 1-2px diversi, avviso dark-mode presente solo nel
 * report cliente, `tr { break-inside: avoid }` presente solo nel report
 * gruppo) — P3.7.
 */

export const PALETTE = {
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

const PrintCtx = createContext(null)
export const usePrintTheme    = () => useContext(PrintCtx)
export const PrintThemeProvider = PrintCtx.Provider

/**
 * Inietta il CSS @media print e avvia window.print() al mount/unmount.
 * `tr { break-inside: avoid }` evita che le righe delle tabelle (storico
 * campionamenti, classifica gruppo) si spezzino a metà tra una pagina e l'altra.
 */
export function usePrintDocument(BG, onClose) {
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
        tr { break-inside: avoid; }
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
}

export function DarkModeWarning() {
  return (
    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#f59e0b' }}>
      ⚠ Nel dialogo di stampa attiva <strong>Grafici di sfondo</strong> per preservare lo sfondo scuro
    </span>
  )
}

export function DeltaBadge({ delta, compact }) {
  const { SEC, GREEN, DANGER } = usePrintTheme()
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
      background: `color-mix(in srgb, ${c} 10%, transparent)`,
      border: `1px solid color-mix(in srgb, ${c} 27%, transparent)`,
      borderRadius: 3,
      padding: compact ? '1px 4px' : '2px 7px',
      whiteSpace: 'nowrap',
    }}>
      {positive ? '↑' : '↓'} {positive ? `+${delta}°` : `${delta}°`}
    </span>
  )
}

export function SectionTitle({ children, noMargin }) {
  const { GREEN, SEC } = usePrintTheme()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: noMargin ? 0 : 12 }}>
      <div style={{ width: 2.5, height: 12, borderRadius: 2, background: GREEN, flexShrink: 0 }} />
      <span style={{ fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 800, color: SEC, fontFamily: 'Montserrat, sans-serif' }}>
        {children}
      </span>
    </div>
  )
}

export function Th({ children, right, style: extraStyle }) {
  const { TER, BORDER } = usePrintTheme()
  return (
    <th style={{ textAlign: right ? 'right' : 'left', padding: '6px 8px', color: TER, fontWeight: 700, fontSize: 8, letterSpacing: 1.5, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', borderBottom: `1px solid ${BORDER}`, ...extraStyle }}>
      {children}
    </th>
  )
}

export function CircularGauge({ value, color, sublabel }) {
  const { PRI, SEC, BORDER } = usePrintTheme()
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
