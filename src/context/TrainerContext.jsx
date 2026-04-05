import { createContext, useContext, useReducer } from 'react'

// ── Azioni ────────────────────────────────────────────────────────────────────
export const ACTIONS = Object.freeze({
  SELECT_CLIENT:   'SELECT_CLIENT',
  DESELECT_CLIENT: 'DESELECT_CLIENT',
})

// ── Stato iniziale ────────────────────────────────────────────────────────────
const initialState = {
  selectedClient: null,
  // Info org — popolate dal Provider
  orgId:       null,
  moduleType:  null,
  terminology: null,
  userRole:    null,
  orgPlan:     'free',
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
/**
 * @param {{ orgId, moduleType, terminology, userRole, orgPlan, children }} props
 */
export function TrainerProvider({ orgId, moduleType, terminology, userRole, orgPlan, children }) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    orgId,
    moduleType,
    terminology,
    userRole,
    orgPlan: orgPlan ?? 'free',
  })

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
