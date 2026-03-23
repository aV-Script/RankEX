import { useState, useEffect, useCallback } from 'react'
import { getGroups, addGroup, updateGroup, deleteGroup } from '../firebase/services/groups'

export function useGroups(trainerId) {
  const [groups,  setGroups]  = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!trainerId) return
    setLoading(true)
    setError(null)
    getGroups(trainerId)
      .then(setGroups)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [trainerId])

  // ── Add group — ottimistico con rollback ──────────────────────────────────
  const handleAddGroup = useCallback(async (name) => {
    const tempId   = `temp_${Date.now()}`
    const newGroup = { id: tempId, name, trainerId, clientIds: [] }

    setGroups(prev => [...prev, newGroup])

    try {
      const ref     = await addGroup({ name, trainerId, clientIds: [] })
      const realGroup = { ...newGroup, id: ref.id }
      // Sostituisce il temp con l'id reale di Firestore
      setGroups(prev => prev.map(g => g.id === tempId ? realGroup : g))
      return realGroup
    } catch {
      setGroups(prev => prev.filter(g => g.id !== tempId))
    }
  }, [trainerId])

  // ── Rename group — ottimistico con rollback ───────────────────────────────
  const handleRenameGroup = useCallback(async (id, name) => {
    const snapshot = groups.find(g => g.id === id)

    setGroups(prev => prev.map(g => g.id === id ? { ...g, name } : g))

    try {
      await updateGroup(id, { name })
    } catch {
      if (snapshot) setGroups(prev => prev.map(g => g.id === id ? snapshot : g))
    }
  }, [groups])

  // ── Toggle client — ottimistico con rollback ──────────────────────────────
  const handleToggleClient = useCallback(async (groupId, clientId, onAdd, onRemove) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return

    const already   = group.clientIds.includes(clientId)
    const newIds    = already
      ? group.clientIds.filter(id => id !== clientId)
      : [...group.clientIds, clientId]
    const snapshot  = group.clientIds

    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, clientIds: newIds } : g
    ))

    try {
      await updateGroup(groupId, { clientIds: newIds })
      if (already && onRemove) onRemove(groupId, clientId)
      if (!already && onAdd)   onAdd(groupId, clientId)
    } catch {
      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, clientIds: snapshot } : g
      ))
    }
  }, [groups])

  // ── Delete group — ottimistico con rollback ───────────────────────────────
  const handleDeleteGroup = useCallback(async (id) => {
    const snapshot = groups.find(g => g.id === id)

    setGroups(prev => prev.filter(g => g.id !== id))

    try {
      await deleteGroup(id)
    } catch {
      if (snapshot) setGroups(prev => [...prev, snapshot])
    }
  }, [groups])

  return {
    groups,
    loading,
    error,
    handleAddGroup,
    handleRenameGroup,
    handleToggleClient,
    handleDeleteGroup,
  }
}
