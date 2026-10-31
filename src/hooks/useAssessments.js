import { useState, useEffect, useCallback } from 'react'
import { getAssessments }        from '../firebase/services/assessments'
import { addAssessmentUseCase }  from '../usecases/addAssessmentUseCase'
import { voidAssessmentUseCase } from '../usecases/voidAssessmentUseCase'
import { useToast }              from './useToast'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors'

/**
 * Valutazioni di un paziente (modulo lipedema). Lettura diretta (service),
 * scritture via Cloud Function. Niente update ottimistico: i documenti sono
 * immutabili e risultato/esaminatore/date li decide il server, quindi dopo un
 * salvataggio o un annullamento si rilegge lo storico invece di stimarlo.
 *
 * @param {string}  orgId
 * @param {string}  clientId
 * @param {object}  [options]
 * @param {boolean} [options.enabled=true] — false nei moduli senza valutazioni
 */
export function useAssessments(orgId, clientId, { enabled = true } = {}) {
  const { success: toastSuccess, error: toastError } = useToast()
  const [assessments, setAssessments] = useState([])
  const [isLoading,   setIsLoading]   = useState(enabled)
  const [loadError,   setLoadError]   = useState(null)
  const [reloadKey,   setReloadKey]   = useState(0)

  useEffect(() => {
    if (!enabled || !orgId || !clientId) {
      setIsLoading(false)
      return undefined
    }
    // Vedi useNotes: ignora la risposta di un paziente non più selezionato
    let cancelled = false
    // Niente storico del paziente precedente mentre si carica il nuovo
    setAssessments([])
    setIsLoading(true)
    setLoadError(null)
    getAssessments(orgId, clientId)
      .then(data => { if (!cancelled) setAssessments(data) })
      .catch(() => { if (!cancelled) setLoadError('Impossibile caricare le valutazioni') })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [enabled, orgId, clientId, reloadKey])

  const reload = useCallback(() => setReloadKey(key => key + 1), [])

  /**
   * @param {object[]} tests — input grezzi (shared/lipedema.js → validateAssessmentInput)
   * @param {{ supersedes?: string, voidReason?: string }} [correction]
   * Rilancia l'errore: il form resta aperto con i dati inseriti.
   */
  const handleAddAssessment = useCallback(async (tests, correction) => {
    try {
      await addAssessmentUseCase(orgId, clientId, tests, correction)
    } catch (err) {
      toastError(getFirebaseErrorMessage(err, 'Impossibile salvare la valutazione'))
      throw err
    }
    toastSuccess(correction?.supersedes ? 'Valutazione corretta' : 'Valutazione salvata')
    reload()
  }, [orgId, clientId, reload, toastSuccess, toastError])

  /** Rilancia l'errore: il dialog resta aperto con il motivo inserito. */
  const handleVoidAssessment = useCallback(async (assessmentId, voidReason) => {
    try {
      await voidAssessmentUseCase(orgId, clientId, assessmentId, voidReason)
    } catch (err) {
      toastError(getFirebaseErrorMessage(err, 'Impossibile annullare la valutazione'))
      throw err
    }
    toastSuccess('Valutazione annullata')
    reload()
  }, [orgId, clientId, reload, toastSuccess, toastError])

  return { assessments, isLoading, loadError, reload, handleAddAssessment, handleVoidAssessment }
}
