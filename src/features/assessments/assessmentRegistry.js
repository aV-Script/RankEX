// Registro per test delle valutazioni Lipedema: form, dettaglio e formattazione
// di ogni test implementato, così storico, dettaglio, card e selettore non
// ramificano su testId. Dati e etichette in config/lipedemaTests.config.js.
// Un test nuovo (HHD, OLS) = una voce qui + una in LIPEDEMA_TESTS/ORDER.
import { LIPEDEMA_TEST_IDS, BILATERAL_TESTS, getPrimaryResult } from '../../utils/lipedema'
import { LIPEDEMA_TESTS } from '../../config/lipedemaTests.config'
import { TwoMinuteWalkForm } from './TwoMinuteWalkForm'
import { SitToStandForm }    from './SitToStandForm'
import { HandgripForm }      from './HandgripForm'
import {
  TwoMinuteWalkResultInfo, TwoMinuteWalkDetail, SitToStandResultInfo, SitToStandDetail,
  BilateralResultInfo, HandgripDetail,
} from './AssessmentTestDetails'
import { createTwoMinuteWalkForm, formFromAssessment as twoMinuteWalkFormFromAssessment } from './twoMinuteWalkFormModel'
import { createSitToStandForm, sitToStandFormFromAssessment } from './sitToStandFormModel'
import { createHandgripForm, handgripFormFromAssessment }     from './handgripFormModel'
import { formatNumber, formatMonoDelta, formatBilateralDelta, formatBilateralPrimary } from './assessmentFormat'

const HANDGRIP_ID       = LIPEDEMA_TEST_IDS.HANDGRIP
const HANDGRIP_DECIMALS = BILATERAL_TESTS[HANDGRIP_ID].displayDecimals
const HANDGRIP_UNIT     = LIPEDEMA_TESTS[HANDGRIP_ID].unit

/**
 * Per ogni test:
 * - `Form`              — form a schermo intero ({ client, examinerName, initialForm, supersedes, previous, onSave, ... })
 * - `ResultInfo` / `Detail` — parte specifica del dettaglio
 * - `createForm(nowLocal, previous)` — form nuovo (previous = ultima valida dello stesso test, per la precompilazione)
 * - `formFromAssessment(assessment)` — form di Correggi
 * - `formatPrimary(assessment)` — valore principale a schermo
 * - `formatDelta(entry)`        — testo del delta (buildTestHistory), null se assente
 */
export const ASSESSMENT_UI = {
  [LIPEDEMA_TEST_IDS.TWO_MINUTE_WALK]: {
    Form:               TwoMinuteWalkForm,
    ResultInfo:         TwoMinuteWalkResultInfo,
    Detail:             TwoMinuteWalkDetail,
    createForm:         nowLocal => createTwoMinuteWalkForm(nowLocal),
    formFromAssessment: twoMinuteWalkFormFromAssessment,
    formatPrimary:      assessment => `${formatNumber(getPrimaryResult(assessment))} m`,
    formatDelta:        entry => formatMonoDelta(entry, 'm'),
  },
  [LIPEDEMA_TEST_IDS.SIT_TO_STAND_30S]: {
    Form:               SitToStandForm,
    ResultInfo:         SitToStandResultInfo,
    Detail:             SitToStandDetail,
    createForm:         nowLocal => createSitToStandForm(nowLocal),
    formFromAssessment: sitToStandFormFromAssessment,
    formatPrimary:      assessment => `${formatNumber(getPrimaryResult(assessment))} rip.`,
    formatDelta:        entry => formatMonoDelta(entry, 'ripetizioni'),
  },
  [HANDGRIP_ID]: {
    Form:               HandgripForm,
    ResultInfo:         BilateralResultInfo,
    Detail:             HandgripDetail,
    createForm:         createHandgripForm,
    formFromAssessment: handgripFormFromAssessment,
    formatPrimary:      assessment => formatBilateralPrimary(assessment, HANDGRIP_UNIT, HANDGRIP_DECIMALS),
    formatDelta:        entry => formatBilateralDelta(entry, HANDGRIP_UNIT, HANDGRIP_DECIMALS),
  },
}

/** Valore principale; il testId senza voce (dato futuro o corrotto) non rompe la vista */
export function formatAssessmentPrimary(assessment) {
  return ASSESSMENT_UI[assessment?.testId]?.formatPrimary(assessment) ?? '—'
}

export function formatAssessmentDelta(entry) {
  return ASSESSMENT_UI[entry?.assessment?.testId]?.formatDelta(entry) ?? null
}
