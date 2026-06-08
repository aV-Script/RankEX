import { useState }      from 'react'
import { FormField, ErrorBox, SubmitButton } from './primitives'

const ICON_EYE = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const ICON_EYE_OFF = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

export function LoginForm({ form }) {
  const { email, password, error, loading, setEmail, setPassword, handleLogin, goTo } = form
  const [showPassword, setShowPassword] = useState(false)

  return (
    <>
      <div className="mb-8">
        <h2 className="font-display font-black text-[26px] text-white m-0">Bentornato</h2>
        <p className="font-body text-white/40 text-[14px] mt-1.5 m-0">
          Accedi alla tua dashboard
        </p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-3.5" noValidate>
        <FormField label="Email" htmlFor="login-email">
          <input
            id="login-email"
            type="email"
            className="input-base w-full"
            placeholder="trainer@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
          />
        </FormField>

        <FormField label="Password" htmlFor="login-password">
          <div style={{ position: 'relative' }}>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="input-base w-full"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.35)', display: 'flex', padding: 2,
              }}
            >
              {showPassword ? ICON_EYE_OFF : ICON_EYE}
            </button>
          </div>
        </FormField>

        {error && <ErrorBox>{error}</ErrorBox>}

        <SubmitButton loading={loading}>ACCEDI</SubmitButton>
      </form>

      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={() => goTo('reset')}
          className="bg-transparent border-none font-body text-[13px] cursor-pointer hover:text-white/70 transition-colors p-0"
          style={{ color: 'rgba(255,255,255,0.50)' }}
        >
          Password dimenticata?
        </button>
      </div>
    </>
  )
}