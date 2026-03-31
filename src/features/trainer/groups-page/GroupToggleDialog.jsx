import { useEffect, useState }   from 'react'
import { getGroupTogglePreview } from '../../../features/calendar/calendarGroupUtils'

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

/**
 * Dialog di conferma per aggiunta/rimozione cliente da gruppo.
 * Mostra un recap dell'operazione prima di confermare.
 */
export function GroupToggleDialog({
  client,
  group,
  trainerId,
  isRemoving,
  onConfirm,
  onCancel,
}) {
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    getGroupTogglePreview(trainerId, group.id)
      .then(setPreview)
      .finally(() => setLoading(false))
  }, [trainerId, group.id])

  const handleConfirm = async () => {
    setSaving(true)
    try { await onConfirm() }
    finally { setSaving(false) }
  }

  const actionColor = isRemoving ? '#f87171' : '#0fd65a'
  const actionLabel = isRemoving ? 'RIMUOVI' : 'AGGIUNGI'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(8,12,18,0.9)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm p-6"
        style={{
          background:   '#0d1520',
          border:       '1px solid rgba(15,214,90,0.15)',
          borderRadius: '4px',
          boxShadow:    '0 20px 60px rgba(0,0,0,0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Titolo */}
        <h3 className="font-display font-black text-[16px] text-white mb-1">
          {isRemoving ? 'Rimuovi dal gruppo' : 'Aggiungi al gruppo'}
        </h3>
        <p className="font-body text-[12px] text-white/40 mb-5">
          Rivedi l'operazione prima di confermare
        </p>

        {/* Recap operazione */}
        <div
          className="p-4 mb-4 flex flex-col gap-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '3px' }}
        >
          <div className="flex items-center justify-between">
            <span className="font-body text-[12px] text-white/40">Allievo</span>
            <span className="font-display text-[13px] text-white">{client.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-[12px] text-white/40">Gruppo</span>
            <span className="font-display text-[13px] text-white">{group.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-[12px] text-white/40">Operazione</span>
            <span className="font-display text-[13px]" style={{ color: actionColor }}>
              {isRemoving ? 'Rimozione' : 'Aggiunta'}
            </span>
          </div>
        </div>

        {/* Impatto calendario */}
        <div
          className="p-4 mb-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '3px' }}
        >
          <div className="font-display text-[10px] tracking-[2px] mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
            IMPATTO SUL CALENDARIO
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2].map(i => (
                <div key={i} className="h-4 rounded-[3px] animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
              ))}
            </div>
          ) : preview ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-body text-[12px] text-white/50">Sessioni future</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-display font-black text-[14px]"
                    style={{ color: preview.futureSlots > 0 ? actionColor : 'rgba(255,255,255,0.25)' }}
                  >
                    {preview.futureSlots}
                  </span>
                  <span className="font-body text-[11px] text-white/25">da aggiornare</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-body text-[12px] text-white/50">Ricorrenze attive</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-display font-black text-[14px]"
                    style={{ color: preview.recurrences.length > 0 ? actionColor : 'rgba(255,255,255,0.25)' }}
                  >
                    {preview.recurrences.length}
                  </span>
                  <span className="font-body text-[11px] text-white/25">da aggiornare</span>
                </div>
              </div>

              {preview.recurrences.length > 0 && (
                <div className="mt-1 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {preview.recurrences.map(r => (
                    <div key={r.id} className="flex items-center gap-2 py-1">
                      <span
                        className="font-display text-[9px] px-2 py-0.5 rounded-[3px]"
                        style={{ background: 'rgba(15,214,90,0.12)', color: 'rgba(15,214,90,0.8)' }}
                      >
                        {DAY_LABELS.filter((_, i) => r.days.includes(i)).join(' · ')}
                      </span>
                      <span className="font-body text-[11px] text-white/40">
                        {r.startTime} → {r.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {preview.futureSlots === 0 && preview.recurrences.length === 0 && (
                <p className="font-body text-[12px] text-white/25 text-center py-1">
                  Nessuna sessione futura da aggiornare
                </p>
              )}
            </div>
          ) : null}
        </div>

        {/* Azioni */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 py-2.5 font-display text-[12px] cursor-pointer bg-transparent text-white/40 hover:text-white/70 transition-all disabled:opacity-50"
            style={{ borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            ANNULLA
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || loading}
            className="flex-1 py-2.5 font-display text-[12px] font-bold cursor-pointer border-0 transition-opacity hover:opacity-85 disabled:opacity-40"
            style={isRemoving
              ? { background: '#f87171', borderRadius: '3px', color: '#080c12' }
              : { background: 'linear-gradient(135deg, #1aff6e, #0fd65a, #00c8ff)', borderRadius: '3px', color: '#080c12' }
            }
          >
            {saving ? 'ATTENDERE...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
