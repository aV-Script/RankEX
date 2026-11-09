// Modello del PDF paziente Lipedema (STORY-040): cosa entra e in che ordine.
// Pura, senza React. Per ogni test dell'ordine ufficiale, l'ultima valutazione
// VALIDA con la sua data (anche se i test sono di giorni diversi), il delta e le
// note di comparabilità come nella tab Valutazioni. Nessun rank/percentile/XP.
import { buildTestHistory, getLatestValidByTest, COMPARISON } from '../../utils/lipedema'
import { LIPEDEMA_TESTS, LIPEDEMA_TEST_ORDER, SIDE_LABELS, getStopReasonLabel } from '../../config/lipedemaTests.config'
import { BIA_PARAMS } from '../../constants/bia'
import { formatAssessmentPrimary, formatAssessmentDelta, formatAssessmentSetup } from './assessmentRegistry'
import { getAssessmentBadges } from './assessmentBadgeRules'
import { formatComparisonNote, formatNumber } from './assessmentFormat'

export const FIRST_ASSESSMENT_TEXT = 'prima valutazione'
export const NOT_PERFORMED_TEXT    = 'Non ancora eseguito'
export const REPORT_DISCLAIMER = 'Risultati grezzi secondo protocollo, senza valori normativi né giudizio clinico. ' +
  'Dati sanitari (art. 9 GDPR): trasmettere solo con canali protetti.'

/**
 * @param {object[]} assessments — storico completo del paziente (annullate incluse)
 * @returns {Array<{
 *   testId, shortName, name,
 *   isPerformed: boolean,
 *   performedAt: string|null, examinerName: string|null,
 *   primary: string|null, delta: string|null, setup: string|null,
 *   badges: string[], notes: string[], clinical: Array<{ label, value }>,
 * }>} una riga per test in LIPEDEMA_TEST_ORDER, anche mai eseguito
 */
export function buildLipedemaReportRows(assessments) {
  const latest = getLatestValidByTest(assessments)
  return LIPEDEMA_TEST_ORDER.map(testId => {
    const test = LIPEDEMA_TESTS[testId]
    const base = { testId, shortName: test.shortName, name: test.name }
    const assessment = latest[testId]
    if (!assessment) {
      return { ...base, isPerformed: false, performedAt: null, examinerName: null, primary: null, delta: null, setup: null, badges: [], notes: [], clinical: [] }
    }
    const entry = buildTestHistory(assessments, testId).find(item => item.assessment.id === assessment.id)
    return {
      ...base,
      isPerformed:  true,
      performedAt:  assessment.performedAt,
      examinerName: assessment.examinerName ?? null,
      primary:      formatAssessmentPrimary(assessment),
      delta:        formatAssessmentDelta(entry) ?? (entry.comparison === COMPARISON.FIRST ? FIRST_ASSESSMENT_TEXT : null),
      setup:        formatAssessmentSetup(assessment),
      badges:       getAssessmentBadges(assessment, entry).map(badge => badge.label),
      notes:        formatComparisonNote(entry),
      clinical:     getClinicalLines(assessment, test),
    }
  })
}

/** Professionisti delle valutazioni mostrate, senza doppioni, nell'ordine dei test */
export function getReportExaminers(rows) {
  return [...new Set(rows.map(row => row.examinerName).filter(Boolean))]
}

/**
 * Dati sanitari facoltativi registrati (dolore, Borg, parametri fisiologici) e note
 * del test: solo ciò che è stato compilato.
 * @returns {Array<{ label: string, value: string }>}
 */
export function getClinicalLines(assessment, test) {
  const { clinical = {}, deviation = {} } = assessment
  const lines = []
  for (const row of test.clinicalRows ?? []) {
    const pre  = clinical[row.pre]
    const post = clinical[row.post]
    if (pre == null && post == null) continue
    lines.push({ label: row.label, value: `pre ${pre ?? '—'} · post ${post ?? '—'}` })
  }
  // Dolore degli altri test: HHD pre-test, OLS unico per valutazione, bilaterali massimo per lato
  if (!(test.clinicalRows ?? []).length) {
    if (clinical.painPre != null) lines.push({ label: 'Dolore pre-test (NRS)', value: String(clinical.painPre) })
    if (clinical.pain != null) lines.push({ label: 'Dolore (NRS)', value: String(clinical.pain) })
  }
  const painMax = Object.entries(clinical.painMaxBySide ?? {}).filter(([, value]) => value != null)
  if (painMax.length > 0) {
    lines.push({ label: 'Dolore massimo (NRS)', value: painMax.map(([side, value]) => `${SIDE_LABELS[side]?.short ?? side} ${value}`).join(' · ') })
  }
  if (clinical.stopReasonCode) {
    const reason = getStopReasonLabel(clinical.stopReasonCode)
    lines.push({ label: 'Motivo interruzione', value: clinical.stopReasonNote ? `${reason} · ${clinical.stopReasonNote}` : reason })
  }
  if (clinical.symptomsNote) lines.push({ label: 'Sintomi', value: clinical.symptomsNote })
  if (clinical.conditionsNote) lines.push({ label: 'Condizioni concomitanti', value: clinical.conditionsNote })
  if (deviation.present && deviation.note) lines.push({ label: 'Deviazione dal protocollo', value: deviation.note })
  if (assessment.notes) lines.push({ label: 'Note', value: assessment.notes })
  return lines
}

/**
 * Ultima BIA, se presente: solo i parametri con un valore, nessun giudizio.
 * @returns {{ date: string|null, items: Array<{ label, value }> }|null}
 */
export function buildReportBia(lastBia) {
  if (!lastBia) return null
  const items = BIA_PARAMS
    .filter(param => lastBia[param.key] != null)
    .map(param => ({ label: param.label, value: `${formatNumber(lastBia[param.key], Number.isInteger(lastBia[param.key]) ? 0 : 1)} ${param.unit}`.trim() }))
  return items.length > 0 ? { date: formatBiaDate(lastBia.date), items } : null
}

// lastBia.date lo scrive buildBiaUpdate come "09 nov" (giorno + mese breve, senza anno)
const BIA_MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']
const BIA_DATE_RE = /^(\d{1,2})\s+([a-zà]+)\.?$/i

/** "09 nov" → "09/11" (gg/mm come le date brevi del delta); un formato sconosciuto resta com'è */
export function formatBiaDate(value) {
  if (typeof value !== 'string' || !value) return null
  const match = BIA_DATE_RE.exec(value.trim())
  const month = match ? BIA_MONTHS.indexOf(match[2].toLowerCase().slice(0, 3)) : -1
  if (month === -1) return value
  return `${match[1].padStart(2, '0')}/${String(month + 1).padStart(2, '0')}`
}
