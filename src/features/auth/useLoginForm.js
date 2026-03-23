import { useState }                      from 'react'
import { login, resetPassword }          from '../../firebase/services/auth'
import { getFirebaseErrorMessage }       from '../../utils/firebaseErrors'
import { validateEmail }                 from '../../utils/validation'

export function useLoginForm() {
  const [view,     setView]     = useState('login') // 'login' | 'reset' | 'reset_sent'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const clearError = () => setError('')

  const handleLogin = async (e) => {
    e.preventDefault()
    const emailCheck = validateEmail(email)
    if (!emailCheck.valid)      { setError(emailCheck.error); return }
    if (!password)              { setError('Password obbligatoria'); return }
    setLoading(true)
    clearError()
    try {
      await login(email.trim(), password)
      // il redirect avviene nel router tramite onAuthChange
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'Errore di accesso'))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    const emailCheck = validateEmail(email)
    if (!emailCheck.valid) { setError(emailCheck.error); return }
    setLoading(true)
    clearError()
    try {
      await resetPassword(email.trim())
      setView('reset_sent')
    } catch (err) {
      setError(getFirebaseErrorMessage(err, 'Impossibile inviare il link'))
    } finally {
      setLoading(false)
    }
  }

  const goTo = (nextView) => { setView(nextView); clearError() }

  return {
    view, email, password, error, loading,
    setEmail, setPassword,
    handleLogin, handleReset,
    goTo,
  }
}