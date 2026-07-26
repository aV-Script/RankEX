import { useState, useEffect, useCallback } from 'react'
import { getGroups }             from '../firebase/services/groups'
import { addGroupUseCase }       from '../usecases/addGroupUseCase'
import { updateGroupUseCase }    from '../usecases/updateGroupUseCase'
import { deleteGroupUseCase }    from '../usecases/deleteGroupUseCase'
import { useToast }              from './useToast'

export function useGroups(orgId) {
  const [groups,  setGroups]  = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const { error: toastError } = useToast()

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
      const realId   = await addGroupUseCase(orgId, name)
      const realGroup = { ...newGroup, id: realId }
      setGroups(prev => prev.map(g => g.id === tempId ? realGroup : g))
      return realGroup
    } catch {
      setGroups(prev => prev.filter(g => g.id !== tempId))
      toastError('Impossibile creare il gruppo')
    }
  }, [orgId, toastError])

  // ── Rename group — ottimistico con rollback ───────────────────────────────
  const handleRenameGroup = useCallback(async (id, name) => {
    const oldName = groups.find(g => g.id === id)?.name

    setGroups(prev => prev.map(g => g.id === id ? { ...g, name } : g))

    try {
      await updateGroupUseCase(orgId, id, { name })
    } catch {
      if (oldName !== undefined) {
        setGroups(prev => prev.map(g => g.id === id ? { ...g, name: oldName } : g))
      }
      toastError('Impossibile rinominare il gruppo')
    }
  }, [orgId, groups, toastError])

  // ── Toggle client — ottimistico con rollback ──────────────────────────────
  // Non mostra un proprio toast: il chiamante (GroupDetailView) avvolge questa
  // chiamata insieme alla sincronizzazione slot e mostra un unico feedback.
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
      await updateGroupUseCase(orgId, groupId, { clientIds: newIds })
      if (already && onRemove) onRemove(groupId, clientId)
      if (!already && onAdd)   onAdd(groupId, clientId)
    } catch (err) {
      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, clientIds: snapshot } : g
      ))
      throw err
    }
  }, [orgId, groups])

  // ── Delete group — ottimistico con rollback ───────────────────────────────
  // Non mostra un proprio toast: rilancia l'errore così il chiamante
  // (GroupDetailView) può decidere se navigare via solo in caso di successo.
  const handleDeleteGroup = useCallback(async (id) => {
    const snapshot = groups.find(g => g.id === id)

    setGroups(prev => prev.filter(g => g.id !== id))

    try {
      await deleteGroupUseCase(orgId, id)
    } catch (err) {
      if (snapshot) setGroups(prev => [...prev, snapshot])
      throw err
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
