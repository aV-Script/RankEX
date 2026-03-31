import { useState, useCallback } from 'react'
import { SectionLabel }         from '../../../components/ui'
import { ConfirmDialog }        from '../../../components/common/ConfirmDialog'

const WEEK_DAYS = [
  { value: 1, label: 'Lun' }, { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' }, { value: 4, label: 'Gio' },
  { value: 5, label: 'Ven' }, { value: 6, label: 'Sab' },
  { value: 0, label: 'Dom' },
]

export function RecurrenceDetailView({
  recurrence, clients,
  onBack, onUpdateTime, onUpdateDays,
  onExtendPeriod, onAddClient, onRemoveClient, onCancel,
}) {
  const [editingTime, setEditingTime] = useState(false)
  const [editingDays, setEditingDays] = useState(false)
  const [editingEnd,  setEditingEnd]  = useState(false)
  const [showCancel,  setShowCancel]  = useState(false)

  const [startTime,  setStartTime] = useState(recurrence.startTime)
  const [endTime,    setEndTime]   = useState(recurrence.endTime)
  const [days,       setDays]      = useState(recurrence.days)
  const [newEndDate, setNewEndDate] = useState(recurrence.endDate)
  const [saving,     setSaving]    = useState(false)

  const recurrenceClients = recurrence.clientIds
    .map(id => clients.find(c => c.id === id))
    .filter(Boolean)

  const availableClients = clients.filter(c => !recurrence.clientIds.includes(c.id))

  const isActive = recurrence.status === 'active'

  const handleSaveTime = useCallback(async () => {
    setSaving(true)
    try { await onUpdateTime(recurrence.id, startTime, endTime); setEditingTime(false) }
    finally { setSaving(false) }
  }, [recurrence.id, startTime, endTime, onUpdateTime])

  const handleSaveDays = useCallback(async () => {
    setSaving(true)
    try { await onUpdateDays(recurrence.id, days); setEditingDays(false) }
    finally { setSaving(false) }
  }, [recurrence.id, days, onUpdateDays])

  const handleSaveEnd = useCallback(async () => {
    setSaving(true)
    try { await onExtendPeriod(recurrence.id, newEndDate); setEditingEnd(false) }
    finally { setSaving(false) }
  }, [recurrence.id, newEndDate, onExtendPeriod])

  const handleConfirmCancel = useCallback(async () => {
    await onCancel(recurrence.id)
    onBack()
  }, [recurrence.id, onCancel, onBack])

  const sectionStyle = {
    background:   'rgba(255,255,255,0.02)',
    border:       '1px solid rgba(255,255,255,0.06)',
    borderRadius: '4px',
  }

  const statusInfo = {
    active:    { label: '● ATTIVA',     color: '#0fd65a' },
    cancelled: { label: '✕ CANCELLATA', color: '#f87171' },
    ended:     { label: '— TERMINATA',  color: '#6b7280' },
  }[recurrence.status ?? 'active']

  return (
    <div className="min-h-screen text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-transparent border-none text-white/30 font-body text-[13px] cursor-pointer hover:text-white/60 transition-colors p-0"
        >
          ‹ Ricorrenze
        </button>
        <span className="font-display font-black text-[16px] text-white">Dettaglio ricorrenza</span>
        {isActive && (
          <button
            onClick={() => setShowCancel(true)}
            className="font-display text-[10px] px-3 py-1.5 cursor-pointer border transition-all bg-transparent"
            style={{ borderRadius: '3px', color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}
          >
            CANCELLA
          </button>
        )}
        {!isActive && <div style={{ width: 80 }} />}
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-5">

        {/* Status */}
        <div>
          <span
            className="font-display text-[10px] px-3 py-1 rounded-[3px]"
            style={{ background: statusInfo.color + '18', color: statusInfo.color }}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Orario */}
        <section className="p-5" style={sectionStyle}>
          <div className="flex items-center justify-between mb-4">
            <SectionLabel className="mb-0">ORARIO</SectionLabel>
            {isActive && !editingTime && (
              <button
                onClick={() => setEditingTime(true)}
                className="font-display text-[10px] text-white/30 cursor-pointer hover:text-white/60 bg-transparent border-none"
              >
                MODIFICA
              </button>
            )}
          </div>

          {editingTime ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-1.5">INIZIO</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                    className="input-base w-full" style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-1.5">FINE</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                    className="input-base w-full" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <p className="font-body text-[11px] m-0" style={{ color: 'rgba(251,191,36,0.7)' }}>
                ⚠ La modifica aggiorna tutti gli slot futuri collegati.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingTime(false)}
                  className="flex-1 py-2 font-display text-[11px] cursor-pointer bg-transparent text-white/40"
                  style={{ borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  ANNULLA
                </button>
                <button
                  onClick={handleSaveTime}
                  disabled={saving}
                  className="flex-1 py-2 font-display text-[11px] cursor-pointer border-0 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #1aff6e, #0fd65a, #00c8ff)', borderRadius: '3px', color: '#080c12', fontWeight: 700 }}
                >
                  {saving ? 'ATTENDERE...' : 'SALVA'}
                </button>
              </div>
            </div>
          ) : (
            <div className="font-display font-black text-[24px]" style={{ color: '#0fd65a' }}>
              {recurrence.startTime} → {recurrence.endTime}
            </div>
          )}
        </section>

        {/* Giorni */}
        <section className="p-5" style={sectionStyle}>
          <div className="flex items-center justify-between mb-4">
            <SectionLabel className="mb-0">GIORNI</SectionLabel>
            {isActive && !editingDays && (
              <button
                onClick={() => setEditingDays(true)}
                className="font-display text-[10px] text-white/30 cursor-pointer hover:text-white/60 bg-transparent border-none"
              >
                MODIFICA
              </button>
            )}
          </div>

          {editingDays ? (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 flex-wrap">
                {WEEK_DAYS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setDays(prev =>
                      prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]
                    )}
                    className="w-10 h-10 font-display text-[11px] cursor-pointer border transition-all"
                    style={days.includes(value)
                      ? { background: 'rgba(15,214,90,0.15)', borderColor: '#0fd65a', color: '#fff', borderRadius: '4px' }
                      : { background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', borderRadius: '4px' }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="font-body text-[11px] m-0" style={{ color: 'rgba(251,191,36,0.7)' }}>
                ⚠ La modifica dei giorni non aggiorna gli slot esistenti.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingDays(false); setDays(recurrence.days) }}
                  className="flex-1 py-2 font-display text-[11px] cursor-pointer bg-transparent text-white/40"
                  style={{ borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  ANNULLA
                </button>
                <button
                  onClick={handleSaveDays}
                  disabled={saving || days.length === 0}
                  className="flex-1 py-2 font-display text-[11px] cursor-pointer border-0 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #1aff6e, #0fd65a, #00c8ff)', borderRadius: '3px', color: '#080c12', fontWeight: 700 }}
                >
                  {saving ? 'ATTENDERE...' : 'SALVA'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {WEEK_DAYS.filter(({ value }) => recurrence.days.includes(value)).map(({ label }) => (
                <span
                  key={label}
                  className="font-display text-[11px] px-3 py-1.5 rounded-[3px]"
                  style={{ background: 'rgba(15,214,90,0.12)', color: '#0fd65a' }}
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Periodo */}
        <section className="p-5" style={sectionStyle}>
          <div className="flex items-center justify-between mb-4">
            <SectionLabel className="mb-0">PERIODO</SectionLabel>
            {isActive && !editingEnd && (
              <button
                onClick={() => setEditingEnd(true)}
                className="font-display text-[10px] text-white/30 cursor-pointer hover:text-white/60 bg-transparent border-none"
              >
                ESTENDI
              </button>
            )}
          </div>

          <div className="font-display text-[15px] text-white/70 mb-3">
            {recurrence.startDate}
            <span className="text-white/25 mx-2">→</span>
            {recurrence.endDate}
          </div>

          {editingEnd && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-1.5">NUOVA DATA FINE</label>
                <input
                  type="date" value={newEndDate} min={recurrence.endDate}
                  onChange={e => setNewEndDate(e.target.value)}
                  className="input-base w-full" style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingEnd(false); setNewEndDate(recurrence.endDate) }}
                  className="flex-1 py-2 font-display text-[11px] cursor-pointer bg-transparent text-white/40"
                  style={{ borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  ANNULLA
                </button>
                <button
                  onClick={handleSaveEnd}
                  disabled={saving || newEndDate <= recurrence.endDate}
                  className="flex-1 py-2 font-display text-[11px] cursor-pointer border-0 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #1aff6e, #0fd65a, #00c8ff)', borderRadius: '3px', color: '#080c12', fontWeight: 700 }}
                >
                  {saving ? 'ATTENDERE...' : 'ESTENDI'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Clienti */}
        <section className="p-5" style={sectionStyle}>
          <SectionLabel>CLIENTI ({recurrenceClients.length})</SectionLabel>

          <div className="flex flex-col gap-1.5 mb-4">
            {recurrenceClients.length === 0 ? (
              <p className="font-body text-[13px] text-white/20">Nessun cliente.</p>
            ) : recurrenceClients.map(c => (
              <div
                key={c.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-[3px]"
                style={{ background: 'rgba(15,214,90,0.06)', border: '1px solid rgba(15,214,90,0.15)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 flex items-center justify-center rounded-[3px]"
                    style={{ background: 'rgba(15,214,90,0.15)' }}
                  >
                    <span className="font-display text-[10px]" style={{ color: '#0fd65a' }}>
                      {c.name[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="font-body text-[13px] text-white/70">{c.name}</span>
                </div>
                {isActive && (
                  <button
                    onClick={() => onRemoveClient(recurrence.id, c.id)}
                    className="font-display text-[10px] px-2.5 py-1 cursor-pointer border transition-all bg-transparent"
                    style={{ borderRadius: '3px', color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}
                  >
                    RIMUOVI
                  </button>
                )}
              </div>
            ))}
          </div>

          {isActive && availableClients.length > 0 && (
            <div>
              <div className="font-display text-[10px] tracking-[2px] mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
                AGGIUNGI CLIENTE
              </div>
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                {availableClients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => onAddClient(recurrence.id, c.id)}
                    className="flex items-center justify-between px-3 py-2 cursor-pointer border text-left transition-all rounded-[3px]"
                    style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(15,214,90,0.25)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
                  >
                    <span className="font-body text-[12px] text-white/50">{c.name}</span>
                    <span className="font-display text-[10px]" style={{ color: '#0fd65a' }}>+ AGGIUNGI</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {showCancel && (
        <ConfirmDialog
          title="Cancellare la ricorrenza?"
          description="Tutti gli slot futuri collegati verranno eliminati. Gli slot passati rimangono invariati."
          confirmLabel="CANCELLA"
          onConfirm={handleConfirmCancel}
          onCancel={() => setShowCancel(false)}
        />
      )}
    </div>
  )
}
