import { useState } from 'react'
import { login, register } from '../firebase/services'

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '12px 16px', color: '#fff', fontFamily: 'Rajdhani, sans-serif',
  fontSize: 15, boxSizing: 'border-box', outline: 'none',
}

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      if (isRegister) {
        await register(email, password)
      } else {
        await login(email, password)
      }
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'Utente non trovato',
        'auth/wrong-password': 'Password errata',
        'auth/email-already-in-use': 'Email già registrata',
        'auth/weak-password': 'Password troppo corta (min. 6 caratteri)',
        'auth/invalid-email': 'Email non valida',
        'auth/invalid-credential': 'Credenziali non valide',
      }
      setError(messages[err.code] || 'Errore: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 20% 0%, #0f1f3d 0%, #070b14 60%)' }}>
      <div style={{ width: 360, padding: 40, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24 }}>
        
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontWeight: 900, fontSize: 28, background: 'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            FIT<span style={{ fontWeight: 400 }}>QUEST</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Rajdhani, sans-serif', fontSize: 13, marginTop: 6, letterSpacing: 2 }}>
            PERSONAL TRAINER PORTAL
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            style={inputStyle}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />

          {error && (
            <div style={{ color: '#f87171', fontFamily: 'Rajdhani, sans-serif', fontSize: 13, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontFamily: 'Orbitron, monospace', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: 1, opacity: loading ? 0.6 : 1 }}>
            {loading ? '...' : isRegister ? 'REGISTRATI' : 'ACCEDI'}
          </button>

          <button
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontFamily: 'Rajdhani, sans-serif', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
            {isRegister ? 'Hai già un account? Accedi' : 'Nuovo trainer? Registrati'}
          </button>
        </div>
      </div>
    </div>
  )
}
