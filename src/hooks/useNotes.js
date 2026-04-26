import { useState, useEffect, useCallback } from 'react'
import { getAuth }                          from 'firebase/auth'
import app                                  from '../firebase/config'
import { getNotes, addNote, deleteNoteItem } from '../firebase/services/notes'

/**
 * Hook per la gestione delle note/commenti di un cliente.
 *
 * @param {string} orgId
 * @param {string} clientId
 * @param {{ role: string, name: string }} author — ruolo e nome dell'utente corrente
 */
export function useNotes(orgId, clientId, author) {
  const [notes,   setNotes]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId || !clientId) return
    setLoading(true)
    getNotes(orgId, clientId).then(data => {
      setNotes(data)
      setLoading(false)
    })
  }, [orgId, clientId])

  // Raggruppamento: thread root (parentId null) + loro commenti
  const threads = notes
    .filter(n => !n.parentId)
    .map(root => ({
      ...root,
      comments: notes.filter(n => n.parentId === root.id),
    }))

  const getAuthorId = () => getAuth(app).currentUser?.uid ?? ''

  const handleAddThread = useCallback(async (text) => {
    if (!text.trim()) return
    const data = {
      text:       text.trim(),
      authorId:   getAuthorId(),
      authorName: author.name,
      authorRole: author.role,
      parentId:   null,
    }
    const ref  = await addNote(orgId, clientId, data)
    const item = { id: ref.id, ...data, createdAt: new Date().toISOString() }
    setNotes(prev => [...prev, item])
  }, [orgId, clientId, author])

  const handleAddComment = useCallback(async (parentId, text) => {
    if (!text.trim()) return
    const data = {
      text:       text.trim(),
      authorId:   getAuthorId(),
      authorName: author.name,
      authorRole: author.role,
      parentId,
    }
    const ref  = await addNote(orgId, clientId, data)
    const item = { id: ref.id, ...data, createdAt: new Date().toISOString() }
    setNotes(prev => [...prev, item])
  }, [orgId, clientId, author])

  const handleDelete = useCallback(async (noteId) => {
    // Elimina nota e tutti i suoi commenti (se è un thread root)
    const toDelete = notes.filter(n => n.id === noteId || n.parentId === noteId)
    await Promise.all(toDelete.map(n => deleteNoteItem(orgId, clientId, n.id)))
    setNotes(prev => prev.filter(n => n.id !== noteId && n.parentId !== noteId))
  }, [orgId, clientId, notes])

  return { threads, loading, handleAddThread, handleAddComment, handleDelete }
}
