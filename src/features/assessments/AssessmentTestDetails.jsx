import { ASSESSMENT_OUTCOME, BILATERAL_SIDE_STATUS, BILATERAL_TESTS } from '../../utils/lipedema'
import {
  getAssistiveDeviceLabel, getStopReasonLabel, getInvalidTrialReasonLabel, getDominantSideLabel, SIDE_LABELS,
} from '../../config/lipedemaTests.config'
import { Badge } from '../../components/ui'
import { DetailSection, Row } from './AssessmentDetailParts'
import { formatNumber, formatLength } from './assessmentFormat'

// Dettaglio di una valutazione, parte specifica del test: riga sotto il
// risultato (`ResultInfo`) e sezioni prova grezza / setup / pause (`Detail`).
// Collegate al test dal registro (assessmentRegistry.js).

const NATIVE_DECIMALS   = 1   // kgf letto, 1 decimale (ADR-016 §4)
const SYMMETRY_DECIMALS = 1

// ── 2MWT ──────────────────────────────────────────────────────────────────────

export function TwoMinuteWalkResultInfo({ assessment }) {
  const { events = {}, result = {} } = assessment
  const isStopped = assessment.outcome === ASSESSMENT_OUTCOME.STOPPED_EARLY
  return (
    <span>
      {isStopped ? `Interrotta a ${events.stopTimeS} s` : `Durata ${result.durationS} s`} · velocità media {formatNumber(result.avgSpeedMs, 2)} m/s
    </span>
  )
}

export function TwoMinuteWalkDetail({ assessment, test }) {
  const { setup = {}, events = {}, clinical = {}, result = {} } = assessment
  const trial     = assessment.trials?.[0] ?? {}
  const isStopped = assessment.outcome === ASSESSMENT_OUTCOME.STOPPED_EARLY
  return (
    <>
      <DetailSection title="Prova grezza">
        <Row label={`Tratti completi${isStopped ? " fino all'interruzione" : ''}`} value={trial.fullLengths} />
        <Row label="Frazione finale" value={`${formatNumber(trial.partialDistanceM, 1)} m`} />
        <Row label="Formula" value={`${trial.fullLengths} × ${formatLength(setup.courseLengthM)} m + ${formatNumber(trial.partialDistanceM, 1)} m = ${formatNumber(result.distanceM)} m (arrotondato al metro)`} />
      </DetailSection>

      <DetailSection title="Setup">
        <Row label="Protocollo" value={`${test.shortName} · ${assessment.protocolVersion}`} />
        <Row label="Lunghezza percorso" value={`${formatLength(setup.courseLengthM)} m${setup.isStandardCourse === false ? ' (variante)' : ''}`} />
        <Row label="Ausilio" value={`${getAssistiveDeviceLabel(setup.assistiveDevice)}${setup.assistiveDeviceNote ? ` — ${setup.assistiveDeviceNote}` : ''}`} />
        {isStopped && <StopReasonRow clinical={clinical} />}
      </DetailSection>

      <PausesSection events={events} />
    </>
  )
}

// ── 30s-STS ───────────────────────────────────────────────────────────────────

export function SitToStandResultInfo({ assessment }) {
  const { events = {}, result = {} } = assessment
  if (assessment.outcome === ASSESSMENT_OUTCOME.INVALIDATED) {
    return <span>Invalidato per uso delle braccia: 0 per regola, nessun confronto con la valutazione precedente né con la successiva</span>
  }
  if (assessment.outcome === ASSESSMENT_OUTCOME.STOPPED_EARLY) return <span>Interrotta a {events.stopTimeS} s</span>
  return <span>Durata {result.durationS} s</span>
}

export function SitToStandDetail({ assessment, test }) {
  const { setup = {}, events = {}, clinical = {}, result = {} } = assessment
  const trial       = assessment.trials?.[0] ?? {}
  const isStopped   = assessment.outcome === ASSESSMENT_OUTCOME.STOPPED_EARLY
  const hasComplete = trial.completeRepetitions !== null && trial.completeRepetitions !== undefined
  return (
    <>
      <DetailSection title="Prova grezza">
        <Row label="Uso delle braccia" value={events.usedArms ? `Sì${events.usedArmsNote ? ` — ${events.usedArmsNote}` : ''}` : 'No'} />
        <Row label={`Alzate complete${isStopped ? " fino all'interruzione" : ''}`} value={hasComplete ? trial.completeRepetitions : '—'} />
        {!events.usedArms && (
          <>
            <Row label="Parziale finale" value={trial.partialRepCounted ? 'Sì, contata' : 'No'} />
            <Row label="Totale" value={`${trial.completeRepetitions} + ${trial.partialRepCounted ? 1 : 0} = ${result.repetitions}`} />
          </>
        )}
        <Row label="Errore tecnico" value={events.technicalError ? `Sì — ${events.technicalErrorNote}` : 'No'} />
        <Row label="Familiarizzazione" value={events.familiarizationDone ? 'Eseguita (non conteggiata)' : 'Non eseguita'} />
      </DetailSection>

      <DetailSection title="Setup">
        <Row label="Protocollo" value={`${test.shortName} · ${assessment.protocolVersion}`} />
        <Row label="Altezza sedia" value={`${formatLength(setup.chairHeightCm)} cm${setup.isStandardChair === false ? ' (variante)' : ''}`} />
        <Row label="Braccioli" value={setup.chairHasArmrests ? 'Sì (fuori protocollo)' : 'No'} />
        <Row label="Braccia incrociate" value={setup.armsCrossed ? 'Sì' : 'No (fuori protocollo)'} />
        {isStopped && <StopReasonRow clinical={clinical} />}
      </DetailSection>

      <PausesSection events={events} />
    </>
  )
}

// ── Bilaterali (Handgrip; HHD e OLS nel #13) ─────────────────────────────────

export function BilateralResultInfo({ assessment }) {
  const { result = {} } = assessment
  if (result.strongestValue === null || result.strongestValue === undefined) {
    return <span>{assessment.outcome === ASSESSMENT_OUTCOME.STOPPED_EARLY ? 'Interrotta' : 'Incompleta'}: best solo per i lati con tutte le prove valide</span>
  }
  return (
    <span>
      Più forte: {result.strongestSide ? SIDE_LABELS[result.strongestSide].label : 'pari'} · Simmetria {formatNumber(result.symmetryPct, SYMMETRY_DECIMALS)} %
    </span>
  )
}

/**
 * Tabella cronologica delle prove (Prova | Lato | Letto | canonico | Esito) +
 * best per lato: un solo renderer per i test bilaterali (ADR-016 §2).
 */
export function BilateralTrialsDetail({ assessment }) {
  const { result = {}, clinical = {} } = assessment
  const { spec, displayDecimals } = BILATERAL_TESTS[assessment.testId]
  const trials   = assessment.trials ?? []
  const unit     = result.unit ?? spec.canonicalUnit
  const bestSeqs = new Set(spec.sides.map(side => trials.find(trial =>
    trial.side === side && trial.valid && result.bestBySide?.[side] !== null && trial.value === result.bestBySide?.[side])?.seq))

  return (
    <DetailSection title="Prove">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="font-display text-[10px] tracking-[2px]">
              <th className="font-normal py-1 pr-2">PROVA</th>
              <th className="font-normal py-1 pr-2">LATO</th>
              <th className="font-normal py-1 pr-2">LETTO</th>
              <th className="font-normal py-1 pr-2">{unit}</th>
              <th className="font-normal py-1">ESITO</th>
            </tr>
          </thead>
          <tbody>
            {trials.map(trial => (
              <tr key={trial.seq} style={{ borderTop: '1px solid var(--rx-border)', opacity: trial.valid ? 1 : 0.6 }}>
                <td className="py-1.5 pr-2">{trial.seq}</td>
                <td className="py-1.5 pr-2">{SIDE_LABELS[trial.side]?.short ?? trial.side}</td>
                <td className="py-1.5 pr-2 text-white/80">
                  {trial.nativeValue === null ? '—' : `${formatNumber(trial.nativeValue, trial.nativeUnit === unit ? displayDecimals : NATIVE_DECIMALS)} ${trial.nativeUnit}`}
                </td>
                <td className="py-1.5 pr-2 text-white/80">{formatNumber(trial.value, displayDecimals)}</td>
                <td className="py-1.5">
                  {trial.valid
                    ? (bestSeqs.has(trial.seq) ? <Badge color="var(--rx-accent)">MIGLIORE</Badge> : 'Valida')
                    : `Non valida — ${getInvalidTrialReasonLabel(trial.invalidReason)}`}
                  {trial.pain !== null && trial.pain !== undefined ? ` · dolore ${trial.pain}` : ''}
                  {trial.note ? ` · ${trial.note}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {spec.sides.map(side => (
        <Row
          key={side}
          label={`Best ${SIDE_LABELS[side].label}`}
          value={describeSide(result, side, spec, unit, displayDecimals)}
        />
      ))}
      <Row label="Più forte" value={result.strongestValue === null ? '—' : (result.strongestSide ? SIDE_LABELS[result.strongestSide].label : 'pari')} />
      <Row label="Simmetria" value={result.symmetryPct === null ? '—' : `${formatNumber(result.symmetryPct, SYMMETRY_DECIMALS)} %`} />
      {spec.sides.some(side => clinical.painMaxBySide?.[side] != null) && (
        <Row
          label="Dolore massimo (NRS)"
          value={spec.sides.map(side => `${SIDE_LABELS[side].short} ${clinical.painMaxBySide?.[side] ?? '—'}`).join(' · ')}
        />
      )}
    </DetailSection>
  )
}

export function HandgripDetail({ assessment, test }) {
  const { setup = {}, clinical = {} } = assessment
  const device = setup.device ?? {}
  return (
    <>
      <BilateralTrialsDetail assessment={assessment} />
      <DetailSection title="Setup">
        <Row label="Protocollo" value={`${test.shortName} · ${assessment.protocolVersion}`} />
        <Row label="Dinamometro" value={`${device.brand} ${device.model}${device.serial ? ` · seriale ${device.serial}` : ''}`} />
        <Row label="Impugnatura" value={setup.gripSetting} />
        <Row label="Mano dominante" value={getDominantSideLabel(setup.dominantSide)} />
        <Row label="Unità dello strumento" value={setup.nativeUnit} />
        {assessment.outcome === ASSESSMENT_OUTCOME.STOPPED_EARLY && <StopReasonRow clinical={clinical} />}
      </DetailSection>
    </>
  )
}

// ── Componenti locali ─────────────────────────────────────────────────────────

function StopReasonRow({ clinical }) {
  return (
    <Row
      label="Motivo dell'interruzione"
      value={`${getStopReasonLabel(clinical.stopReasonCode)}${clinical.stopReasonNote ? ` — ${clinical.stopReasonNote}` : ''}`}
    />
  )
}

function PausesSection({ events }) {
  return (
    <DetailSection title="Pause">
      <Row label="Numero" value={events.pauseCount ?? 0} />
      {events.pauseCount > 0 && <Row label="Durata totale" value={`${events.pauseDurationS} s`} />}
    </DetailSection>
  )
}

// ── Funzioni helper pure ──────────────────────────────────────────────────────

function describeSide(result, side, spec, unit, decimals) {
  const status = result.sideStatus?.[side]
  const count  = `${result.validCountBySide?.[side] ?? 0}/${spec.validTrialsPerSide} valide`
  if (status === BILATERAL_SIDE_STATUS.COMPLETE) return `${formatNumber(result.bestBySide[side], decimals)} ${unit}`
  if (status === BILATERAL_SIDE_STATUS.NOT_TESTED) return '— · non eseguita'
  return `— · incompleta (${count})`
}
