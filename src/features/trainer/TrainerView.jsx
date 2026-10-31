import { Suspense, useCallback } from 'react'
import { TrainerProvider }  from '../../context/TrainerContext'
import { ReadonlyProvider } from '../../context/ReadonlyContext'
import { UnsavedChangesProvider, useUnsavedChanges } from '../../context/UnsavedChangesContext'
import { TrainerShell }     from '../../components/layout/TrainerShell'
import { ReadonlyBanner }   from '../../components/common/ReadonlyBanner'
import { ClientDashboard }  from '../client/ClientDashboard'
import { LoadingScreen }    from '../../components/common/LoadingScreen'
import { useTrainerNav }    from './useTrainerNav'
import { useClients }       from '../../hooks/useClients'
import { PAGES }            from './trainer.config'
import { getTerminology }   from '../../config/modules.config'

export default function TrainerView({ user, profile, org, terminology }) {
  const orgId      = profile?.orgId ?? user.uid
  const moduleType = org?.moduleType ?? 'personal_training'
  // Sempre definita: senza org (legacy / org non raggiungibile) vale quella PT
  const resolvedTerminology = terminology ?? getTerminology(moduleType, org?.terminologyVariant)
  const userRole   = profile?.role ?? 'trainer'
  const readonly   = userRole === 'staff_readonly'

  return (
    <TrainerProvider
      orgId={orgId}
      moduleType={moduleType}
      terminology={resolvedTerminology}
      userRole={userRole}
      userName={profile?.name ?? user.email ?? user.uid}
      orgPlan={org?.plan ?? 'free'}
    >
      <ReadonlyProvider readonly={readonly}>
        <UnsavedChangesProvider>
          <TrainerLayout user={user} orgId={orgId} />
        </UnsavedChangesProvider>
      </ReadonlyProvider>
    </TrainerProvider>
  )
}

function TrainerLayout({ user, orgId }) {
  const { page, navKey, navParams, selectedClient, navigateTo, deselectClient } = useTrainerNav()
  const {
    clients, isLoading, fetchError,
    fetchClients,
    handleAddClient, handleCampionamento, handleDeleteClient, handleClientUpdated,
  } = useClients(orgId, user.uid)
  const CurrentPage = PAGES[page] ?? PAGES.clients

  // Nav principale: con un form della dashboard non salvato chiede conferma (BUG-011)
  const { guardLeave } = useUnsavedChanges()
  const handleNavigate = useCallback((nextPage, params) => {
    guardLeave(() => navigateTo(nextPage, params))
  }, [guardLeave, navigateTo])

  return (
    <TrainerShell page={page} onNavigate={handleNavigate}>
      <ReadonlyBanner />
      {selectedClient ? (
        <div key={`client-${selectedClient.id}`} className="rx-animate-in">
          <ClientDashboard
            client={selectedClient}
            orgId={orgId}
            onBack={deselectClient}
            onCampionamento={handleCampionamento}
            onDelete={handleDeleteClient}
            onClientUpdated={handleClientUpdated}
          />
        </div>
      ) : (
        <div key={`page-${navKey}`} className="rx-animate-in">
          <Suspense fallback={<LoadingScreen />}>
            <CurrentPage
              key={navKey}
              orgId={orgId}
              trainerId={user.uid}
              clients={clients}
              clientsLoading={isLoading}
              clientsError={fetchError}
              onAddClient={handleAddClient}
              onRefreshClients={fetchClients}
              onNavigate={navigateTo}
              {...(navParams ?? {})}
            />
          </Suspense>
        </div>
      )}
    </TrainerShell>
  )
}
