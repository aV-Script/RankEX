import { useState, useCallback }                        from 'react'
import { logout, changeTrainerPassword, changeUserEmail } from '../../../firebase/services/auth'
import { Field }                                         from '../../../components/ui'
import { getFirebaseErrorMessage }                       from '../../../utils/firebaseErrors'
import { validatePassword }                              from '../../../utils/validation'

export function AdminProfilePage({ user }) {
  const initials = (user?.email ?? '?').slice(0, 2).toUpperCase()

  // — Password change
  const [openPw,   setOpenPw]   = useState(false)
  const [pwForm,   setPwForm]   = useState({ current: '', password: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwLoading,setPwLoading]= useState(false)
  const [pwSuccess,setPwSuccess]= useState(false)

  // — Email change
  const [openEmail,   setOpenEmail]   = useState(false)
  const [emailForm,   setEmailForm]   = useState({ current: '', newEmail: '' })
  const [emailErrors, setEmailErrors] = useState({})
  const [emailLoading,setEmailLoading]= useState(false)
  const [emailSuccess,setEmailSuccess]= useState(false)

  const setPw    = (key) => (e) => {
    setPwForm(p => ({ ...p, [key]: e.target.value }))
    setPwErrors(p => ({ ...p, [key]: undefined, general: undefined }))
    setPwSuccess(false)
  }
  const setEmail = (key) => (e) => {
    setEmailForm(p => ({ ...p, [key]: e.target.value }))
    setEmailErrors(p => ({ ...p, [key]: undefined, general: undefined }))
    setEmailSuccess(false)
  }

  const handlePwSubmit = useCallback(async () => {
    const e = {}
    if (!pwForm.current)                        e.current  = 'Password attuale obbligatoria'
    const pwCheck = validatePassword(pwForm.password)
    if (!pwCheck.valid)                         e.password = pwCheck.error
    if (pwForm.password !== pwForm.confirm)     e.confirm  = 'Le password non coincidono'
    setPwErrors(e)
    if (Object.keys(e).length > 0) return
    setPwLoading(true)
    try {
      await changeTrainerPassword(pwForm.current, pwForm.password)
      setPwSuccess(true)
      setPwForm({ current: '', password: '', confirm: '' })
      setOpenPw(false)
    } catch (err) {
      setPwErrors({ general: getFirebaseErrorMessage(err, 'Impossibile aggiornare la password') })
    } finally {
      setPwLoading(false)
    }
  }, [pwForm])

  const handleEmailSubmit = useCallback(async () => {
    const e = {}
    if (!emailForm.current)                       e.current  = 'Password attuale obbligatoria'
    if (!emailForm.newEmail.includes('@'))         e.newEmail = 'Email non valida'
    if (emailForm.newEmail === user?.email)        e.newEmail = 'Email uguale a quella attuale'
    setEmailErrors(e)
    if (Object.keys(e).length > 0) return
    setEmailLoading(true)
    try {
      await changeUserEmail(emailForm.current, emailForm.newEmail)
      setEmailSuccess(true)
      setEmailForm({ current: '', newEmail: '' })
      setOpenEmail(false)
    } catch (err) {
      setEmailErrors({ general: getFirebaseErrorMessage(err, 'Impossibile aggiornare l\'email') })
    } finally {
      setEmailLoading(false)
    }
  }, [emailForm, user?.email])

  return (
    <div className="px-6 py-8 max-w-lg">
      <h2 className="font-display font-black text-[18px] text-white mb-6">Profilo</h2>

      {/* Avatar + info */}
      <div
        className="p-5 rounded-[4px] flex items-center gap-4 mb-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 font-display font-black text-[18px]"
          style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}
        >
          {initials}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span
            className="font-display text-[9px] px-2 py-0.5 rounded-[3px] self-start"
            style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}
          >
            SUPER ADMIN
          </span>
          <span className="font-body text-[14px] text-white truncate">{user?.email ?? '—'}</span>
          <span className="font-body text-[11px] text-white/30 truncate">{user?.uid ?? '—'}</span>
        </div>
      </div>

      {/* Azioni account */}
      <div className="rounded-[4px] overflow-hidden mb-5"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Cambio email */}
        <button
          onClick={() => { setOpenEmail(o => !o); setEmailErrors({}); setEmailSuccess(false) }}
          className="w-full flex items-center justify-between px-5 py-4 cursor-pointer transition-all text-left border-none bg-transparent"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div className="flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="rgba(248,113,113,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <div>
              <span className="font-body text-[13px] text-white/60">Cambia email</span>
              <div className="font-body text-[11px] text-white/30 mt-0.5">{user?.email}</div>
            </div>
          </div>
          {emailSuccess
            ? <span className="font-display text-[10px] tracking-wider" style={{ color: '#f87171' }}>VERIFICA INVIATA</span>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: openEmail ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
          }
        </button>

        {openEmail && (
          <div className="px-5 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="pt-4 flex flex-col gap-3">
              <Field label="Password attuale" error={emailErrors.current} htmlFor="adm-em-cur">
                <input id="adm-em-cur" type="password" placeholder="••••••••"
                  value={emailForm.current} onChange={setEmail('current')}
                  className="input-base" autoComplete="current-password" />
              </Field>
              <Field label="Nuova email" error={emailErrors.newEmail} htmlFor="adm-em-new">
                <input id="adm-em-new" type="email" placeholder="nuova@email.com"
                  value={emailForm.newEmail} onChange={setEmail('newEmail')}
                  className="input-base" autoComplete="email" />
              </Field>
              {emailErrors.general && (
                <p className="font-body text-[12px] m-0" style={{ color: '#f87171' }}>{emailErrors.general}</p>
              )}
              <p className="font-body text-[11px] text-white/30 m-0">
                Riceverai un link di verifica alla nuova email prima che la modifica diventi effettiva.
              </p>
              <div className="flex gap-2 mt-1">
                <button onClick={() => { setOpenEmail(false); setEmailErrors({}) }}
                  className="flex-1 py-2.5 font-display text-[12px] cursor-pointer bg-transparent text-white/40 rounded-[3px]"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  ANNULLA
                </button>
                <button onClick={handleEmailSubmit} disabled={emailLoading}
                  className="flex-1 py-2.5 font-display text-[12px] font-bold cursor-pointer rounded-[3px] border-0 disabled:opacity-50 transition-opacity hover:opacity-85"
                  style={{ background: 'linear-gradient(135deg, #f87171, #ef4444)', color: '#fff' }}>
                  {emailLoading ? 'INVIO...' : 'INVIA VERIFICA'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

        {/* Cambio password */}
        <button
          onClick={() => { setOpenPw(o => !o); setPwErrors({}); setPwSuccess(false) }}
          className="w-full flex items-center justify-between px-5 py-4 cursor-pointer transition-all text-left border-none bg-transparent"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div className="flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="rgba(248,113,113,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span className="font-body text-[13px] text-white/60">Cambia password</span>
          </div>
          {pwSuccess
            ? <span className="font-display text-[10px] tracking-wider" style={{ color: '#f87171' }}>AGGIORNATA</span>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: openPw ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
          }
        </button>

        {openPw && (
          <div className="px-5 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="pt-4 flex flex-col gap-3">
              <Field label="Password attuale" error={pwErrors.current} htmlFor="adm-pw-cur">
                <input id="adm-pw-cur" type="password" placeholder="••••••••"
                  value={pwForm.current} onChange={setPw('current')}
                  className="input-base" autoComplete="current-password" />
              </Field>
              <Field label="Nuova password" error={pwErrors.password} htmlFor="adm-pw-new">
                <input id="adm-pw-new" type="password" placeholder="Minimo 8 caratteri e un numero"
                  value={pwForm.password} onChange={setPw('password')}
                  className="input-base" autoComplete="new-password" />
              </Field>
              <Field label="Conferma nuova password" error={pwErrors.confirm} htmlFor="adm-pw-conf">
                <input id="adm-pw-conf" type="password" placeholder="Ripeti la nuova password"
                  value={pwForm.confirm} onChange={setPw('confirm')}
                  className="input-base" autoComplete="new-password" />
              </Field>
              {pwErrors.general && (
                <p className="font-body text-[12px] m-0" style={{ color: '#f87171' }}>{pwErrors.general}</p>
              )}
              <div className="flex flex-col gap-1">
                {[
                  ['Almeno 8 caratteri e un numero', pwForm.password.length >= 8 && /[0-9]/.test(pwForm.password)],
                  ['Le password coincidono',         pwForm.password.length > 0  && pwForm.password === pwForm.confirm],
                ].map(([label, ok]) => (
                  <div key={label} className="flex items-center gap-2 font-body text-[12px]"
                    style={{ color: ok ? '#f87171' : 'rgba(255,255,255,0.2)' }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      {ok
                        ? <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        : <circle cx="5" cy="5" r="3" stroke="currentColor" strokeWidth="1.2"/>
                      }
                    </svg>
                    {label}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={() => { setOpenPw(false); setPwErrors({}) }}
                  className="flex-1 py-2.5 font-display text-[12px] cursor-pointer bg-transparent text-white/40 rounded-[3px]"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  ANNULLA
                </button>
                <button onClick={handlePwSubmit} disabled={pwLoading}
                  className="flex-1 py-2.5 font-display text-[12px] font-bold cursor-pointer rounded-[3px] border-0 disabled:opacity-50 transition-opacity hover:opacity-85"
                  style={{ background: 'linear-gradient(135deg, #f87171, #ef4444)', color: '#fff' }}>
                  {pwLoading ? 'SALVATAGGIO...' : 'AGGIORNA'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer transition-all text-left border-none bg-transparent"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span className="font-body text-[13px] text-red-400">Logout</span>
        </button>
      </div>
    </div>
  )
}
