import { Navigate } from 'react-router-dom'
import { LoadingScreen } from './LoadingScreen'

export function ProtectedRoute({ user, profile, allowedRoles, children }) {
  if (!user)                  return <Navigate to="/login" replace />
  if (profile === undefined)  return <LoadingScreen />          // loading in corso
  if (profile === null)       return <Navigate to="/login" replace /> // profilo non trovato
  if (!allowedRoles.includes(profile.role)) return <Navigate to="/" replace />
  return children
}
