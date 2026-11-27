import { useRef, useState } from 'react'
import { useFocusTrap } from '../../../hooks/useFocusTrap'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { Button } from '../../../components/ui'
import { getDeletedItems, isDeleteNameConfirmed } from './deleteDialogModel'

/**
 * Dialog di conferma eliminazione cliente: elenca cosa viene cancellato (dalle
 * capability del modulo) e richiede di digitare il nome per abilitare la conferma.
 */
export function DeleteDialog({ clientName, clientLabel = 'Cliente', capabilities, terminology, isDeleting = false, onConfirm, onCancel }) {
  const dialogRef = useRef(null)
  const [typedName, setTypedName] = useState('')
  useFocusTrap(dialogRef, true)

  useEscapeKey(onCancel)

  const deletedItems = getDeletedItems(capabilities, terminology)
  const canConfirm = isDeleteNameConfirmed(typedName, clientName)

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
        <p className="font-body text-[13px] text-white/50 mb-3">
          Stai per eliminare <strong className="text-white">{clientName}</strong>.
          Questa azione è irreversibile e cancella:
        </p>
        <ul className="font-body text-[13px] text-white/70 mb-4 pl-5 list-disc">
          {deletedItems.map(item => <li key={item}>{item}</li>)}
        </ul>
        <label htmlFor="delete-dialog-name" className="block font-body text-[12px] text-white/50 mb-1.5">
          Scrivi il nome per confermare
        </label>
        <input
          id="delete-dialog-name"
          type="text"
          className="input-base mb-6"
          value={typedName}
          onChange={e => setTypedName(e.target.value)}
          autoComplete="off"
          autoFocus
        />
        <div className="flex gap-3">
          <Button variant="neutral" className="flex-1" onClick={onCancel}>
            ANNULLA
          </Button>
          <Button variant="danger" className="flex-1" disabled={!canConfirm} loading={isDeleting} onClick={onConfirm}>
            ELIMINA DEFINITIVAMENTE
          </Button>
        </div>
      </div>
    </div>
  )
}
