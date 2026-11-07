import { useState, useEffect, useCallback, useRef } from 'react'
import { getAssessments }        from '../firebase/services/assessments'
import { addAssessmentUseCase }  from '../usecases/addAssessmentUseCase'
import { voidAssessmentUseCase } from '../usecases/voidAssessmentUseCase'
import { useToast }              from './useToast'
import { getFirebaseErrorMessage } from '../utils/firebaseErrors'

const LOAD_ERROR = 'Impossibile caricare le valutazioni'

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
  // Vale solo l'ultima lettura partita: né il paziente precedente (vedi useNotes), né
  // un caricamento più vecchio sopra lo storico riletto dopo un salvataggio
  const requestSeqRef = useRef(0)

  useEffect(() => {
    requestSeqRef.current += 1
    const seq = requestSeqRef.current
    if (!enabled || !orgId || !clientId) {
      setIsLoading(false)
      return
    }
    // Niente storico del paziente precedente mentre si carica il nuovo
    setAssessments([])
    setIsLoading(true)
    setLoadError(null)
    getAssessments(orgId, clientId)
      .then(data => { if (seq === requestSeqRef.current) setAssessments(data) })
      .catch(() => { if (seq === requestSeqRef.current) setLoadError(LOAD_ERROR) })
      .finally(() => { if (seq === requestSeqRef.current) setIsLoading(false) })
  }, [enabled, orgId, clientId, reloadKey])

  const reload = useCallback(() => setReloadKey(key => key + 1), [])

  // Rilegge senza svuotare la lista, a differenza di reload: durante la sequenza di
  // visita il form successivo si precompila dallo storico. Mai rilanciare: il
  // salvataggio è già riuscito, una lettura fallita non deve sembrare un errore di salvataggio.
  const refreshAfterSave = useCallback(async () => {
    requestSeqRef.current += 1
    const seq = requestSeqRef.current
    try {
      const data = await getAssessments(orgId, clientId)
      if (seq === requestSeqRef.current) {
        setAssessments(data)
        setLoadError(null)
        setIsLoading(false)
      }
      return data
    } catch {
      if (seq === requestSeqRef.current) {
        setLoadError(LOAD_ERROR)
        setIsLoading(false)
      }
      return null
    }
  }, [orgId, clientId])

  /**
   * @param {object[]} tests — input grezzi (shared/lipedema.js → validateAssessmentInput)
   * @param {{ supersedes?: string, voidReason?: string }} [correction]
   * @returns {Promise<{ refreshed: Promise<object[]|null> }>} `refreshed` è la rilettura dello
   * storico già partita (null se fallisce): la aspetta solo chi deve precompilare il test
   * successivo. In un oggetto perché un async non risolva anche quella.
   * Rilancia l'errore di salvataggio: il form resta aperto con i dati inseriti.
   */
  const handleAddAssessment = useCallback(async (tests, correction) => {
    try {
      await addAssessmentUseCase(orgId, clientId, tests, correction)
    } catch (err) {
      toastError(getFirebaseErrorMessage(err, 'Impossibile salvare la valutazione'))
      throw err
    }
    toastSuccess(correction?.supersedes ? 'Valutazione corretta' : 'Valutazione salvata')
    return { refreshed: refreshAfterSave() }
  }, [orgId, clientId, refreshAfterSave, toastSuccess, toastError])

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
