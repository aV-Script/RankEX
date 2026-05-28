import { useState, useEffect, useCallback } from 'react'
import { getAuth }                          from 'firebase/auth'
import app                                  from '../firebase/config'
import { getNotes, addNote, deleteNoteItem } from '../firebase/services/notes'
import { useToast }                         from './useToast'

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

  // UID catturato al mount — currentUser è garantito non-null se il componente è visibile
  const authorId = getAuth(app).currentUser?.uid ?? ''

  useEffect(() => {
    if (!orgId || !clientId) return
    setLoading(true)
    getNotes(orgId, clientId)
      .then(data => setNotes(data))
      .catch(() => toastError('Impossibile caricare le note'))
      .finally(() => setLoading(false))
  }, [orgId, clientId, toastError])

  // Raggruppamento: thread root (parentId null) + loro commenti
  const threads = notes
    .filter(n => !n.parentId)
    .map(root => ({
      ...root,
      comments: notes.filter(n => n.parentId === root.id),
    }))

  const handleAddThread = useCallback(async (text) => {
    if (!text.trim()) return
    const data = {
      text:       text.trim(),
      authorId,
      authorName: author.name,
      authorRole: author.role,
      parentId:   null,
    }
    try {
      const ref  = await addNote(orgId, clientId, data)
      const item = { id: ref.id, ...data, createdAt: new Date().toISOString() }
      setNotes(prev => [...prev, item])
    } catch {
      toastError('Impossibile aggiungere la nota')
    }
  }, [orgId, clientId, author, authorId, toastError])

  const handleAddComment = useCallback(async (parentId, text) => {
    if (!text.trim()) return
    const data = {
      text:       text.trim(),
      authorId,
      authorName: author.name,
      authorRole: author.role,
      parentId,
    }
    try {
      const ref  = await addNote(orgId, clientId, data)
      const item = { id: ref.id, ...data, createdAt: new Date().toISOString() }
      setNotes(prev => [...prev, item])
    } catch {
      toastError('Impossibile aggiungere il commento')
    }
  }, [orgId, clientId, author, authorId, toastError])

  const handleDelete = useCallback(async (noteId) => {
    const toDelete = notes.filter(n => n.id === noteId || n.parentId === noteId)
    try {
      await Promise.all(toDelete.map(n => deleteNoteItem(orgId, clientId, n.id)))
      setNotes(prev => prev.filter(n => n.id !== noteId && n.parentId !== noteId))
    } catch {
      toastError('Impossibile eliminare la nota')
    }
  }, [orgId, clientId, notes, toastError])

  return { threads, loading, handleAddThread, handleAddComment, handleDelete }
}
