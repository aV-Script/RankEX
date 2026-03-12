import { useState } from 'react'
import { Modal, Input, Button } from '../ui'

export function AddXPModal({ client, onClose, onSave }) {
  const [xp,      setXp]      = useState('')
  const [note,    setNote]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSave = async () => {
    const val = parseInt(xp)
    if (isNaN(val) || val <= 0) { setError('Inserisci un valore XP valido'); return }
    setLoading(true)
    try {
      await onSave(val, note.trim())
      onClose()
    } catch {
      setLoading(false)
    }
  }

  return (
    <Modal title="Aggiungi XP" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="m-0 text-white/50 text-[13px] font-body">
          Aggiungi XP manualmente a <strong className="text-white">{client.name}</strong>.
        </p>

        <div>
          <div className="text-white/40 text-[11px] font-display tracking-wider mb-1.5">QUANTITÀ XP</div>
          <Input
            type="number"
            placeholder="Es. 100"
            value={xp}
            onChange={e => { setXp(e.target.value); setError('') }}
            autoFocus
          />
          {error && <p className="m-0 mt-1 text-red-400 font-body text-[12px]">{error}</p>}
        </div>

        <div>
          <div className="text-white/40 text-[11px] font-display tracking-wider mb-1.5">MOTIVAZIONE (opzionale)</div>
          <Input
            placeholder="Es. Completato programma mensile"
            value={note}
            onChange={e => setNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>

        {/* Preview livello */}
        <div className="bg-white/[.03] rounded-xl p-3 border border-white/[.06] text-center">
          <div className="text-white/30 font-body text-[12px]">XP attuali</div>
          <div className="font-display text-[20px] text-white font-bold">
            {client.xp.toLocaleString('it-IT')}
            {xp && !isNaN(parseInt(xp)) && (
              <span className="text-emerald-400 text-[16px]"> +{parseInt(xp)}</span>
            )}
          </div>
          <div className="text-white/20 font-body text-[11px]">su {client.xpNext.toLocaleString('it-IT')} per il prossimo livello</div>
        </div>

        <Button variant="primary" className="w-full" loading={loading} onClick={handleSave}>
          AGGIUNGI XP
        </Button>
      </div>
    </Modal>
  )
}
