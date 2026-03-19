import { useState } from 'react'
import { login, resetPassword } from '../firebase/services'

// Tre schermate: 'login' | 'reset' | 'reset_sent'
export default function LoginPage() {
  const [screen,   setScreen]   = useState('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const AUTH_ERRORS = {
    'auth/user-not-found':     'Nessun account associato a questa email',
    'auth/wrong-password':     'Password non corretta',
    'auth/invalid-email':      'Formato email non valido',
    'auth/invalid-credential': 'Credenziali non valide',
    'auth/too-many-requests':  'Troppi tentativi. Riprova tra qualche minuto',
    'auth/user-disabled':      'Account disabilitato',
  }

  const handleLogin = async () => {
    if (!email.trim() || !password) return
    setLoading(true); setError('')
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(AUTH_ERRORS[err.code] || 'Errore di accesso')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!email.trim()) { setError('Inserisci la tua email'); return }
    setLoading(true); setError('')
    try {
      await resetPassword(email.trim())
      setScreen('reset_sent')
    } catch (err) {
      setError(AUTH_ERRORS[err.code] || 'Impossibile inviare il link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#070b14' }}>

      {/* ── Lato sinistro — branding (solo desktop) ── */}
      <div
        className="hidden lg:flex flex-col justify-between flex-1 p-14 relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 30% 20%, #0f1f3d 0%, #070b14 70%)' }}
      >
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        <RankDecorations />
        <div className="relative z-10">
          <div className="font-display font-black text-[22px] text-white tracking-wider">
            FIT<span className="font-normal text-blue-400">QUEST</span>
          </div>
        </div>
        <div className="relative z-10">
          <p className="font-display text-[11px] text-blue-400 tracking-[4px] mb-4">PERSONAL TRAINER PORTAL</p>
          <h1 className="font-display font-black text-[52px] leading-[1.05] text-white m-0">
            Allena.<br />
            <span style={{ color: '#a78bfa' }}>Misura.</span><br />
            Evolvi.
          </h1>
          <p className="font-body text-white/40 text-[15px] mt-6 leading-relaxed max-w-sm">
            Trasforma ogni sessione in progressione misurabile.
            Gamifica i risultati dei tuoi clienti con statistiche
            reali e un sistema di rank dinamico.
          </p>
        </div>
        <div className="relative z-10 flex gap-8">
          {[['17', 'livelli di rank'], ['5', 'test scientifici'], ['∞', 'progressioni']].map(([num, label]) => (
            <div key={label}>
              <div className="font-display font-black text-[28px] text-white">{num}</div>
              <div className="font-body text-[12px] text-white/30 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* divisore */}
      <div className="hidden lg:block w-px" style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent)' }} />

      {/* ── Lato destro — form ── */}
      <div
        className="flex-1 lg:max-w-[480px] flex flex-col items-center justify-center px-8 py-12"
        style={{ background: 'radial-gradient(ellipse at 80% 10%, #0f1f3d 0%, #070b14 60%)' }}
      >
        {/* Logo solo mobile */}
        <div className="lg:hidden text-center mb-10">
          <div className="font-display font-black text-[28px] bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            FITQUEST
          </div>
          <div className="text-white/30 font-body text-[12px] mt-1 tracking-[3px]">PERSONAL TRAINER PORTAL</div>
        </div>

        <div className="w-full max-w-[360px]">

          {/* ── Schermata LOGIN ── */}
          {screen === 'login' && (
            <>
              <div className="mb-8">
                <h2 className="font-display font-black text-[26px] text-white m-0">Bentornato</h2>
                <p className="font-body text-white/40 text-[14px] mt-1.5 m-0">Accedi alla tua dashboard</p>
              </div>
              <div className="flex flex-col gap-3.5">
                <FormField label="EMAIL">
                  <input className="input-base w-full" type="email" placeholder="trainer@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus />
                </FormField>
                <FormField label="PASSWORD">
                  <input className="input-base w-full" type="password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                </FormField>
                {error && <ErrorBox>{error}</ErrorBox>}
                <PrimaryButton loading={loading} onClick={handleLogin}>ACCEDI</PrimaryButton>
              </div>
              <div className="mt-5 text-center">
                <button
                  onClick={() => { setScreen('reset'); setError('') }}
                  className="bg-transparent border-none font-body text-[13px] text-white/30 cursor-pointer hover:text-white/50 transition-colors p-0"
                >
                  Password dimenticata?
                </button>
              </div>
            </>
          )}

          {/* ── Schermata RESET PASSWORD ── */}
          {screen === 'reset' && (
            <>
              <div className="mb-8">
                <h2 className="font-display font-black text-[26px] text-white m-0">Recupera password</h2>
                <p className="font-body text-white/40 text-[14px] mt-1.5 m-0">
                  Inserisci la tua email e ti invieremo un link per reimpostare la password.
                </p>
              </div>
              <div className="flex flex-col gap-3.5">
                <FormField label="EMAIL">
                  <input className="input-base w-full" type="email" placeholder="trainer@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleReset()} autoFocus />
                </FormField>
                {error && <ErrorBox>{error}</ErrorBox>}
                <PrimaryButton loading={loading} onClick={handleReset}>INVIA LINK</PrimaryButton>
              </div>
              <div className="mt-5 text-center">
                <button
                  onClick={() => { setScreen('login'); setError('') }}
                  className="bg-transparent border-none font-body text-[13px] text-white/30 cursor-pointer hover:text-white/50 transition-colors p-0"
                >
                  Torna al login
                </button>
              </div>
            </>
          )}

          {/* ── Schermata CONFERMA INVIO ── */}
          {screen === 'reset_sent' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 className="font-display font-black text-[22px] text-white m-0 mb-3">Email inviata</h2>
              <p className="font-body text-white/40 text-[14px] leading-relaxed m-0 mb-8">
                Controlla la tua casella di posta. Il link per reimpostare la password è valido per 1 ora.
              </p>
              <button
                onClick={() => { setScreen('login'); setError('') }}
                className="bg-transparent border-none font-body text-[13px] text-blue-400 cursor-pointer hover:text-blue-300 transition-colors p-0"
              >
                Torna al login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Componenti interni ────────────────────────────────────────────────────────

function FormField({ label, children }) {
  return (
    <div>
      <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function ErrorBox({ children }) {
  return (
    <div className="rounded-xl px-4 py-2.5 bg-red-500/10 border border-red-400/20">
      <p className="text-red-400 font-body text-[13px] m-0">{children}</p>
    </div>
  )
}

function PrimaryButton({ loading, onClick, children }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`rounded-xl py-3.5 text-white font-display text-[13px] font-bold tracking-wider border-0 mt-1 transition-opacity ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
      style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
    >
      {loading ? 'ATTENDI...' : children}
    </button>
  )
}

function RankDecorations() {
  const items = [
    { label: 'EX',  color: '#ffd700', x: 72, y: 18, size: 80 },
    { label: 'S+',  color: '#ff6fd8', x: 18, y: 42, size: 56 },
    { label: 'A',   color: '#60a5fa', x: 78, y: 62, size: 64 },
    { label: 'B+',  color: '#38bdf8', x: 30, y: 75, size: 44 },
    { label: 'SS',  color: '#ff8e53', x: 55, y: 38, size: 48 },
  ]
  return (
    <>
      {items.map(({ label, color, x, y, size }) => (
        <div key={label} style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          width: size, height: size, borderRadius: '50%',
          border: `1.5px solid ${color}33`, background: color + '08',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 900,
          fontSize: size * 0.28, color: color + '44', userSelect: 'none',
        }}>
          {label}
        </div>
      ))}
    </>
  )
}
