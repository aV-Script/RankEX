// Sequenza di visita del modulo Lipedema (STORY-042): solo navigazione tra i form,
// tutta lato client. Ogni test resta una valutazione a sé, salvata quando la si
// conferma: una visita interrotta conserva quanto già salvato e non esiste un
// documento "visita".
import { LIPEDEMA_TESTS, LIPEDEMA_TEST_ORDER } from '../../config/lipedemaTests.config'

/** Etichetta del test nella sequenza: come sul canvas, "HANDGRIP" ma "30s-STS" */
export function getVisitLabel(testId) {
  const test = LIPEDEMA_TESTS[testId]
  return test?.visitLabel ?? test?.shortName ?? ''
}

/**
 * Il prossimo test da proporre: il primo dopo quello corrente non ancora salvato
 * in questa visita. Solo in avanti: un test saltato si riprende dalla barra dei test.
 * @returns {string|null} null se non ne restano
 */
export function getNextVisitTestId(currentTestId, savedTestIds = [], order = LIPEDEMA_TEST_ORDER) {
  const currentIndex = order.indexOf(currentTestId)
  if (currentIndex === -1) return null
  return order.slice(currentIndex + 1).find(testId => !savedTestIds.includes(testId)) ?? null
}

/** Dati di AssessmentFormShell: posizione "n di 5", prossimo test, stato di ogni test */
export function buildVisitProgress(currentTestId, savedTestIds = [], order = LIPEDEMA_TEST_ORDER) {
  const nextTestId = getNextVisitTestId(currentTestId, savedTestIds, order)
  return {
    position:  order.indexOf(currentTestId) + 1,
    total:     order.length,
    nextLabel: nextTestId ? getVisitLabel(nextTestId) : null,
    steps:     order.map(testId => ({
      testId,
      label:     getVisitLabel(testId),
      isCurrent: testId === currentTestId,
      isSaved:   savedTestIds.includes(testId),
    })),
  }
}
