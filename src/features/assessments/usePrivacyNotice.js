import { useCallback } from 'react'
import { useTrainerDispatch, ACTIONS }  from '../../context/TrainerContext'
import { recordPrivacyNoticeUseCase }   from '../../usecases/recordPrivacyNoticeUseCase'
import { useToast }                     from '../../hooks/useToast'
import { getFirebaseErrorMessage }      from '../../utils/firebaseErrors'

/**
 * Informativa consegnata al paziente (ADR-015 §1). Scrive solo la callable;
 * qui si aggiorna il paziente selezionato e la lista con il valore restituito
 * dal server (chi l'ha registrata e quando li decide lui, niente stima locale).
 *
 * @param {string}   orgId
 * @param {Function} [onClientUpdated] — allinea la lista pazienti (useClients)
 */
export function usePrivacyNotice(orgId, onClientUpdated) {
  const dispatch = useTrainerDispatch()
  const { success: toastSuccess, error: toastError } = useToast()

  const applyClient = useCallback((client) => {
    dispatch({ type: ACTIONS.SELECT_CLIENT, payload: client })
    onClientUpdated?.(client)
  }, [dispatch, onClientUpdated])

  /** Rilancia l'errore: il modal resta aperto con i dati inseriti. */
  const handleRecordPrivacyNotice = useCallback(async (client, input) => {
    let privacyNotice
    try {
      privacyNotice = await recordPrivacyNoticeUseCase(orgId, client.id, input)
    } catch (err) {
      toastError(getFirebaseErrorMessage(err, "Impossibile registrare l'informativa"))
      throw err
    }
    applyClient({ ...client, privacyNotice })
    toastSuccess('Informativa registrata')
  }, [orgId, applyClient, toastSuccess, toastError])

  /** Il server ha rifiutato per informativa mancante: il dato locale era vecchio */
  const handlePrivacyNoticeMissing = useCallback((client) => {
    if (client.privacyNotice) applyClient({ ...client, privacyNotice: null })
  }, [applyClient])

  return { handleRecordPrivacyNotice, handlePrivacyNoticeMissing }
}
