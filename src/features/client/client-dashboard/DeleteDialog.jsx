import { useRef } from 'react'
import { useFocusTrap } from '../../../hooks/useFocusTrap'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { Button } from '../../../components/ui'

/**
 * Dialog di conferma eliminazione cliente.
 * Modale semplice con due azioni: annulla e conferma.
 */
export function DeleteDialog({ clientName, clientLabel = 'Cliente', onConfirm, onCancel }) {
  const dialogRef = useRef(null)
  useFocusTrap(dialogRef, true)

  useEscapeKey(onCancel)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(8,12,18,0.9)' }}
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="p-6 w-full max-w-sm"
        style={{ background: 'var(--rx-surface)', border: '1px solid var(--rx-border)', borderRadius: '4px', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 id="delete-dialog-title" className="font-display font-black text-[16px] text-white mb-2">
          Elimina {clientLabel.toLowerCase()}
        </h3>
        <p className="font-body text-[13px] text-white/50 mb-6">
          Stai per eliminare <strong className="text-white">{clientName}</strong>.
          Questa azione è irreversibile.
        </p>
        <div className="flex gap-3">
          <Button variant="neutral" className="flex-1" onClick={onCancel}>
            ANNULLA
          </Button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 font-display text-[12px] cursor-pointer border-0 transition-opacity hover:opacity-85"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', borderRadius: '3px', color: '#ffffff' }}
          >
            ELIMINA
          </button>
        </div>
      </div>
    </div>
  )
}