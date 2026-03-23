import { createContext, useContext, useState, useCallback } from 'react'
import { Toast }             from '../components/common/Toast'
import { TOAST_DURATION_MS } from '../config/app.config'

const ToastContext = createContext(null)

const MAX_TOASTS  = 3
let   nextToastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback(({ message, variant = 'info' }) => {
    const id = ++nextToastId
    setToasts(prev => [...prev, { id, message, variant }].slice(-MAX_TOASTS))
    setTimeout(() => removeToast(id), TOAST_DURATION_MS)
  }, [removeToast])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <Toast toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  return useContext(ToastContext)
}
