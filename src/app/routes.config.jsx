import { lazy, Suspense }   from 'react'
import ChangePasswordScreen from '../features/client/ChangePasswordScreen'
import { ErrorBoundary }    from '../components/common/ErrorBoundary'
import { LoadingScreen }    from '../components/common/LoadingScreen'

const TrainerView = lazy(() => import('../features/trainer/TrainerView'))
const ClientView  = lazy(() => import('../features/client/ClientView'))

export const ROLE_REDIRECT = {
  trainer: '/trainer',
  client:  '/client',
}

export const PROTECTED_ROUTES = [
  {
    path:         '/trainer',
    allowedRoles: ['trainer'],
    element:      (user, profile, helpers) => (
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <TrainerView user={user} />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path:         '/client',
    allowedRoles: ['client'],
    element:      (user, profile, helpers) => (
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          {profile?.mustChangePassword
            ? <ChangePasswordScreen userId={user.uid} onDone={helpers.refreshProfile} />
            : <ClientView clientId={profile?.clientId} />
          }
        </Suspense>
      </ErrorBoundary>
    ),
  },
]