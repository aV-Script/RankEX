import { TrainerProvider } from '../../context/TrainerContext'
import { TrainerShell }    from '../../components/layout/TrainerShell'
import { ClientDashboard } from '../client/ClientDashboard'
import { useTrainerNav }   from './useTrainerNav'
import { PAGES }           from './trainer.config'

export default function TrainerView({ user }) {
  return (
    <TrainerProvider>
      <TrainerLayout user={user} />
    </TrainerProvider>
  )
}

function TrainerLayout({ user }) {
  const { page, selectedClient, navigateTo, deselectClient } = useTrainerNav() 
  const CurrentPage = PAGES[page] ?? PAGES.clients

  return (
    <TrainerShell page={page} onNavigate={navigateTo}>
      <span id="main-content" tabIndex={-1} style={{ position: 'absolute', left: 0, top: 0 }} />
      {selectedClient ? (
        <ClientDashboard
          client={selectedClient}
          trainerId={user.uid}
          onBack={deselectClient}
        />
      ) : (
        <CurrentPage trainerId={user.uid} />
      )}
    </TrainerShell>
  )
}