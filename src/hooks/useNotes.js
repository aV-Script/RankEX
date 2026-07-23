import { useState, useEffect, useCallback } from 'react'
import { getNotes }           from '../firebase/services/notes'
import { addNoteUseCase }     from '../usecases/addNoteUseCase'
import { deleteNoteUseCase }  from '../usecases/deleteNoteUseCase'
import { buildNoteThreads }   from '../utils/notes'
import { useToast }           from './useToast'

/**
 * Hook per la gestione delle note/commenti di un cliente.
 *
 * @param {string} orgId
 * @param {string} clientId
 * @param {{ role: string, name: string }} author — ruolo e nome dell'utente corrente
 */
export function useNotes(orgId, clientId, author) {
  const { error: toastError } = useToast()
  const [notes,   setNotes]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId || !clientId) return
    setLoading(true)
    getNotes(orgId, clientId)
      .then(data => setNotes(data))
      .catch(() => toastError('Impossibile caricare le note'))
      .finally(() => setLoading(false))
  }, [orgId, clientId, toastError])

  // Raggruppamento: thread root (parentId null) + loro commenti
  const threads = buildNoteThreads(notes)

  const handleAddThread = useCallback(async (text) => {
    if (!text.trim()) return
    try {
      const item = await addNoteUseCase(orgId, clientId, text.trim(), null)
      setNotes(prev => [...prev, item])
    } catch {
      toastError('Impossibile aggiungere la nota')
    }
  }, [orgId, clientId, toastError])

  const handleAddComment = useCallback(async (parentId, text) => {
    if (!text.trim()) return
    try {
      const item = await addNoteUseCase(orgId, clientId, text.trim(), parentId)
      setNotes(prev => [...prev, item])
    } catch {
      toastError('Impossibile aggiungere il commento')
    }
  }, [orgId, clientId, toastError])

  const handleDelete = useCallback(async (noteId) => {
    try {
      await deleteNoteUseCase(orgId, clientId, noteId)
      // Cascade delete gestito lato BE (eliminaNota) — qui solo pulizia stato locale
      setNotes(prev => prev.filter(n => n.id !== noteId && n.parentId !== noteId))
    } catch {
      toastError('Impossibile eliminare la nota')
    }
  }, [orgId, clientId, toastError])

  return { threads, loading, handleAddThread, handleAddComment, handleDelete }
}
