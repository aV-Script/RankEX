import { useState, useCallback } from 'react'
import { getGoals }          from '../firebase/services/goals'
import { getNotes }          from '../firebase/services/notes'
import { getClientPlans }    from '../firebase/services/workoutPlans'
import { getNotifications }  from '../firebase/services/notifications'
import { buildClientExport, clientExportFileName } from '../utils/clientExport'
import { useToast }          from './useToast'

/**
 * Scarica in un file JSON tutti i dati del cliente che lo chiede (STORY-028).
 * Solo letture già permesse al cliente dalle rules: nessun dato di altri.
 *
 * @param {string} orgId
 * @param {string} clientId
 * @param {object} client — documento cliente già caricato (useClient, realtime)
 */
export function useClientExport(orgId, clientId, client) {
  const { success: toastSuccess, error: toastError } = useToast()
  const [exporting, setExporting] = useState(false)

  const handleExport = useCallback(async () => {
    if (exporting || !orgId || !clientId || !client) return
    setExporting(true)
    try {
      const [goals, notes, workoutPlans, notifications] = await Promise.all([
        getGoals(orgId, clientId),
        getNotes(orgId, clientId),
        getClientPlans(orgId, clientId),
        getNotifications(orgId, clientId),
      ])
      const data = buildClientExport({ client: { id: clientId, ...client }, goals, notes, workoutPlans, notifications })
      downloadJson(data, clientExportFileName(client))
      toastSuccess('Dati scaricati')
    } catch {
      toastError('Impossibile scaricare i dati: riprova')
    } finally {
      setExporting(false)
    }
  }, [exporting, orgId, clientId, client, toastSuccess, toastError])

  return { exporting, handleExport }
}

function downloadJson(data, fileName) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
