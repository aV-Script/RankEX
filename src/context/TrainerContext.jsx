import { createContext, useContext, useReducer } from 'react'

// ── Azioni ────────────────────────────────────────────────────────────────────
export const ACTIONS = Object.freeze({
  SELECT_CLIENT:   'SELECT_CLIENT',
  DESELECT_CLIENT: 'DESELECT_CLIENT',
})

// ── Stato iniziale ────────────────────────────────────────────────────────────
const initialState = {
  selectedClient: null,
}

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, { type, payload }) {
  switch (type) {
    case ACTIONS.SELECT_CLIENT:
      return { ...state, selectedClient: payload }

    case ACTIONS.DESELECT_CLIENT:
      return { ...state, selectedClient: null }

    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const StateCtx    = createContext(null)
const DispatchCtx = createContext(null)

// ── Provider ──────────────────────────────────────────────────────────────────
export function TrainerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        {children}
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  )
}

// ── Hook consumers ────────────────────────────────────────────────────────────
export function useTrainerState() {
  const ctx = useContext(StateCtx)
  if (!ctx) throw new Error('useTrainerState deve essere usato dentro <TrainerProvider>')
  return ctx
}

export function useTrainerDispatch() {
  const ctx = useContext(DispatchCtx)
  if (!ctx) throw new Error('useTrainerDispatch deve essere usato dentro <TrainerProvider>')
  return ctx
}