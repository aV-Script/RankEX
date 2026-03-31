# FitQuest/RankEX — Gestione Ricorrenze e Gruppi

## Obiettivo
1. Ricorrenze come entità di primo livello con gestione completa
2. Dialog di conferma per aggiunta/rimozione clienti da gruppi
3. Sync corretto tra gruppi, slot futuri e ricorrenze

Leggi CLAUDE.md prima di iniziare.
Build dopo ogni fase.

---

## FASE 1 — Modello dati aggiornato

### 1A — Ricorrenza (aggiorna firebase/services/calendar.js)
```js
// Modello ricorrenza aggiornato
{
  id,
  trainerId,
  clientIds:   [],
  groupIds:    [],
  days:        [],          // [1,3,5] = Lun/Mer/Ven
  startDate:   'YYYY-MM-DD',
  endDate:     'YYYY-MM-DD',
  startTime:   'HH:MM',
  endTime:     'HH:MM',
  status:      'active' | 'ended' | 'cancelled',
  createdAt,
}
```

### 1B — Aggiorna firebase/services/calendar.js
```js
import {
  collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, query, where, orderBy,
  arrayUnion, arrayRemove, writeBatch,
} from 'firebase/firestore'
import { db } from './db'

// ── Ricorrenze ────────────────────────────────────────────────

export const getTrainerRecurrences = async (trainerId) => {
  const q    = query(
    collection(db, 'recurrences'),
    where('trainerId', '==', trainerId),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const getGroupRecurrences = async (trainerId, groupId) => {
  const q    = query(
    collection(db, 'recurrences'),
    where('trainerId', '==', trainerId),
    where('groupIds', 'array-contains', groupId),
    where('status', '==', 'active'),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const addRecurrence = (data) =>
  addDoc(collection(db, 'recurrences'), {
    ...data,
    status:    'active',
    createdAt: new Date().toISOString(),
  })

export const updateRecurrence = (id, data) =>
  updateDoc(doc(db, 'recurrences', id), data)

export const cancelRecurrence = (id) =>
  updateDoc(doc(db, 'recurrences', id), { status: 'cancelled' })

/**
 * Aggiunge un cliente a una ricorrenza e a tutti
 * gli slot futuri collegati.
 */
export const addClientToRecurrence = async (recurrenceId, clientId) => {
  const today = new Date().toISOString().slice(0, 10)
  const batch = writeBatch(db)

  // Aggiorna la ricorrenza
  batch.update(doc(db, 'recurrences', recurrenceId), {
    clientIds: arrayUnion(clientId),
  })

  // Trova slot futuri di questa ricorrenza
  const q    = query(
    collection(db, 'slots'),
    where('recurrenceId', '==', recurrenceId),
    where('date', '>=', today),
  )
  const snap = await getDocs(q)
  snap.docs.forEach(slotDoc => {
    batch.update(slotDoc.ref, {
      clientIds: arrayUnion(clientId),
    })
  })

  return batch.commit()
}

/**
 * Rimuove un cliente da una ricorrenza e da tutti
 * gli slot futuri collegati.
 */
export const removeClientFromRecurrence = async (recurrenceId, clientId) => {
  const today = new Date().toISOString().slice(0, 10)
  const batch = writeBatch(db)

  // Aggiorna la ricorrenza
  batch.update(doc(db, 'recurrences', recurrenceId), {
    clientIds: arrayRemove(clientId),
  })

  // Trova slot futuri di questa ricorrenza
  const q    = query(
    collection(db, 'slots'),
    where('recurrenceId', '==', recurrenceId),
    where('date', '>=', today),
  )
  const snap = await getDocs(q)
  snap.docs.forEach(slotDoc => {
    batch.update(slotDoc.ref, {
      clientIds: arrayRemove(clientId),
    })
  })

  return batch.commit()
}

/**
 * Aggiorna gli slot futuri di una ricorrenza
 * (usato quando si modifica orario/giorni).
 */
export const updateFutureSlots = async (recurrenceId, update) => {
  const today = new Date().toISOString().slice(0, 10)
  const batch = writeBatch(db)

  const q    = query(
    collection(db, 'slots'),
    where('recurrenceId', '==', recurrenceId),
    where('date', '>=', today),
  )
  const snap = await getDocs(q)
  snap.docs.forEach(slotDoc => {
    batch.update(slotDoc.ref, update)
  })

  return batch.commit()
}

/**
 * Elimina tutti gli slot futuri di una ricorrenza.
 */
export const deleteFutureSlots = async (recurrenceId) => {
  const today = new Date().toISOString().slice(0, 10)
  const batch = writeBatch(db)

  const q    = query(
    collection(db, 'slots'),
    where('recurrenceId', '==', recurrenceId),
    where('date', '>=', today),
  )
  const snap = await getDocs(q)
  snap.docs.forEach(slotDoc => {
    batch.delete(slotDoc.ref)
  })

  return batch.commit()
}

/**
 * Conta slot futuri di una ricorrenza (per preview nel dialog).
 */
export const countFutureSlots = async (recurrenceId) => {
  const today = new Date().toISOString().slice(0, 10)
  const q     = query(
    collection(db, 'slots'),
    where('recurrenceId', '==', recurrenceId),
    where('date', '>=', today),
  )
  const snap = await getDocs(q)
  return snap.size
}
```

---

## FASE 2 — calendarGroupUtils.js aggiornato

Sostituisci completamente il file:
```js
import {
  getSlotsByGroup,
  getGroupRecurrences,
  addClientToSlot,
  removeClientFromSlot,
  addClientToRecurrence,
  removeClientFromRecurrence,
} from '../../firebase/services/calendar'

/**
 * Raccoglie tutti i dati necessari per mostrare
 * il dialog di conferma prima del toggle.
 *
 * @returns {{
 *   futureSlots: number,
 *   recurrences: Array,
 * }}
 */
export async function getGroupTogglePreview(trainerId, groupId) {
  const today  = new Date().toISOString().slice(0, 10)

  const [slots, recurrences] = await Promise.all([
    getSlotsByGroup(trainerId, groupId, today),
    getGroupRecurrences(trainerId, groupId),
  ])

  return {
    futureSlots:  slots.length,
    recurrences,
  }
}

/**
 * Aggiunge un cliente a un gruppo —
 * aggiorna slot futuri E ricorrenze attive.
 */
export async function addClientToGroupSlots(trainerId, groupId, clientId) {
  const today = new Date().toISOString().slice(0, 10)

  const [slots, recurrences] = await Promise.all([
    getSlotsByGroup(trainerId, groupId, today),
    getGroupRecurrences(trainerId, groupId),
  ])

  // Aggiunge agli slot futuri non ricorrenti
  // (quelli ricorrenti vengono gestiti via addClientToRecurrence)
  const nonRecurringSlots = slots.filter(
    s => !s.recurrenceId && !s.clientIds.includes(clientId)
  )

  await Promise.all([
    // Slot non ricorrenti
    ...nonRecurringSlots.map(s => addClientToSlot(s.id, clientId)),
    // Ricorrenze attive (aggiorna ricorrenza + slot futuri collegati)
    ...recurrences.map(r =>
      !r.clientIds.includes(clientId)
        ? addClientToRecurrence(r.id, clientId)
        : Promise.resolve()
    ),
  ])
}

/**
 * Rimuove un cliente da un gruppo —
 * aggiorna slot futuri E ricorrenze attive.
 */
export async function removeClientFromGroupSlots(trainerId, groupId, clientId) {
  const today = new Date().toISOString().slice(0, 10)

  const [slots, recurrences] = await Promise.all([
    getSlotsByGroup(trainerId, groupId, today),
    getGroupRecurrences(trainerId, groupId),
  ])

  // Rimuove dagli slot futuri non ricorrenti
  const nonRecurringSlots = slots.filter(
    s => !s.recurrenceId && s.clientIds.includes(clientId)
  )

  await Promise.all([
    // Slot non ricorrenti
    ...nonRecurringSlots.map(s => removeClientFromSlot(s.id, clientId)),
    // Ricorrenze attive
    ...recurrences.map(r =>
      r.clientIds.includes(clientId)
        ? removeClientFromRecurrence(r.id, clientId)
        : Promise.resolve()
    ),
  ])
}
```

---

## FASE 3 — Hook ricorrenze

### 3A — Crea src/features/calendar/useRecurrences.js
```js
import { useState, useEffect, useCallback } from 'react'
import {
  getTrainerRecurrences,
  addRecurrence,
  updateRecurrence,
  cancelRecurrence,
  updateFutureSlots,
  deleteFutureSlots,
  addClientToRecurrence,
  removeClientFromRecurrence,
  generateRecurrenceDates,
} from '../../firebase/services/calendar'
import { addSlot, updateSlot } from '../../firebase/services/calendar'

/**
 * Hook per la gestione completa delle ricorrenze.
 * Separato da useCalendar per evitare responsabilità eccessive.
 */
export function useRecurrences(trainerId) {
  const [recurrences, setRecurrences] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  // ── Fetch ──────────────────────────────────────────────────
  const refresh = useCallback(() => {
    if (!trainerId) return
    setLoading(true)
    setError(null)
    getTrainerRecurrences(trainerId)
      .then(setRecurrences)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [trainerId])

  useEffect(() => { refresh() }, [refresh])

  // ── Crea ricorrenza ────────────────────────────────────────
  const handleAddRecurrence = useCallback(async ({
    clientIds, groupIds, days,
    startDate, endDate, startTime, endTime,
  }) => {
    const recRef       = await addRecurrence({
      trainerId, clientIds, groupIds, days,
      startDate, endDate, startTime, endTime,
    })
    const recurrenceId = recRef.id
    const dates        = generateRecurrenceDates(startDate, endDate, days)

    // Crea gli slot
    for (const date of dates) {
      const ref = await addSlot({
        trainerId, date, startTime, endTime,
        clientIds, groupIds,
      })
      await updateSlot(ref.id, { recurrenceId })
    }

    const newRec = {
      id: recurrenceId, trainerId, clientIds, groupIds,
      days, startDate, endDate, startTime, endTime,
      status: 'active',
    }
    setRecurrences(prev => [newRec, ...prev])
    return newRec
  }, [trainerId])

  // ── Modifica orario ────────────────────────────────────────
  const handleUpdateTime = useCallback(async (recurrenceId, startTime, endTime) => {
    const snapshot = recurrences.find(r => r.id === recurrenceId)

    setRecurrences(prev => prev.map(r =>
      r.id === recurrenceId ? { ...r, startTime, endTime } : r
    ))

    try {
      await Promise.all([
        updateRecurrence(recurrenceId, { startTime, endTime }),
        updateFutureSlots(recurrenceId, { startTime, endTime }),
      ])
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [recurrences])

  // ── Modifica giorni ────────────────────────────────────────
  const handleUpdateDays = useCallback(async (recurrenceId, days) => {
    const snapshot = recurrences.find(r => r.id === recurrenceId)
    setRecurrences(prev => prev.map(r =>
      r.id === recurrenceId ? { ...r, days } : r
    ))
    try {
      await updateRecurrence(recurrenceId, { days })
      // Nota: modificare i giorni NON aggiorna gli slot esistenti
      // (troppo complesso — genera nuovi slot per i nuovi giorni)
      // Segnaliamo questo limite all'utente nel componente
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [recurrences])

  // ── Estendi periodo ────────────────────────────────────────
  const handleExtendPeriod = useCallback(async (recurrenceId, newEndDate) => {
    const rec      = recurrences.find(r => r.id === recurrenceId)
    if (!rec) return
    const snapshot = rec

    setRecurrences(prev => prev.map(r =>
      r.id === recurrenceId ? { ...r, endDate: newEndDate } : r
    ))

    try {
      // Genera slot solo per le nuove date
      const newDates = generateRecurrenceDates(
        // Parte dal giorno dopo la vecchia endDate
        (() => {
          const d = new Date(rec.endDate + 'T12:00')
          d.setDate(d.getDate() + 1)
          return d.toISOString().slice(0, 10)
        })(),
        newEndDate,
        rec.days,
      )

      await updateRecurrence(recurrenceId, { endDate: newEndDate })

      for (const date of newDates) {
        const ref = await addSlot({
          trainerId,
          date,
          startTime:  rec.startTime,
          endTime:    rec.endTime,
          clientIds:  rec.clientIds,
          groupIds:   rec.groupIds,
        })
        await updateSlot(ref.id, { recurrenceId })
      }
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [recurrences, trainerId])

  // ── Aggiungi cliente ───────────────────────────────────────
  const handleAddClient = useCallback(async (recurrenceId, clientId) => {
    const snapshot = recurrences.find(r => r.id === recurrenceId)

    setRecurrences(prev => prev.map(r =>
      r.id === recurrenceId
        ? { ...r, clientIds: [...r.clientIds, clientId] }
        : r
    ))

    try {
      await addClientToRecurrence(recurrenceId, clientId)
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [recurrences])

  // ── Rimuovi cliente ────────────────────────────────────────
  const handleRemoveClient = useCallback(async (recurrenceId, clientId) => {
    const snapshot = recurrences.find(r => r.id === recurrenceId)

    setRecurrences(prev => prev.map(r =>
      r.id === recurrenceId
        ? { ...r, clientIds: r.clientIds.filter(id => id !== clientId) }
        : r
    ))

    try {
      await removeClientFromRecurrence(recurrenceId, clientId)
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [recurrences])

  // ── Cancella ricorrenza ────────────────────────────────────
  const handleCancel = useCallback(async (recurrenceId) => {
    const snapshot = recurrences.find(r => r.id === recurrenceId)

    setRecurrences(prev => prev.map(r =>
      r.id === recurrenceId ? { ...r, status: 'cancelled' } : r
    ))

    try {
      await Promise.all([
        cancelRecurrence(recurrenceId),
        deleteFutureSlots(recurrenceId),
      ])
    } catch {
      setRecurrences(prev => prev.map(r =>
        r.id === recurrenceId ? snapshot : r
      ))
    }
  }, [recurrences])

  return {
    recurrences,
    loading,
    error,
    refresh,
    handleAddRecurrence,
    handleUpdateTime,
    handleUpdateDays,
    handleExtendPeriod,
    handleAddClient,
    handleRemoveClient,
    handleCancel,
  }
}
```

---

## FASE 4 — GroupDetailView aggiornato

### 4A — Crea GroupToggleDialog.jsx

**`src/features/trainer/groups-page/GroupToggleDialog.jsx`**
```jsx
import { useEffect, useState }              from 'react'
import { getGroupTogglePreview }            from '../../../features/calendar/calendarGroupUtils'

/**
 * Dialog di conferma per aggiunta/rimozione cliente da gruppo.
 * Mostra un recap completo dell'operazione prima di confermare.
 */
export function GroupToggleDialog({
  client,
  group,
  trainerId,
  isRemoving,   // true = rimozione, false = aggiunta
  onConfirm,
  onCancel,
}) {
  const [preview, setPreview]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)

  // Carica preview asincrono
  useEffect(() => {
    getGroupTogglePreview(trainerId, group.id)
      .then(setPreview)
      .finally(() => setLoading(false))
  }, [trainerId, group.id])

  const handleConfirm = async () => {
    setSaving(true)
    try {
      await onConfirm()
    } finally {
      setSaving(false)
    }
  }

  const actionColor = isRemoving ? '#f87171' : '#34d399'
  const actionLabel = isRemoving ? 'RIMUOVI' : 'AGGIUNGI'
  const actionIcon  = isRemoving ? '✗' : '✓'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: 'rgba(10,15,30,0.98)',
          border:     '1px solid rgba(255,255,255,0.1)',
          boxShadow:  '0 20px 60px rgba(0,0,0,0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-display font-black text-[16px]"
            style={{
              background: actionColor + '18',
              border:     `1px solid ${actionColor}33`,
              color:      actionColor,
            }}
          >
            {actionIcon}
          </div>
          <div>
            <div className="font-display font-black text-[15px] text-white">
              {isRemoving ? 'Rimuovi dal gruppo' : 'Aggiungi al gruppo'}
            </div>
            <div className="font-body text-[12px] text-white/40 mt-0.5">
              Rivedi l'operazione prima di confermare
            </div>
          </div>
        </div>

        {/* Recap operazione */}
        <div
          className="rounded-xl p-4 mb-4 flex flex-col gap-2"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border:     '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Cliente */}
          <div className="flex items-center justify-between">
            <span className="font-body text-[12px] text-white/40">Allievo</span>
            <span className="font-display text-[13px] text-white">{client.name}</span>
          </div>

          {/* Gruppo */}
          <div className="flex items-center justify-between">
            <span className="font-body text-[12px] text-white/40">Gruppo</span>
            <span className="font-display text-[13px] text-white">{group.name}</span>
          </div>

          {/* Operazione */}
          <div className="flex items-center justify-between">
            <span className="font-body text-[12px] text-white/40">Operazione</span>
            <span
              className="font-display text-[13px]"
              style={{ color: actionColor }}
            >
              {isRemoving ? 'Rimozione' : 'Aggiunta'}
            </span>
          </div>
        </div>

        {/* Impatto sul calendario */}
        <div
          className="rounded-xl p-4 mb-5"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border:     '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="font-display text-[10px] tracking-[2px] mb-3"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            IMPATTO SUL CALENDARIO
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[1,2].map(i => (
                <div
                  key={i}
                  className="h-4 rounded animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
              ))}
            </div>
          ) : preview ? (
            <div className="flex flex-col gap-2.5">
              {/* Slot futuri */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[14px]">📅</span>
                  <span className="font-body text-[12px] text-white/60">
                    Sessioni future
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-display font-black text-[14px]"
                    style={{ color: preview.futureSlots > 0 ? actionColor : 'rgba(255,255,255,0.3)' }}
                  >
                    {preview.futureSlots}
                  </span>
                  <span className="font-body text-[11px] text-white/30">
                    {isRemoving ? 'da aggiornare' : 'da aggiornare'}
                  </span>
                </div>
              </div>

              {/* Ricorrenze */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[14px]">↺</span>
                  <span className="font-body text-[12px] text-white/60">
                    Ricorrenze attive
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-display font-black text-[14px]"
                    style={{ color: preview.recurrences.length > 0 ? actionColor : 'rgba(255,255,255,0.3)' }}
                  >
                    {preview.recurrences.length}
                  </span>
                  <span className="font-body text-[11px] text-white/30">
                    {isRemoving ? 'da aggiornare' : 'da aggiornare'}
                  </span>
                </div>
              </div>

              {/* Nomi ricorrenze se presenti */}
              {preview.recurrences.length > 0 && (
                <div className="mt-1 pt-2 border-t border-white/[.05]">
                  {preview.recurrences.map(r => (
                    <div
                      key={r.id}
                      className="flex items-center gap-2 py-1"
                    >
                      <span
                        className="font-display text-[9px] px-2 py-0.5 rounded"
                        style={{
                          background: actionColor + '18',
                          color:      actionColor + 'cc',
                        }}
                      >
                        {DAY_LABELS.filter((_, i) => r.days.includes(i === 0 ? 0 : i)).join(' · ')}
                      </span>
                      <span className="font-body text-[11px] text-white/40">
                        {r.startTime} → {r.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Nessun impatto */}
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
            className="flex-1 py-2.5 rounded-xl font-display text-[11px] cursor-pointer border bg-transparent text-white/40 hover:text-white/70 transition-all disabled:opacity-40"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            ANNULLA
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || loading}
            className="flex-1 py-2.5 rounded-xl font-display text-[11px] font-bold cursor-pointer border-0 transition-opacity hover:opacity-85 disabled:opacity-40"
            style={{ background: actionColor, color: '#07090e' }}
          >
            {saving ? 'ATTENDERE...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
```

### 4B — Aggiorna GroupDetailView.jsx
```jsx
import { useState, useMemo, useCallback }           from 'react'
import { usePagination }                            from '../../../hooks/usePagination'
import { Pagination }                               from '../../../components/common/Pagination'
import { ConfirmDialog }                            from '../../../components/common/ConfirmDialog'
import { GroupToggleDialog }                        from './GroupToggleDialog'
import {
  addClientToGroupSlots,
  removeClientFromGroupSlots,
} from '../../../features/calendar/calendarGroupUtils'

const CLIENTS_PAGE_SIZE = 8

export function GroupDetailView({ group, clients, trainerId, onToggleClient, onRename, onDelete, onBack }) {
  const [clientSearch, setClientSearch] = useState('')
  const [isEditing,    setIsEditing]    = useState(false)
  const [editingName,  setEditingName]  = useState(group.name)
  const [showDelete,   setShowDelete]   = useState(false)

  // Dialog toggle — { client, isRemoving }
  const [toggleDialog, setToggleDialog] = useState(null)
  const [toggling,     setToggling]     = useState(null)

  const today = new Date().toISOString().slice(0, 10)

  const filteredClients    = useMemo(() =>
    clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
  , [clients, clientSearch])

  const clientsInGroup     = useMemo(() =>
    filteredClients.filter(c => group.clientIds.includes(c.id))
  , [filteredClients, group.clientIds])

  const clientsNotInGroup  = useMemo(() =>
    filteredClients.filter(c => !group.clientIds.includes(c.id))
  , [filteredClients, group.clientIds])

  const inGroupPagination    = usePagination(clientsInGroup,    CLIENTS_PAGE_SIZE)
  const notInGroupPagination = usePagination(clientsNotInGroup, CLIENTS_PAGE_SIZE)

  // ── Apre il dialog di conferma ─────────────────────────────
  const handleRequestToggle = useCallback((client, isRemoving) => {
    setToggleDialog({ client, isRemoving })
  }, [])

  // ── Conferma il toggle dopo il dialog ─────────────────────
  const handleConfirmToggle = useCallback(async () => {
    const { client, isRemoving } = toggleDialog
    setToggling(client.id)
    setToggleDialog(null)

    try {
      // 1. Aggiorna il gruppo
      await onToggleClient(group.id, client.id)

      // 2. Aggiorna slot futuri e ricorrenze
      if (isRemoving) {
        await removeClientFromGroupSlots(trainerId, group.id, client.id)
      } else {
        await addClientToGroupSlots(trainerId, group.id, client.id)
      }
    } finally {
      setToggling(null)
    }
  }, [toggleDialog, group.id, onToggleClient, trainerId])

  const handleRename = useCallback(async () => {
    if (!editingName.trim() || editingName === group.name) {
      setIsEditing(false)
      return
    }
    await onRename(group.id, editingName.trim())
    setIsEditing(false)
  }, [editingName, group.id, group.name, onRename])

  const handleDelete = useCallback(async () => {
    await onDelete(group.id)
    onBack()
  }, [group.id, onDelete, onBack])

  return (
    <div className="min-h-screen text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[.05]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-transparent border-none text-white/30 font-body text-[13px] cursor-pointer hover:text-white/60 transition-colors p-0"
        >
          ‹ Gruppi
        </button>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <input
                autoFocus
                value={editingName}
                onChange={e => setEditingName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter')  handleRename()
                  if (e.key === 'Escape') { setIsEditing(false); setEditingName(group.name) }
                }}
                className="input-base text-center font-display font-black text-[16px]"
                style={{ minWidth: 200 }}
              />
              <ActionBtn onClick={handleRename} color="#34d399">SALVA</ActionBtn>
              <ActionBtn onClick={() => { setIsEditing(false); setEditingName(group.name) }} muted>ANNULLA</ActionBtn>
            </>
          ) : (
            <span className="font-display font-black text-[16px] text-white">
              {group.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <ActionBtn onClick={() => setIsEditing(true)}>RINOMINA</ActionBtn>
          )}
          <ActionBtn onClick={() => setShowDelete(true)} danger>ELIMINA</ActionBtn>
        </div>
      </div>

      {/* Contenuto */}
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Info gruppo */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(96,165,250,0.1)',
              border:     '1px solid rgba(96,165,250,0.2)',
            }}
          >
            <span className="font-display font-black text-[20px] text-blue-400">
              {group.name[0].toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-display font-black text-[20px] text-white">
              {group.name}
            </div>
            <div className="font-body text-[13px] text-white/30 mt-0.5">
              {group.clientIds.length} {group.clientIds.length === 1 ? 'cliente' : 'clienti'}
            </div>
          </div>
        </div>

        {/* Ricerca */}
        <input
          value={clientSearch}
          onChange={e => setClientSearch(e.target.value)}
          placeholder="Cerca cliente per nome..."
          className="input-base w-full mb-6"
        />

        {/* Clienti nel gruppo */}
        <div className="mb-8">
          <div
            className="font-display text-[10px] text-white/30 tracking-[2px] mb-3"
          >
            NEL GRUPPO ({clientsInGroup.length})
          </div>
          {inGroupPagination.paginatedItems.length === 0 ? (
            <p className="font-body text-[13px] text-white/20">
              {clientSearch ? 'Nessun risultato.' : 'Nessun cliente in questo gruppo.'}
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {inGroupPagination.paginatedItems.map(c => (
                  <ClientRow
                    key={c.id}
                    client={c}
                    inGroup
                    loading={toggling === c.id}
                    onToggle={() => handleRequestToggle(c, true)}
                  />
                ))}
              </div>
              <Pagination {...inGroupPagination} />
            </>
          )}
        </div>

        {/* Clienti da aggiungere */}
        <div>
          <div
            className="font-display text-[10px] text-white/30 tracking-[2px] mb-3"
          >
            DA AGGIUNGERE ({clientsNotInGroup.length})
          </div>
          {notInGroupPagination.paginatedItems.length === 0 ? (
            <p className="font-body text-[13px] text-white/20">
              {clientSearch ? 'Nessun risultato.' : 'Tutti i clienti sono già nel gruppo.'}
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {notInGroupPagination.paginatedItems.map(c => (
                  <ClientRow
                    key={c.id}
                    client={c}
                    inGroup={false}
                    loading={toggling === c.id}
                    onToggle={() => handleRequestToggle(c, false)}
                  />
                ))}
              </div>
              <Pagination {...notInGroupPagination} />
            </>
          )}
        </div>
      </div>

      {/* Dialog toggle con recap */}
      {toggleDialog && (
        <GroupToggleDialog
          client={toggleDialog.client}
          group={group}
          trainerId={trainerId}
          isRemoving={toggleDialog.isRemoving}
          onConfirm={handleConfirmToggle}
          onCancel={() => setToggleDialog(null)}
        />
      )}

      {/* Dialog elimina gruppo */}
      {showDelete && (
        <ConfirmDialog
          title={`Eliminare "${group.name}"?`}
          description="Il gruppo verrà eliminato. I clienti non verranno rimossi dall'app."
          confirmLabel="ELIMINA"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}

// ── Componenti locali ─────────────────────────────────────────

function ClientRow({ client, inGroup, loading, onToggle }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl transition-all"
      style={inGroup
        ? { background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }
        : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }
      }
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={inGroup
            ? { background: 'rgba(52,211,153,0.15)' }
            : { background: 'rgba(255,255,255,0.06)' }
          }
        >
          <span
            className="font-display text-[11px]"
            style={{ color: inGroup ? '#34d399' : 'rgba(255,255,255,0.4)' }}
          >
            {client.name?.[0]?.toUpperCase()}
          </span>
        </div>
        <div>
          <div className="font-body text-[13px] text-white/70">{client.name}</div>
          {client.rank && (
            <div className="font-display text-[10px] text-white/25 mt-0.5">
              {client.rank} · Lv.{client.level}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onToggle}
        disabled={loading}
        className="font-display text-[10px] px-3 py-1.5 rounded-lg cursor-pointer border transition-all disabled:opacity-40"
        style={inGroup
          ? { color: '#f87171', borderColor: 'rgba(248,113,113,0.2)', background: 'transparent' }
          : { color: '#60a5fa', borderColor: 'rgba(96,165,250,0.2)',  background: 'rgba(96,165,250,0.06)' }
        }
      >
        {loading ? '...' : inGroup ? 'RIMUOVI' : 'AGGIUNGI'}
      </button>
    </div>
  )
}

function ActionBtn({ onClick, children, color, danger, muted }) {
  return (
    <button
      onClick={onClick}
      className="font-display text-[10px] px-2.5 py-1.5 rounded-lg cursor-pointer border transition-all"
      style={
        danger ? { color: '#f87171', borderColor: 'rgba(248,113,113,0.2)', background: 'transparent' } :
        muted  ? { color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.1)', background: 'transparent' } :
        color  ? { color, borderColor: color + '44', background: color + '11' } :
                 { color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)', background: 'transparent' }
      }
    >
      {children}
    </button>
  )
}
```

---

## FASE 5 — Gestione ricorrenze (vista inline)

### 5A — Crea RecurrencesPage.jsx

**`src/features/trainer/RecurrencesPage.jsx`**
```jsx
import { useState }               from 'react'
import { useRecurrences }         from '../../features/calendar/useRecurrences'
import { useClients }             from '../../hooks/useClients'
import { RecurrenceDetailView }   from './recurrences-page/RecurrenceDetailView'
import { RecurrenceCard }         from './recurrences-page/RecurrenceCard'
import { SectionLabel }           from '../../components/ui'

const STATUS_TABS = [
  { id: 'active',    label: 'ATTIVE' },
  { id: 'ended',     label: 'TERMINATE' },
  { id: 'cancelled', label: 'CANCELLATE' },
]

export function RecurrencesPage({ trainerId }) {
  const {
    recurrences, loading,
    handleUpdateTime, handleUpdateDays, handleExtendPeriod,
    handleAddClient, handleRemoveClient, handleCancel,
  } = useRecurrences(trainerId)

  const { clients } = useClients(trainerId)

  const [activeTab,        setActiveTab]        = useState('active')
  const [selectedId,       setSelectedId]       = useState(null)

  const filtered  = recurrences.filter(r => (r.status ?? 'active') === activeTab)
  const selected  = recurrences.find(r => r.id === selectedId) ?? null

  if (selected) {
    return (
      <RecurrenceDetailView
        recurrence={selected}
        clients={clients}
        onBack={() => setSelectedId(null)}
        onUpdateTime={handleUpdateTime}
        onUpdateDays={handleUpdateDays}
        onExtendPeriod={handleExtendPeriod}
        onAddClient={handleAddClient}
        onRemoveClient={handleRemoveClient}
        onCancel={handleCancel}
      />
    )
  }

  return (
    <div className="text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[.05]">
        <h1 className="font-display font-black text-[20px] text-white m-0">
          Ricorrenze
        </h1>
        <span className="font-display text-[11px] text-white/30">
          {recurrences.filter(r => r.status === 'active').length} attive
        </span>
      </div>

      {/* Tab status */}
      <div
        className="flex border-b border-white/[.05]"
        style={{ paddingLeft: 24 }}
      >
        {STATUS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-3 font-display text-[11px] cursor-pointer border-none bg-transparent transition-all"
            style={activeTab === tab.id
              ? { color: '#60a5fa', borderBottom: '2px solid #60a5fa' }
              : { color: 'rgba(255,255,255,0.3)', borderBottom: '2px solid transparent' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="px-6 py-5">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div
                key={i}
                className="h-24 rounded-2xl animate-pulse"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-body text-[13px] text-white/20">
              Nessuna ricorrenza {activeTab === 'active' ? 'attiva' : activeTab === 'ended' ? 'terminata' : 'cancellata'}.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(rec => (
              <RecurrenceCard
                key={rec.id}
                recurrence={rec}
                clients={clients}
                onClick={() => setSelectedId(rec.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### 5B — Crea RecurrenceCard.jsx

**`src/features/trainer/recurrences-page/RecurrenceCard.jsx`**
```jsx
const DAY_LABELS = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab']

const STATUS_COLORS = {
  active:    '#34d399',
  ended:     '#6b7280',
  cancelled: '#f87171',
}

export function RecurrenceCard({ recurrence, clients, onClick }) {
  const statusColor = STATUS_COLORS[recurrence.status ?? 'active']
  const clientNames = recurrence.clientIds
    .slice(0, 3)
    .map(id => clients.find(c => c.id === id)?.name)
    .filter(Boolean)

  const dayLabels = DAY_LABELS
    .filter((_, i) => recurrence.days.includes(i))

  const isExpired = recurrence.endDate < new Date().toISOString().slice(0, 10)

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-4 cursor-pointer border transition-all hover:opacity-90"
      style={{
        background:  'rgba(255,255,255,0.02)',
        borderColor: statusColor + '22',
      }}
    >
      <div className="flex items-start justify-between mb-3">

        {/* Giorni */}
        <div className="flex gap-1 flex-wrap">
          {dayLabels.map(d => (
            <span
              key={d}
              className="font-display text-[10px] px-2 py-0.5 rounded"
              style={{
                background: statusColor + '18',
                color:      statusColor,
              }}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Orario */}
        <span className="font-display text-[12px] text-white/50 shrink-0 ml-2">
          {recurrence.startTime} → {recurrence.endTime}
        </span>
      </div>

      <div className="flex items-center justify-between">
        {/* Clienti */}
        <div className="font-body text-[12px] text-white/40">
          {clientNames.length > 0
            ? clientNames.join(', ') + (recurrence.clientIds.length > 3 ? ` +${recurrence.clientIds.length - 3}` : '')
            : 'Nessun cliente'
          }
        </div>

        {/* Periodo */}
        <div className="flex items-center gap-2">
          <span className="font-body text-[11px] text-white/25">
            {recurrence.startDate} → {recurrence.endDate}
          </span>
          {isExpired && recurrence.status === 'active' && (
            <span
              className="font-display text-[9px] px-2 py-0.5 rounded"
              style={{ background: '#f59e0b22', color: '#f59e0b' }}
            >
              SCADUTA
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
```

### 5C — Crea RecurrenceDetailView.jsx

**`src/features/trainer/recurrences-page/RecurrenceDetailView.jsx`**
```jsx
import { useState, useCallback }   from 'react'
import { SectionLabel }            from '../../../components/ui'
import { ConfirmDialog }           from '../../../components/common/ConfirmDialog'

const DAY_LABELS  = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab']
const WEEK_DAYS   = [
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
  const [editingTime,  setEditingTime]  = useState(false)
  const [editingDays,  setEditingDays]  = useState(false)
  const [editingEnd,   setEditingEnd]   = useState(false)
  const [showCancel,   setShowCancel]   = useState(false)

  const [startTime,    setStartTime]    = useState(recurrence.startTime)
  const [endTime,      setEndTime]      = useState(recurrence.endTime)
  const [days,         setDays]         = useState(recurrence.days)
  const [newEndDate,   setNewEndDate]   = useState(recurrence.endDate)
  const [saving,       setSaving]       = useState(false)

  const recurrenceClients    = recurrence.clientIds
    .map(id => clients.find(c => c.id === id))
    .filter(Boolean)

  const availableClients     = clients.filter(
    c => !recurrence.clientIds.includes(c.id)
  )

  const isActive = recurrence.status === 'active'

  // ── Salva orario ───────────────────────────────────────────
  const handleSaveTime = useCallback(async () => {
    setSaving(true)
    try {
      await onUpdateTime(recurrence.id, startTime, endTime)
      setEditingTime(false)
    } finally {
      setSaving(false)
    }
  }, [recurrence.id, startTime, endTime, onUpdateTime])

  // ── Salva giorni ───────────────────────────────────────────
  const handleSaveDays = useCallback(async () => {
    setSaving(true)
    try {
      await onUpdateDays(recurrence.id, days)
      setEditingDays(false)
    } finally {
      setSaving(false)
    }
  }, [recurrence.id, days, onUpdateDays])

  // ── Estendi periodo ────────────────────────────────────────
  const handleSaveEnd = useCallback(async () => {
    setSaving(true)
    try {
      await onExtendPeriod(recurrence.id, newEndDate)
      setEditingEnd(false)
    } finally {
      setSaving(false)
    }
  }, [recurrence.id, newEndDate, onExtendPeriod])

  // ── Cancella ricorrenza ────────────────────────────────────
  const handleConfirmCancel = useCallback(async () => {
    await onCancel(recurrence.id)
    onBack()
  }, [recurrence.id, onCancel, onBack])

  return (
    <div className="min-h-screen text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[.05]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-transparent border-none text-white/30 font-body text-[13px] cursor-pointer hover:text-white/60 transition-colors p-0"
        >
          ‹ Ricorrenze
        </button>
        <span className="font-display font-black text-[16px] text-white">
          Dettaglio ricorrenza
        </span>
        {isActive && (
          <button
            onClick={() => setShowCancel(true)}
            className="font-display text-[10px] px-3 py-1.5 rounded-lg cursor-pointer border transition-all"
            style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.2)', background: 'transparent' }}
          >
            CANCELLA
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span
            className="font-display text-[10px] px-3 py-1 rounded-full"
            style={{
              background: recurrence.status === 'active'    ? '#34d39922' :
                          recurrence.status === 'cancelled' ? '#f8717122' : '#6b728022',
              color:      recurrence.status === 'active'    ? '#34d399' :
                          recurrence.status === 'cancelled' ? '#f87171' : '#6b7280',
            }}
          >
            {recurrence.status === 'active' ? '● ATTIVA' :
             recurrence.status === 'cancelled' ? '✕ CANCELLATA' : '— TERMINATA'}
          </span>
        </div>

        {/* Sezione orario */}
        <section
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <SectionLabel className="mb-0">⏰ Orario</SectionLabel>
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
                  <label className="font-display text-[10px] text-white/30 block mb-1.5">INIZIO</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                    className="input-base" style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="font-display text-[10px] text-white/30 block mb-1.5">FINE</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                    className="input-base" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <p className="font-body text-[11px] text-amber-400/70 m-0">
                ⚠️ La modifica aggiorna tutti gli slot futuri collegati.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingTime(false)}
                  className="flex-1 py-2 rounded-xl font-display text-[11px] cursor-pointer border border-white/10 bg-transparent text-white/40"
                >
                  ANNULLA
                </button>
                <button
                  onClick={handleSaveTime}
                  disabled={saving}
                  className="flex-1 py-2 rounded-xl font-display text-[11px] cursor-pointer border-0 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #34d399, #059669)', color: '#fff' }}
                >
                  {saving ? '...' : 'SALVA'}
                </button>
              </div>
            </div>
          ) : (
            <div
              className="font-display font-black text-[24px]"
              style={{ color: '#60a5fa' }}
            >
              {recurrence.startTime} → {recurrence.endTime}
            </div>
          )}
        </section>

        {/* Sezione giorni */}
        <section
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <SectionLabel className="mb-0">📅 Giorni</SectionLabel>
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
                    className="w-10 h-10 rounded-xl font-display text-[11px] cursor-pointer border transition-all"
                    style={days.includes(value)
                      ? { background: 'rgba(59,130,246,0.2)', borderColor: '#3b82f6', color: '#fff' }
                      : { background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)' }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="font-body text-[11px] text-amber-400/70 m-0">
                ⚠️ La modifica dei giorni non aggiorna gli slot esistenti. Genera solo nuovi slot per i nuovi giorni.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingDays(false); setDays(recurrence.days) }}
                  className="flex-1 py-2 rounded-xl font-display text-[11px] cursor-pointer border border-white/10 bg-transparent text-white/40"
                >
                  ANNULLA
                </button>
                <button
                  onClick={handleSaveDays}
                  disabled={saving || days.length === 0}
                  className="flex-1 py-2 rounded-xl font-display text-[11px] cursor-pointer border-0 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #34d399, #059669)', color: '#fff' }}
                >
                  {saving ? '...' : 'SALVA'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {WEEK_DAYS.filter(({ value }) => recurrence.days.includes(value)).map(({ label }) => (
                <span
                  key={label}
                  className="font-display text-[12px] px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Sezione periodo */}
        <section
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <SectionLabel className="mb-0">🗓️ Periodo</SectionLabel>
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
                <label className="font-display text-[10px] text-white/30 block mb-1.5">
                  NUOVA DATA FINE
                </label>
                <input
                  type="date"
                  value={newEndDate}
                  min={recurrence.endDate}
                  onChange={e => setNewEndDate(e.target.value)}
                  className="input-base"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingEnd(false); setNewEndDate(recurrence.endDate) }}
                  className="flex-1 py-2 rounded-xl font-display text-[11px] cursor-pointer border border-white/10 bg-transparent text-white/40"
                >
                  ANNULLA
                </button>
                <button
                  onClick={handleSaveEnd}
                  disabled={saving || newEndDate <= recurrence.endDate}
                  className="flex-1 py-2 rounded-xl font-display text-[11px] cursor-pointer border-0 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #34d399, #059669)', color: '#fff' }}
                >
                  {saving ? '...' : 'ESTENDI'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Sezione clienti */}
        <section
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <SectionLabel>👥 Clienti ({recurrenceClients.length})</SectionLabel>

          <div className="flex flex-col gap-2 mb-4">
            {recurrenceClients.length === 0 ? (
              <p className="font-body text-[13px] text-white/20">Nessun cliente.</p>
            ) : recurrenceClients.map(c => (
              <div
                key={c.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.12)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(52,211,153,0.15)' }}
                  >
                    <span className="font-display text-[10px] text-emerald-400">
                      {c.name[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="font-body text-[13px] text-white/70">{c.name}</span>
                </div>
                {isActive && (
                  <button
                    onClick={() => onRemoveClient(recurrence.id, c.id)}
                    className="font-display text-[10px] px-2.5 py-1 rounded-lg cursor-pointer border transition-all"
                    style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.2)', background: 'transparent' }}
                  >
                    RIMUOVI
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Aggiungi cliente */}
          {isActive && availableClients.length > 0 && (
            <div>
              <div className="font-display text-[10px] text-white/20 tracking-[2px] mb-2">
                AGGIUNGI CLIENTE
              </div>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {availableClients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => onAddClient(recurrence.id, c.id)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer border text-left transition-all hover:border-blue-400/30"
                    style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.06)' }}
                  >
                    <span className="font-body text-[12px] text-white/50">{c.name}</span>
                    <span className="font-display text-[10px] text-blue-400">+ AGGIUNGI</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Dialog cancella ricorrenza */}
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
```

---

## FASE 6 — Integrazione nel trainer

### 6A — Aggiorna trainer.config.js
```js
import { RecurrencesPage } from '../features/trainer/RecurrencesPage'

// Aggiungi la pagina ricorrenze
export const PAGES = {
  clients:     ClientsPage,
  groups:      GroupsPage,
  calendar:    TrainerCalendar,
  recurrences: RecurrencesPage,   // ← NUOVO
  guides:      TestGuidePage,
  profile:     ProfilePage,
}
```

### 6B — Aggiorna trainer-shell/constants.jsx
```jsx
// Aggiungi voce nav per le ricorrenze
{
  id:    'recurrences',
  label: 'Ricorrenze',
  icon:  <RecurrenceIcon />,  // ↺ oppure usa lucide-react
}

// Icona inline se non hai lucide:
const RecurrenceIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
  </svg>
)
```

### 6C — Aggiunta link da SlotPopup

In `SlotPopup.jsx` — se lo slot ha `recurrenceId`, rendi il badge cliccabile:
```jsx
{slot.recurrenceId && (
  <button
    onClick={() => onViewRecurrence?.(slot.recurrenceId)}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg w-full text-left cursor-pointer border transition-all hover:border-purple-400/30"
    style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}
  >
    <span className="font-display text-[10px] text-purple-400 flex-1">
      ↺ Sessione ricorrente
    </span>
    <span className="font-display text-[9px] text-purple-400/50">
      GESTISCI →
    </span>
  </button>
)}
```

In `TrainerCalendar.jsx`:
```jsx
// Aggiungi handler
const handleViewRecurrence = useCallback((recurrenceId) => {
  setPopup(null)
  // Naviga alla pagina ricorrenze con quella selezionata
  onNavigate('recurrences', recurrenceId)
}, [onNavigate])
```

---

## FASE 7 — Firestore indexes

Aggiorna `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "recurrences",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "trainerId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "recurrences",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "trainerId",  "order": "ASCENDING" },
        { "fieldPath": "groupIds",   "arrayConfig": "CONTAINS" },
        { "fieldPath": "status",     "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "slots",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "recurrenceId", "order": "ASCENDING" },
        { "fieldPath": "date",         "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## FASE 8 — Verifica

### 8A — Build
```bash
npm run build
```

### 8B — Checklist funzionale

**GroupDetailView:**
- [ ] Click RIMUOVI → apre GroupToggleDialog
- [ ] Click AGGIUNGI → apre GroupToggleDialog
- [ ] Dialog mostra conteggio slot futuri
- [ ] Dialog mostra ricorrenze attive con giorni/orari
- [ ] Conferma → aggiorna gruppo + slot + ricorrenze
- [ ] Annulla → nessuna modifica

**RecurrencesPage:**
- [ ] Lista ricorrenze con tab Active/Ended/Cancelled
- [ ] Card mostra giorni, orario, clienti, periodo
- [ ] Click card → RecurrenceDetailView

**RecurrenceDetailView:**
- [ ] Modifica orario → aggiorna slot futuri
- [ ] Modifica giorni → avviso limitazione
- [ ] Estendi periodo → genera nuovi slot
- [ ] Aggiungi cliente → aggiunge a ricorrenza e slot futuri
- [ ] Rimuovi cliente → rimuove da ricorrenza e slot futuri
- [ ] Cancella → elimina slot futuri, status → cancelled

**SlotPopup:**
- [ ] Badge ricorrente è cliccabile
- [ ] Click → naviga a RecurrenceDetailView
```

