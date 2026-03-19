import { createContext, useContext, useReducer } from 'react'

export const ACTIONS = {
  SET_LOADING:     'SET_LOADING',
  SET_ERROR:       'SET_ERROR',
  SET_CLIENTS:     'SET_CLIENTS',
  ADD_CLIENT:      'ADD_CLIENT',
  UPDATE_CLIENT:   'UPDATE_CLIENT',
  SELECT_CLIENT:   'SELECT_CLIENT',
  DESELECT_CLIENT: 'DESELECT_CLIENT',
  REMOVE_CLIENT:   'REMOVE_CLIENT'
}

const initialState = { clients: [], loading: false, error: null, selectedClient: null }

function reducer(state, { type, payload }) {
  switch (type) {
    case ACTIONS.SET_LOADING:     return { ...state, loading: payload, error: null }
    case ACTIONS.SET_ERROR:       return { ...state, loading: false, error: payload }
    case ACTIONS.SET_CLIENTS:     return { ...state, clients: payload, loading: false }
    case ACTIONS.ADD_CLIENT:      return { ...state, clients: [...state.clients, payload] }
    case ACTIONS.UPDATE_CLIENT:   return {
      ...state,
      clients:        state.clients.map(c => c.id === payload.id ? { ...c, ...payload } : c),
      selectedClient: state.selectedClient?.id === payload.id ? { ...state.selectedClient, ...payload } : state.selectedClient,
    }
    case ACTIONS.SELECT_CLIENT:   return { ...state, selectedClient: payload }
    case ACTIONS.DESELECT_CLIENT: return { ...state, selectedClient: null }
    case ACTIONS.REMOVE_CLIENT:
      return {
        ...state,
        clients: state.clients.filter(c => c.id !== payload),
        selectedClient: state.selectedClient?.id === payload ? null : state.selectedClient,
      }
    default: return state
  }
}

const StateCtx    = createContext(null)
const DispatchCtx = createContext(null)

export function ClientProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        {children}
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  )
}

export const useClientState    = () => useContext(StateCtx)
export const useClientDispatch = () => useContext(DispatchCtx)
