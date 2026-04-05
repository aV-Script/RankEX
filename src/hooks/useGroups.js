import { useState, useEffect, useCallback } from 'react'
import { getGroups, addGroup, updateGroup, deleteGroup } from '../firebase/services/groups'

export function useGroups(orgId) {
  const [groups,  setGroups]  = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    getGroups(orgId)
      .then(setGroups)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [orgId])

  // ── Add group — ottimistico con rollback ──────────────────────────────────
  const handleAddGroup = useCallback(async (name) => {
    const tempId   = `temp_${Date.now()}`
    const newGroup = { id: tempId, name, clientIds: [] }

    setGroups(prev => [...prev, newGroup])

    try {
      const ref      = await addGroup(orgId, { name, clientIds: [] })
      const realGroup = { ...newGroup, id: ref.id }
      setGroups(prev => prev.map(g => g.id === tempId ? realGroup : g))
      return realGroup
    } catch {
      setGroups(prev => prev.filter(g => g.id !== tempId))
    }
  }, [orgId])

  // ── Rename group — ottimistico con rollback ───────────────────────────────
  const handleRenameGroup = useCallback(async (id, name) => {
    const snapshot = groups.find(g => g.id === id)

    setGroups(prev => prev.map(g => g.id === id ? { ...g, name } : g))

    try {
      await updateGroup(orgId, id, { name })
    } catch {
      if (snapshot) setGroups(prev => prev.map(g => g.id === id ? snapshot : g))
    }
  }, [orgId, groups])

  // ── Toggle client — ottimistico con rollback ──────────────────────────────
  const handleToggleClient = useCallback(async (groupId, clientId, onAdd, onRemove) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return

    const already  = group.clientIds.includes(clientId)
    const newIds   = already
      ? group.clientIds.filter(id => id !== clientId)
      : [...group.clientIds, clientId]
    const snapshot = group.clientIds

    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, clientIds: newIds } : g
    ))

    try {
      await updateGroup(orgId, groupId, { clientIds: newIds })
      if (already && onRemove) onRemove(groupId, clientId)
      if (!already && onAdd)   onAdd(groupId, clientId)
    } catch {
      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, clientIds: snapshot } : g
      ))
    }
  }, [orgId, groups])

  // ── Delete group — ottimistico con rollback ───────────────────────────────
  const handleDeleteGroup = useCallback(async (id) => {
    const snapshot = groups.find(g => g.id === id)

    setGroups(prev => prev.filter(g => g.id !== id))

    try {
      await deleteGroup(orgId, id)
    } catch {
      if (snapshot) setGroups(prev => [...prev, snapshot])
    }
  }, [orgId, groups])

  return {
    groups,
    isLoading: loading,
    fetchError: error,
    handleAddGroup,
    handleRenameGroup,
    handleToggleClient,
    handleDeleteGroup,
  }
}
