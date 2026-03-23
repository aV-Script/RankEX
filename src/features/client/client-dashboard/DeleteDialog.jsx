/**
 * Dialog di conferma eliminazione cliente.
 * Modale semplice con due azioni: annulla e conferma.
 */
export function DeleteDialog({ clientName, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4"
      onClick={onCancel}
    >
      <div
        className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-display font-black text-[16px] text-white mb-2">
          Elimina cliente
        </h3>
        <p className="font-body text-[13px] text-white/50 mb-6">
          Stai per eliminare <strong className="text-white">{clientName}</strong>.
          Questa azione è irreversibile.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-display text-[12px] cursor-pointer border border-white/10 bg-transparent text-white/40 hover:text-white/70 transition-all"
          >
            ANNULLA
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl font-display text-[12px] cursor-pointer border-0 transition-opacity hover:opacity-85"
            style={{ background: '#ef4444', color: '#fff' }}
          >
            ELIMINA
          </button>
        </div>
      </div>
    </div>
  )
}