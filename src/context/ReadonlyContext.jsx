import { createContext, useContext } from 'react'

const ReadonlyCtx = createContext(false)

export function ReadonlyProvider({ readonly, children }) {
  return (
    <ReadonlyCtx.Provider value={!!readonly}>
      {children}
    </ReadonlyCtx.Provider>
  )
}

export function useReadonly() {
  return useContext(ReadonlyCtx)
}
