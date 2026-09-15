import { useState }                      from 'react'
import { login, resetPassword }          from '../../firebase/services/auth'
import { getFirebaseErrorMessage, getLoginErrorMessage } from '../../utils/firebaseErrors'
import { validateEmail }                 from '../../utils/validation'
import { auditLog, AUDIT_ACTIONS }       from '../../utils/auditLog'
import { logFailedLoginUseCase }         from '../../usecases/logFailedLoginUseCase'

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
      await auditLog(AUDIT_ACTIONS.LOGIN)
      // il redirect avviene nel router tramite onAuthChange
    } catch (err) {
      // Pattern invertito rispetto al resto del file (STORY-017/EPIC-007, vedi
      // ADR-004): qui non esiste un utente autenticato che possa chiamare
      // auditLog() da client (auditLog abortisce sempre se currentUser è null
      // — bug reale che questa story risolve, vedi ADR-004). La Cloud Function
      // registraLoginFallito scrive l'entry lato server con l'Admin SDK.
      // AUDIT_ACTIONS.LOGIN_FAILED resta come costante di tipizzazione, ma il
      // valore 'auth.login_failed' è hardcoded server-side, non passato da qui.
      logFailedLoginUseCase(email.trim()).catch(() => {})
      // getLoginErrorMessage (non getFirebaseErrorMessage): anti account-enumeration,
      // vedi STORY-018/EPIC-007 — qui, a differenza di handleReset/cambio password,
      // l'identità non è ancora nota.
      setError(getLoginErrorMessage(err))
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