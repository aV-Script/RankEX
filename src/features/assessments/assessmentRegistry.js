// Registro per test delle valutazioni Lipedema: form, dettaglio e formattazione
// di ogni test implementato, così storico, dettaglio, card e selettore non
// ramificano su testId. Dati e etichette in config/lipedemaTests.config.js.
// Un test nuovo = una voce qui + una in LIPEDEMA_TESTS/ORDER.
import { LIPEDEMA_TEST_IDS, BILATERAL_TESTS, getPrimaryResult } from '../../utils/lipedema'
import { LIPEDEMA_TESTS, getAssistiveDeviceLabel, getFootwearLabel, getSurfaceLabel } from '../../config/lipedemaTests.config'
import { TwoMinuteWalkForm } from './TwoMinuteWalkForm'
import { SitToStandForm }    from './SitToStandForm'
import { HandgripForm }      from './HandgripForm'
import { HhdForm }           from './HhdForm'
import { OlsForm }           from './OlsForm'
import {
  TwoMinuteWalkResultInfo, TwoMinuteWalkDetail, SitToStandResultInfo, SitToStandDetail,
  BilateralResultInfo, HandgripDetail, HhdDetail, OlsDetail,
} from './AssessmentTestDetails'
import { getLatestDominantLeg } from './bilateralFormModel'
import { createOlsForm, olsFormFromAssessment } from './olsFormModel'
import { createTwoMinuteWalkForm, formFromAssessment as twoMinuteWalkFormFromAssessment } from './twoMinuteWalkFormModel'
import { createSitToStandForm, sitToStandFormFromAssessment } from './sitToStandFormModel'
import { createHandgripForm, handgripFormFromAssessment }     from './handgripFormModel'
import { createHhdForm, hhdFormFromAssessment }               from './hhdFormModel'
import { formatNumber, formatLength, formatMonoDelta, formatBilateralDelta, formatBilateralPrimary } from './assessmentFormat'

const HANDGRIP_ID       = LIPEDEMA_TEST_IDS.HANDGRIP
const HANDGRIP_DECIMALS = BILATERAL_TESTS[HANDGRIP_ID].displayDecimals
const HANDGRIP_UNIT     = LIPEDEMA_TESTS[HANDGRIP_ID].unit
const HHD_ID            = LIPEDEMA_TEST_IDS.HHD_QUADRICEPS
const HHD_DECIMALS      = BILATERAL_TESTS[HHD_ID].displayDecimals
const HHD_UNIT          = LIPEDEMA_TESTS[HHD_ID].unit
const OLS_ID            = LIPEDEMA_TEST_IDS.ONE_LEG_STANDING
const OLS_DECIMALS      = BILATERAL_TESTS[OLS_ID].displayDecimals
const OLS_UNIT          = LIPEDEMA_TESTS[OLS_ID].unit

/**
 * Per ogni test:
 * - `Form`              — form a schermo intero ({ client, examinerName, initialForm, supersedes, previous, onSave, ... })
 * - `ResultInfo` / `Detail` — parte specifica del dettaglio
 * - `createForm(nowLocal, previous, latestByTest)` — form nuovo (previous = ultima valida dello stesso test, latestByTest = ultima valida per test: precompilazione)
 * - `formFromAssessment(assessment)` — form di Correggi
 * - `formatPrimary(assessment)` — valore principale a schermo
 * - `formatDelta(entry, sameDayDates)` — testo del delta (buildTestHistory), null se assente
 * - `formatSetup(assessment)`   — setup e versione del protocollo, in una riga (dai campi salvati)
 */
export const ASSESSMENT_UI = {
  [LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK]: {
    Form:               TwoMinuteWalkForm,
    ResultInfo:         TwoMinuteWalkResultInfo,
    Detail:             TwoMinuteWalkDetail,
    createForm:         nowLocal => createTwoMinuteWalkForm(nowLocal),
    formFromAssessment: twoMinuteWalkFormFromAssessment,
    formatPrimary:      assessment => `${formatNumber(getPrimaryResult(assessment))} m`,
    formatDelta:        (entry, sameDayDates) => formatMonoDelta(entry, 'm', 0, sameDayDates),
    formatSetup:        formatTwoMinuteWalkSetup,
  },
  [LIPEDEMA_TEST_IDS.SIT_TO_STAND_30S]: {
    Form:               SitToStandForm,
    ResultInfo:         SitToStandResultInfo,
    Detail:             SitToStandDetail,
    createForm:         nowLocal => createSitToStandForm(nowLocal),
    formFromAssessment: sitToStandFormFromAssessment,
    formatPrimary:      assessment => `${formatNumber(getPrimaryResult(assessment))} rip.`,
    formatDelta:        (entry, sameDayDates) => formatMonoDelta(entry, { singular: 'ripetizione', plural: 'ripetizioni' }, 0, sameDayDates),
    formatSetup:        formatSitToStandSetup,
  },
  [HANDGRIP_ID]: {
    Form:               HandgripForm,
    ResultInfo:         BilateralResultInfo,
    Detail:             HandgripDetail,
    createForm:         createHandgripForm,
    formFromAssessment: handgripFormFromAssessment,
    formatPrimary:      assessment => formatBilateralPrimary(assessment, HANDGRIP_UNIT, HANDGRIP_DECIMALS),
    formatDelta:        (entry, sameDayDates) => formatBilateralDelta(entry, HANDGRIP_UNIT, HANDGRIP_DECIMALS, sameDayDates),
    formatSetup:        formatHandgripSetup,
  },
  [HHD_ID]: {
    Form:               HhdForm,
    ResultInfo:         BilateralResultInfo,
    Detail:             HhdDetail,
    createForm:         (nowLocal, previous, latestByTest) => createHhdForm(nowLocal, previous, getLatestDominantLeg(latestByTest)),
    formFromAssessment: hhdFormFromAssessment,
    formatPrimary:      assessment => formatBilateralPrimary(assessment, HHD_UNIT, HHD_DECIMALS),
    formatDelta:        (entry, sameDayDates) => formatBilateralDelta(entry, HHD_UNIT, HHD_DECIMALS, sameDayDates),
    formatSetup:        formatHhdSetup,
  },
  [OLS_ID]: {
    Form:               OlsForm,
    ResultInfo:         BilateralResultInfo,
    Detail:             OlsDetail,
    createForm:         (nowLocal, previous, latestByTest) => createOlsForm(nowLocal, previous, getLatestDominantLeg(latestByTest)),
    formFromAssessment: olsFormFromAssessment,
    formatPrimary:      assessment => formatBilateralPrimary(assessment, OLS_UNIT, OLS_DECIMALS),
    formatDelta:        (entry, sameDayDates) => formatBilateralDelta(entry, OLS_UNIT, OLS_DECIMALS, sameDayDates),
    formatSetup:        formatOlsSetup,
  },
}

/** Valore principale; il testId senza voce (dato futuro o corrotto) non rompe la vista */
export function formatAssessmentPrimary(assessment) {
  return ASSESSMENT_UI[assessment?.testId]?.formatPrimary(assessment) ?? '—'
}

export function formatAssessmentDelta(entry, sameDayDates) {
  return ASSESSMENT_UI[entry?.assessment?.testId]?.formatDelta(entry, sameDayDates) ?? null
}

/** Setup e protocollo in una riga; vuoto per un testId senza voce */
export function formatAssessmentSetup(assessment) {
  return ASSESSMENT_UI[assessment?.testId]?.formatSetup(assessment) ?? ''
}

// ── Setup per test (ADR-019 §2) ───────────────────────────────────────────────

const FIXATION_SHORT_LABELS = { belt: 'cinghia', manual: 'manuale' }

function joinSetup(parts, assessment) {
  return [...parts, `protocollo ${assessment.protocolVersion}`].join(' · ')
}

function formatTwoMinuteWalkSetup(assessment) {
  const { setup = {} } = assessment
  const assistive = setup.assistiveDevice === 'none'
    ? 'nessun ausilio'
    : `ausilio ${(setup.assistiveDeviceNote ?? getAssistiveDeviceLabel(setup.assistiveDevice)).toLowerCase()}`
  return joinSetup([`percorso ${formatLength(setup.courseLengthM)} m`, assistive], assessment)
}

function formatSitToStandSetup(assessment) {
  const { setup = {} } = assessment
  return joinSetup([
    `sedia ${formatLength(setup.chairHeightCm)} cm`,
    setup.chairHasArmrests ? 'con braccioli' : 'senza braccioli',
    setup.armsCrossed ? 'braccia incrociate' : 'braccia non incrociate',
  ], assessment)
}

function formatHandgripSetup(assessment) {
  const { device = {}, gripSetting } = assessment.setup ?? {}
  return joinSetup([`${device.brand} ${device.model}`, `impugnatura ${gripSetting}`], assessment)
}

function formatHhdSetup(assessment) {
  const { device = {}, fixationMethod, kneeAngleDeg, hipAngleDeg } = assessment.setup ?? {}
  return joinSetup([
    `${device.brand} ${device.model}`,
    FIXATION_SHORT_LABELS[fixationMethod] ?? fixationMethod,
    `ginocchio ${kneeAngleDeg}°`,
    `anca ${hipAngleDeg}°`,
  ], assessment)
}

function formatOlsSetup(assessment) {
  const { footwear, surface, surfaceNote } = assessment.setup ?? {}
  return joinSetup([
    getFootwearLabel(footwear).toLowerCase(),
    surfaceNote ?? getSurfaceLabel(surface).toLowerCase(),
  ], assessment)
}
