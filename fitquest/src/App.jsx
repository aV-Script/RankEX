import { useState, useEffect } from 'react'
import FitQuest from './components/FitQuest'
import LoginPage from './components/LoginPage'
import { onAuthChange } from './firebase/services'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = loading

  useEffect(() => {
    const unsub = onAuthChange(u => setUser(u))
    return () => unsub()
  }, [])

  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'Orbitron, monospace', color: 'rgba(255,255,255,0.3)', letterSpacing: 3 }}>LOADING...</div>
      </div>
    )
  }

  return user ? <FitQuest user={user} /> : <LoginPage />
}
