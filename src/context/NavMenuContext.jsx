import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const NavMenuCtx = createContext(null)
let _idCounter = 0

export function NavMenuProvider({ children }) {
  const [registeredIds, setRegisteredIds] = useState([])
  const menuDataRef = useRef({})

  const register = useCallback((id, data) => {
    menuDataRef.current[id] = data
    setRegisteredIds(prev => prev.includes(id) ? prev : [...prev, id])
  }, [])

  const update = useCallback((id, data) => {
    if (menuDataRef.current[id]) menuDataRef.current[id] = data
  }, [])

  const unregister = useCallback((id) => {
    delete menuDataRef.current[id]
    setRegisteredIds(prev => {
      const next = prev.filter(i => i !== id)
      return next.length === prev.length ? prev : next
    })
  }, [])

  const value = useMemo(
    () => ({ registeredIds, menuDataRef, register, update, unregister }),
    [registeredIds, register, update, unregister]
  )

  return <NavMenuCtx.Provider value={value}>{children}</NavMenuCtx.Provider>
}

export function useNavMenus() {
  const ctx = useContext(NavMenuCtx)
  return useMemo(() => {
    if (!ctx) return []
    return ctx.registeredIds.map(id => ctx.menuDataRef.current[id]).filter(Boolean)
  }, [ctx])
}

/**
 * Registers a context menu in the unified CircularNav.
 * Items must be a stable reference (module-level constant or useMemo).
 * Pass items=[] or items=undefined to unregister (no menu shown).
 */
export function useRegisterContextMenu(label, items, activeId, onSelect) {
  const ctx = useContext(NavMenuCtx)

  const idRef = useRef(null)
  if (idRef.current === null) idRef.current = `ctx-${++_idCounter}`
  const id = idRef.current

  const { register, update, unregister } = ctx ?? {}
  const hasItems = !!items?.length

  // Register / unregister when hasItems changes or on mount / unmount
  useEffect(() => {
    if (!register || !unregister) return
    if (!hasItems) {
      unregister(id)
      return
    }
    register(id, { label, items, activeId, onSelect })
    return () => unregister(id)
  }, [id, hasItems, register, unregister]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep data fresh every render — writes to ref, no re-render cascade
  useEffect(() => {
    if (!update || !hasItems) return
    update(id, { label, items, activeId, onSelect })
  })
}
