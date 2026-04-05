import { useCallback }                         from 'react'
import { useTrainerState, useTrainerDispatch, ACTIONS } from '../../context/TrainerContext'
import { updateClient }                         from '../../firebase/services/clients'
import { addNotification }                      from '../../firebase/services/notifications'
import { buildBiaUpdate, buildProfileUpgrade }  from '../../utils/gamification'

/**
 * Hook per la gestione delle misurazioni BIA.
 */
export function useBia() {
  const { orgId }  = useTrainerState()
  const dispatch   = useTrainerDispatch()

  const handleSaveBia = useCallback(async (client, biaData) => {
    const { update, xpEarned } = buildBiaUpdate(client, biaData)

    dispatch({ type: ACTIONS.SELECT_CLIENT, payload: { ...client, ...update } })

    try {
      await updateClient(orgId, client.id, update)
      if (client.clientAuthUid && xpEarned > 0) {
        await addNotification(orgId, {
          clientId: client.id,
          message:  xpEarned === 100
            ? `Prima misurazione BIA completata! +${xpEarned} XP`
            : `BIA aggiornata — ${xpEarned > 0 ? `+${xpEarned} XP guadagnati!` : 'continua così!'}`,
          date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
          type: 'bia',
        })
      }
    } catch {
      dispatch({ type: ACTIONS.SELECT_CLIENT, payload: client })
    }
  }, [orgId, dispatch])

  const handleUpgradeProfile = useCallback(async (client, newProfileType) => {
    const update   = buildProfileUpgrade(client, newProfileType)
    const snapshot = client

    dispatch({ type: ACTIONS.SELECT_CLIENT, payload: { ...client, ...update } })

    try {
      await updateClient(orgId, client.id, update)
      if (client.clientAuthUid) {
        await addNotification(orgId, {
          clientId: client.id,
          message:  'Il tuo profilo è stato aggiornato dal trainer.',
          date:     new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
          type:     'upgrade',
        })
      }
    } catch {
      dispatch({ type: ACTIONS.SELECT_CLIENT, payload: snapshot })
    }
  }, [orgId, dispatch])

  return { handleSaveBia, handleUpgradeProfile }
}
