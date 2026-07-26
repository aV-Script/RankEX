import { Suspense }         from 'react'
import { TrainerProvider }  from '../../context/TrainerContext'
import { ReadonlyProvider } from '../../context/ReadonlyContext'
import { TrainerShell }     from '../../components/layout/TrainerShell'
import { ReadonlyBanner }   from '../../components/common/ReadonlyBanner'
import { ClientDashboard }  from '../client/ClientDashboard'
import { LoadingScreen }    from '../../components/common/LoadingScreen'
import { useTrainerNav }    from './useTrainerNav'
import { useClients }       from '../../hooks/useClients'
import { PAGES }            from './trainer.config'

export default function TrainerView({ user, profile, org }) {
  const orgId      = profile?.orgId ?? user.uid
  const moduleType = org?.moduleType ?? 'personal_training'
  const terminology = org
    ? { trainer: 'Trainer', client: 'Cliente', clients: 'Clienti', group: 'Gruppo', groups: 'Gruppi', session: 'Sessione', sessions: 'Sessioni' }
    : undefined
  const userRole   = profile?.role ?? 'trainer'
  const readonly   = userRole === 'staff_readonly'

  return (
    <TrainerProvider
      orgId={orgId}
      moduleType={moduleType}
      terminology={terminology}
      userRole={userRole}
      orgPlan={org?.plan ?? 'free'}
    >
      <ReadonlyProvider readonly={readonly}>
        <TrainerLayout user={user} orgId={orgId} />
      </ReadonlyProvider>
    </TrainerProvider>
  )
}

function TrainerLayout({ user, orgId }) {
  const { page, navKey, navParams, selectedClient, navigateTo, deselectClient } = useTrainerNav()
  const {
    clients, isLoading, fetchError,
    fetchClients,
    handleAddClient, handleCampionamento, handleDeleteClient,
  } = useClients(orgId, user.uid)
  const CurrentPage = PAGES[page] ?? PAGES.clients

  return (
    <TrainerShell page={page} onNavigate={navigateTo}>
      <ReadonlyBanner />
      {selectedClient ? (
        <div key={`client-${selectedClient.id}`} className="rx-animate-in">
          <ClientDashboard
            client={selectedClient}
            orgId={orgId}
            onBack={deselectClient}
            onCampionamento={handleCampionamento}
            onDelete={handleDeleteClient}
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
