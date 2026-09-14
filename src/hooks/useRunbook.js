import { useState, useEffect, useCallback } from 'react'
import { getRuns, saveRun }  from '../firebase/services/runbook'
import { RUNBOOK_SUITES }    from '../config/runbook.config'
import { useToast }          from './useToast'

/** Hook per la pagina Runbook (super_admin) — storico giri + esecuzione di un nuovo giro. */
export function useRunbook() {
  const { error: toastError, success: toastSuccess } = useToast()
  const [runs,    setRuns]    = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    setLoading(true)
    getRuns()
      .then(setRuns)
      .catch(() => toastError('Impossibile caricare lo storico dei giri'))
      .finally(() => setLoading(false))
  }, [toastError])

  const handleSaveRun = useCallback(async (suiteIds, results) => {
    const cases = RUNBOOK_SUITES
      .filter(s => suiteIds.includes(s.id))
      .flatMap(s => s.cases)

    const counts = { pass: 0, fail: 0, skip: 0, total: cases.length }
    for (const c of cases) {
      const r = results[c.id]?.status
      if (r === 'pass') counts.pass++
      else if (r === 'fail') counts.fail++
      else counts.skip++
    }

    setSaving(true)
    try {
      const run = await saveRun(suiteIds, results, counts)
      setRuns(prev => [run, ...prev])
      toastSuccess('Giro salvato')
      return true
    } catch {
      toastError('Impossibile salvare il giro')
      return false
    } finally {
      setSaving(false)
    }
  }, [toastError, toastSuccess])

  return { runs, loading, saving, handleSaveRun }
}
