import { useState, useEffect }  from 'react'
import { useAuth }               from '../features/auth/useAuth'
import { AppRouter }             from './AppRouter'
import { LoadingScreen }         from '../components/common/LoadingScreen'
import { ErrorBoundary }         from '../components/common/ErrorBoundary'

const LOADING_TIMEOUT_MS = 10_000

export default function App() {
  const { user, profile, org, terminology, refreshProfile } = useAuth()
  const [timedOut, setTimedOut]                             = useState(false)

  // true finché l'SDK auth non risponde, o finché l'utente loggato aspetta il profilo+org
  const isLoading = user === undefined || (user !== null && (profile === undefined || org === undefined))

  useEffect(() => {
    if (!isLoading) { setTimedOut(false); return }
    const t = setTimeout(() => setTimedOut(true), LOADING_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [isLoading])

  if (isLoading && timedOut) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="font-display text-white/50 tracking-widest text-sm">CARICAMENTO FALLITO</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 text-sm text-white/70 border rounded-[3px] hover:opacity-80 transition-opacity"
        style={{ borderColor: 'rgba(15,214,90,0.2)' }}
      >
        Ricarica
      </button>
    </div>
  )
  if (isLoading) return <LoadingScreen />
  return (
    <ErrorBoundary>
      <AppRouter user={user} profile={profile} org={org} terminology={terminology} refreshProfile={refreshProfile} />
    </ErrorBoundary>
  )
}
