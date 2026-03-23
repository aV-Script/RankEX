import { useCallback } from 'react'
import { useToastContext } from '../context/ToastContext'

export function useToast() {
  const addToast = useToastContext()
  const success = useCallback((message) => addToast({ message, variant: 'success' }), [addToast])
  const error   = useCallback((message) => addToast({ message, variant: 'error'   }), [addToast])
  const warning = useCallback((message) => addToast({ message, variant: 'warning' }), [addToast])
  const info    = useCallback((message) => addToast({ message, variant: 'info'    }), [addToast])
  return { success, error, warning, info }
}
