import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute }          from '../components/common/ProtectedRoute'
import LoginPage                   from '../features/auth/LoginPage'
import { ROLE_REDIRECT, PROTECTED_ROUTES } from './routes.config'

export function AppRouter({ user, profile, org, terminology, refreshProfile }) {
  const role = profile?.role

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user && role
            ? <Navigate to={ROLE_REDIRECT[role] ?? '/login'} replace />
            : <LoginPage />
        }
      />

      {PROTECTED_ROUTES.map(({ path, allowedRoles, element }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute user={user} profile={profile} allowedRoles={allowedRoles}>
              {element(user, profile, { org, terminology, refreshProfile })}
            </ProtectedRoute>
          }
        />
      ))}

      <Route
        path="*"
        element={
          !user
            ? <Navigate to="/login" replace />
            : <Navigate to={ROLE_REDIRECT[role] ?? '/login'} replace />
        }
      />
    </Routes>
  )
}
