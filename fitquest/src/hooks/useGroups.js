import { useState, useEffect, useCallback } from 'react'
import { getGroups, addGroup, updateGroup, deleteGroup } from '../firebase/groups'

export function useGroups(trainerId) {
  const [groups,  setGroups]  = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!trainerId) return
    setLoading(true)
    getGroups(trainerId)
      .then(setGroups)
      .finally(() => setLoading(false))
  }, [trainerId])

  const handleAddGroup = useCallback(async (name) => {
    const ref = await addGroup({ name, trainerId, clientIds: [] })
    const newGroup = { id: ref.id, name, trainerId, clientIds: [] }
    setGroups(prev => [...prev, newGroup])
    return newGroup
  }, [trainerId])

  const handleRenameGroup = useCallback(async (id, name) => {
    await updateGroup(id, { name })
    setGroups(prev => prev.map(g => g.id === id ? { ...g, name } : g))
  }, [])

  const handleToggleClient = useCallback(async (groupId, clientId, onAdd, onRemove) => {
    setGroups(prev => {
      const group   = prev.find(g => g.id === groupId)
      const already = group.clientIds.includes(clientId)
      const newIds  = already
        ? group.clientIds.filter(id => id !== clientId)
        : [...group.clientIds, clientId]
      updateGroup(groupId, { clientIds: newIds })
      // Callback per aggiornare gli slot del calendario
      if (already && onRemove) onRemove(groupId, clientId)
      if (!already && onAdd)   onAdd(groupId, clientId)
      return prev.map(g => g.id === groupId ? { ...g, clientIds: newIds } : g)
    })
  }, [])

  const handleDeleteGroup = useCallback(async (id) => {
    await deleteGroup(id)
    setGroups(prev => prev.filter(g => g.id !== id))
  }, [])

  return { groups, loading, handleAddGroup, handleRenameGroup, handleToggleClient, handleDeleteGroup }
}
