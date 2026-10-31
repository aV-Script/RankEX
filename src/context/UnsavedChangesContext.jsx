import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import { ConfirmDialog } from '../components/common/ConfirmDialog'

// Dati inseriti e non ancora salvati in un form a schermo intero (valutazione,
// BIA, campionamento): qualunque uscita — tab della dashboard, back, nav
// principale — passa da guardLeave, che chiede conferma (BUG-011). Chiudere o
// ricaricare la scheda del browser mostra l'avviso nativo (beforeunload).

const UnsavedChangesCtx = createContext(null)

// Fuori dal provider (es. area cliente) nessuna protezione: si esce sempre
const NO_GUARD = {
  hasUnsavedChanges:    false,
  setHasUnsavedChanges: () => {},
  guardLeave:           leave => leave(),
}

export function UnsavedChangesProvider({ children }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pendingLeave,      setPendingLeave]      = useState(null)

  const guardLeave = useCallback((leave) => {
    if (hasUnsavedChanges) setPendingLeave(() => leave)
    else leave()
  }, [hasUnsavedChanges])

  const handleConfirmLeave = useCallback(() => {
    const leave = pendingLeave
    setPendingLeave(null)
    setHasUnsavedChanges(false)
    leave?.()
  }, [pendingLeave])

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined
    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const value = useMemo(
    () => ({ hasUnsavedChanges, setHasUnsavedChanges, guardLeave }),
    [hasUnsavedChanges, guardLeave],
  )

  return (
    <UnsavedChangesCtx.Provider value={value}>
      {children}
      {pendingLeave && (
        <ConfirmDialog
          title="Uscire senza salvare?"
          description="I dati inseriti andranno persi."
          confirmLabel="ESCI"
          cancelLabel="INDIETRO"
          variant="danger"
          onConfirm={handleConfirmLeave}
          onCancel={() => setPendingLeave(null)}
        />
      )}
    </UnsavedChangesCtx.Provider>
  )
}

/** @returns {{ hasUnsavedChanges: boolean, setHasUnsavedChanges: Function, guardLeave: (leave: Function) => void }} */
export function useUnsavedChanges() {
  return useContext(UnsavedChangesCtx) ?? NO_GUARD
}
