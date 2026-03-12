import { useState } from 'react'
import { login, register } from '../firebase/services'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      isRegister ? await register(email, password) : await login(email, password)
    } catch (err) {
      const messages = {
        'auth/user-not-found':       'Utente non trovato',
        'auth/wrong-password':       'Password errata',
        'auth/email-already-in-use': 'Email già registrata',
        'auth/weak-password':        'Password troppo corta (min. 6 caratteri)',
        'auth/invalid-email':        'Email non valida',
        'auth/invalid-credential':   'Credenziali non valide',
      }
      setError(messages[err.code] || 'Errore: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: '#070b14' }}
    >
      {/* ── Lato sinistro — branding (nascosto su mobile) ── */}
      <div
        className="hidden lg:flex flex-col justify-between flex-1 p-14 relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 30% 20%, #0f1f3d 0%, #070b14 70%)' }}
      >
        {/* Griglia decorativa di fondo */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        {/* Cerchi decorativi rank in background */}
        <RankDecorations />

        {/* Logo */}
        <div className="relative z-10">
          <div className="font-display font-black text-[22px] text-white tracking-wider">
            FIT<span className="font-normal text-blue-400">QUEST</span>
          </div>
        </div>

        {/* Claim centrale */}
        <div className="relative z-10">
          <p className="font-display text-[11px] text-blue-400 tracking-[4px] mb-4">
            PERSONAL TRAINER PORTAL
          </p>
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

        {/* Footer stats */}
        <div className="relative z-10 flex gap-8">
          {[['17', 'livelli di rank'], ['5', 'test scientifici'], ['∞', 'progressioni']].map(([num, label]) => (
            <div key={label}>
              <div className="font-display font-black text-[28px] text-white">{num}</div>
              <div className="font-body text-[12px] text-white/30 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Divisore verticale ── */}
      <div className="hidden lg:block w-px" style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent)' }} />

      {/* ── Lato destro — form ── */}
      <div className="flex-1 lg:max-w-[480px] flex flex-col items-center justify-center px-8 py-12"
        style={{ background: 'radial-gradient(ellipse at 80% 10%, #0f1f3d 0%, #070b14 60%)' }}>

        {/* Logo solo su mobile */}
        <div className="lg:hidden text-center mb-10">
          <div className="font-display font-black text-[28px] bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            FIT<span className="font-normal">QUEST</span>
          </div>
          <div className="text-white/30 font-body text-[12px] mt-1 tracking-[3px]">PERSONAL TRAINER PORTAL</div>
        </div>

        <div className="w-full max-w-[360px]">
          {/* Intestazione form */}
          <div className="mb-8">
            <h2 className="font-display font-black text-[26px] text-white m-0">
              {isRegister ? 'Crea account' : 'Bentornato'}
            </h2>
            <p className="font-body text-white/40 text-[14px] mt-1.5 m-0">
              {isRegister
                ? 'Registrati come personal trainer'
                : 'Accedi alla tua dashboard'}
            </p>
          </div>

          {/* Form fields */}
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-1.5">EMAIL</label>
              <input
                className="input-base w-full"
                type="email"
                placeholder="trainer@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <div>
              <label className="font-display text-[10px] text-white/30 tracking-[2px] block mb-1.5">PASSWORD</label>
              <input
                className="input-base w-full"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-2.5 bg-red-500/10 border border-red-400/20">
                <p className="text-red-400 font-body text-[13px] m-0">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`rounded-xl py-3.5 text-white font-display text-[13px] font-bold tracking-wider border-0 mt-1 transition-opacity duration-200 ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            >
              {loading ? 'ATTENDI...' : isRegister ? 'CREA ACCOUNT' : 'ACCEDI'}
            </button>
          </div>

          {/* Toggle register/login */}
          <div className="mt-6 pt-6 border-t border-white/[.06] text-center">
            <span className="font-body text-white/30 text-[13px]">
              {isRegister ? 'Hai già un account?' : 'Nuovo trainer?'}
            </span>
            {' '}
            <button
              onClick={() => { setIsRegister(!isRegister); setError('') }}
              className="bg-transparent border-none font-body text-[13px] text-blue-400 cursor-pointer hover:text-blue-300 transition-colors p-0"
            >
              {isRegister ? 'Accedi' : 'Registrati'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Cerchi decorativi con i colori dei rank — solo estetici
function RankDecorations() {
  const items = [
    { label: 'EX',  color: '#ffd700', x: 72,  y: 18,  size: 80 },
    { label: 'S+',  color: '#ff6fd8', x: 18,  y: 42,  size: 56 },
    { label: 'A',   color: '#60a5fa', x: 78,  y: 62,  size: 64 },
    { label: 'B+',  color: '#38bdf8', x: 30,  y: 75,  size: 44 },
    { label: 'SS',  color: '#ff8e53', x: 55,  y: 38,  size: 48 },
  ]
  return (
    <>
      {items.map(({ label, color, x, y, size }) => (
        <div
          key={label}
          style={{
            position: 'absolute',
            left: `${x}%`, top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            width: size, height: size,
            borderRadius: '50%',
            border: `1.5px solid ${color}33`,
            background: color + '08',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 900,
            fontSize: size * 0.28,
            color: color + '44',
            userSelect: 'none',
          }}
        >
          {label}
        </div>
      ))}
    </>
  )
}
