import { useState, useEffect } from 'react'
import FitQuest from './components/FitQuest'
import ClientView from './components/client/ClientView'
import ChangePasswordScreen from './components/client/ChangePasswordScreen'
import LoginPage from './components/LoginPage'
import { onAuthChange, getUserProfile } from './firebase/services'

export default function App() {
  const [user,    setUser]    = useState(undefined)
  const [profile, setProfile] = useState(null)

  const refreshProfile = async (uid) => {
    const p = await getUserProfile(uid)
    setProfile(p)
  }

  useEffect(() => {
    return onAuthChange(async (u) => {
      if (!u) { setUser(null); setProfile(null); return }
      setUser(u)
      await refreshProfile(u.uid)
    })
  }, [])

  if (user === undefined) return <LoadingScreen />
  if (!user)              return <LoginPage />

  if (profile?.role === 'client') {
    // Forza cambio password al primo accesso
    if (profile?.mustChangePassword) {
      return (
        <ChangePasswordScreen
          userId={user.uid}
          onDone={() => refreshProfile(user.uid)}
        />
      )
    }
    return <ClientView clientId={profile.clientId} />
  }

  return <FitQuest user={user} />
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="font-display text-white/30 tracking-[3px] text-[13px]">LOADING...</div>
    </div>
  )
}
