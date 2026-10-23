import { useCallback }                                    from 'react'
import { useTrainerState, useTrainerDispatch, ACTIONS }  from '../../context/TrainerContext'
import { buildBiaUpdate, buildProfileUpgrade }           from '../../utils/gamification'
import { saveBiaUseCase }                                from '../../usecases/saveBiaUseCase'
import { upgradeProfileUseCase }                         from '../../usecases/upgradeProfileUseCase'
import { useToast }                                      from '../../hooks/useToast'
import { getFirebaseErrorMessage }                       from '../../utils/firebaseErrors'

/**
 * Hook per la gestione delle misurazioni BIA.
 */
export function useBia() {
  const { orgId } = useTrainerState()
  const dispatch  = useTrainerDispatch()
  const { success, error } = useToast()

  const handleSaveBia = useCallback(async (client, biaData) => {
    const { update, xpEarned, isFirstMeasurement } = buildBiaUpdate(client, biaData)

    dispatch({ type: ACTIONS.SELECT_CLIENT, payload: { ...client, ...update } })

    try {
      await saveBiaUseCase(orgId, client, xpEarned, update, isFirstMeasurement)
      success('BIA salvata')
    } catch (err) {
      dispatch({ type: ACTIONS.SELECT_CLIENT, payload: client })
      error(getFirebaseErrorMessage(err, 'Impossibile salvare la BIA'))
      console.error('[useBia] saveBiaUseCase error:', err)
      // Rilanciato: BiaView resta aperta con i valori inseriti
      throw err
    }
  }, [orgId, dispatch, success, error])

  const handleUpgradeProfile = useCallback(async (client, newProfileType) => {
    const update   = buildProfileUpgrade(client, newProfileType)
    const snapshot = client

    dispatch({ type: ACTIONS.SELECT_CLIENT, payload: { ...client, ...update } })

    try {
      await upgradeProfileUseCase(orgId, client, update)
    } catch (err) {
      dispatch({ type: ACTIONS.SELECT_CLIENT, payload: snapshot })
      error(getFirebaseErrorMessage(err, 'Impossibile aggiornare il profilo'))
      throw err
    }
  }, [orgId, dispatch, error])

  return { handleSaveBia, handleUpgradeProfile }
}
