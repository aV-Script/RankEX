import { lazy, Suspense }   from 'react'
import ChangePasswordScreen from '../features/client/ChangePasswordScreen'
import { ErrorBoundary }    from '../components/common/ErrorBoundary'
import { LoadingScreen }    from '../components/common/LoadingScreen'

const TrainerView     = lazy(() => import('../features/trainer/TrainerView'))
const ClientView      = lazy(() => import('../features/client/ClientView'))
const SuperAdminView  = lazy(() => import('../features/admin/SuperAdminView'))
const OrgAdminView    = lazy(() => import('../features/org/OrgAdminView'))

export const ROLE_REDIRECT = {
  super_admin:   '/admin',
  org_admin:     '/org',
  trainer:       '/trainer',
  staff_readonly:'/trainer',
  client:        '/client',
}

export const PROTECTED_ROUTES = [
  {
    path:         '/admin',
    allowedRoles: ['super_admin'],
    element:      (user, profile, helpers) => (
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          <SuperAdminView user={user} profile={profile} />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path:         '/org',
    allowedRoles: ['org_admin'],
    element:      (user, profile, { org, terminology, refreshProfile }) => (
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          {profile?.mustChangePassword
            ? <ChangePasswordScreen userId={user.uid} onDone={() => refreshProfile(user.uid)} />
            : <OrgAdminView user={user} profile={profile} org={org} terminology={terminology} />
          }
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path:         '/trainer',
    allowedRoles: ['trainer', 'staff_readonly'],
    element:      (user, profile, { org, refreshProfile }) => (
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          {profile?.mustChangePassword
            ? <ChangePasswordScreen userId={user.uid} onDone={() => refreshProfile(user.uid)} />
            : <TrainerView user={user} profile={profile} org={org} />
          }
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
            ? <ChangePasswordScreen userId={user.uid} onDone={() => helpers.refreshProfile(user.uid)} />
            : <ClientView clientId={profile?.clientId} orgId={profile?.orgId} />
          }
        </Suspense>
      </ErrorBoundary>
    ),
  },
]
