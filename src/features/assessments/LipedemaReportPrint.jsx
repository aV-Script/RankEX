import { createPortal } from 'react-dom'
import { calcAge } from '../../utils/validation'
import {
  PALETTE, PrintThemeProvider, usePrintDocument, SectionTitle, Th,
} from '../../components/common/reportPrintKit'
import { formatDate } from './assessmentFormat'
import {
  buildLipedemaReportRows, buildReportBia, getReportExaminers, NOT_PERFORMED_TEXT, REPORT_DISCLAIMER,
} from './lipedemaReportModel'

const PALETTE_PRINT = { ...PALETTE.bw, CYAN: '#2ecfff', mode: 'bw' }
// Margine verticale A4: le pagine dopo la prima non partono dal bordo del foglio (BUG-020)
const PRINT_PAGE_MARGIN = '12mm 0'

/**
 * PDF del paziente del modulo Lipedema (STORY-040), stessa tecnica di
 * ClientReportPrint (window.print) ma solo tabelle, su fondo bianco: ultima
 * valutazione valida per test con la sua data, delta e note di comparabilità
 * come nella UI, dati sanitari facoltativi, BIA se presente. Nessun rank,
 * percentile, XP né badge di gamification. Esportabile da ogni ruolo che vede il paziente.
 * @param {object}   props.client
 * @param {object[]} props.assessments — storico completo
 * @param {object}   props.terminology
 */
export function LipedemaReportPrint({ client, assessments, terminology, onClose }) {
  const p = PALETTE_PRINT
  const { BG, SURFACE, RAISED, BORDER, PRI, SEC, TER, GREEN } = p
  usePrintDocument(BG, onClose, { pageMargin: PRINT_PAGE_MARGIN })

  const rows      = buildLipedemaReportRows(assessments)
  const examiners = getReportExaminers(rows)
  const bia       = buildReportBia(client.lastBia)
  const age       = calcAge(client.dataNascita) ?? client.eta
  const today     = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
  const notice    = client.privacyNotice
  const sexLabel  = client.sesso === 'M' ? 'Maschile' : client.sesso === 'F' ? 'Femminile' : null
  const title     = `${terminology.assessments} funzionali`

  return createPortal(
    <PrintThemeProvider value={p}>
      <div id="rankex-print-root" style={{ background: BG, position: 'fixed', inset: 0, zIndex: 9999, overflow: 'auto' }}>

        <div id="rankex-print-controls" style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, letterSpacing: 3, color: SEC, fontWeight: 700 }}>
            ANTEPRIMA PDF — {title.toUpperCase()}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => window.print()}
              style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: 3, padding: '7px 18px', fontSize: 11, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', letterSpacing: 1, cursor: 'pointer' }}
            >
              STAMPA / SALVA PDF
            </button>
            <button
              onClick={onClose}
              aria-label="Chiudi anteprima"
              style={{ background: RAISED, color: SEC, border: 'none', borderRadius: 3, padding: '7px 14px', fontSize: 15, cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 794, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', background: BG, color: PRI, minHeight: '100vh', padding: '24px 44px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `2px solid ${GREEN}`, paddingBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 13, letterSpacing: 2 }}>RANKEX</span>
              <h1 style={{ margin: 0, fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 22 }}>{client.name} · {title.toLowerCase()}</h1>
            </div>
            <span style={{ fontSize: 12, color: SEC }}>{today}</span>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 12 }}>
            <Info label="Età" value={age != null ? `${age} anni` : null} />
            <Info label="Sesso" value={sexLabel} />
            <Info label="Peso" value={client.peso ? `${client.peso} kg` : null} />
            <Info label="Altezza" value={client.altezza ? `${client.altezza} cm` : null} />
            <Info label={examiners.length > 1 ? 'Professionisti' : 'Professionista'} value={examiners.join(', ') || null} />
            <Info label="Informativa" value={notice ? `${notice.informativaVersion} · ${formatDate(notice.deliveredAt)}` : null} />
          </div>

          <section>
            <SectionTitle>Ultima {terminology.assessment.toLowerCase()} per test</SectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <Th>Test</Th><Th>Data</Th><Th>Risultato</Th><Th>Delta</Th><Th>Condizioni</Th>
                </tr>
              </thead>
              {rows.map(row => <ReportRow key={row.testId} row={row} />)}
            </table>
          </section>

          {bia && (
            <section style={{ breakInside: 'avoid' }}>
              <SectionTitle>BIA{bia.date ? ` · ${bia.date}` : ''}</SectionTitle>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <tbody>
                  {bia.items.map(item => (
                    <tr key={item.label}>
                      <td style={{ padding: '5px 8px', borderBottom: `1px solid ${BORDER}`, color: SEC }}>{item.label}</td>
                      <td style={{ padding: '5px 8px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <p style={{ margin: 'auto 0 0', fontSize: 10, color: TER, lineHeight: 1.5 }}>{REPORT_DISCLAIMER}</p>
        </div>
      </div>
    </PrintThemeProvider>,
    document.body,
  )
}

// ── Componenti locali ─────────────────────────────────────────────────────────

function Info({ label, value }) {
  if (!value) return null
  return <div><strong>{label}</strong> {value}</div>
}

function ReportRow({ row }) {
  const border = `1px solid ${PALETTE_PRINT.BORDER}`
  const cell   = { padding: '6px 8px', borderBottom: border, verticalAlign: 'top' }
  const hasDetails = row.badges.length > 0 || row.notes.length > 0 || row.clinical.length > 0
  // Un tbody per test: riga e dettagli (note, dati sanitari) restano sulla stessa pagina
  return (
    <tbody style={{ breakInside: 'avoid' }}>
      <tr>
        <td style={{ ...cell, fontWeight: 700, borderBottom: hasDetails ? 'none' : border }}>{row.shortName}<br /><span style={{ fontWeight: 400, color: PALETTE_PRINT.SEC }}>{row.name}</span></td>
        {row.isPerformed ? (
          <>
            <td style={{ ...cell, borderBottom: hasDetails ? 'none' : border }}>{formatDate(row.performedAt)}</td>
            <td style={{ ...cell, fontWeight: 700, borderBottom: hasDetails ? 'none' : border }}>{row.primary}</td>
            <td style={{ ...cell, borderBottom: hasDetails ? 'none' : border }}>{row.delta ?? '—'}</td>
            <td style={{ ...cell, borderBottom: hasDetails ? 'none' : border }}>{row.setup}</td>
          </>
        ) : (
          <td colSpan={4} style={{ ...cell, color: PALETTE_PRINT.SEC }}>{NOT_PERFORMED_TEXT}</td>
        )}
      </tr>
      {hasDetails && (
        <tr>
          <td colSpan={5} style={{ ...cell, paddingTop: 0, fontSize: 10, color: PALETTE_PRINT.SEC, lineHeight: 1.5 }}>
            {row.badges.length > 0 && <div>{row.badges.join(' · ')}</div>}
            {row.notes.map(note => <div key={note}>{note}</div>)}
            {row.clinical.map(line => <div key={line.label}>{line.label}: {line.value}</div>)}
          </td>
        </tr>
      )}
    </tbody>
  )
}
