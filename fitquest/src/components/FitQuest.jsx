import { ClientProvider, useClientState } from '../context/ClientContext'
import { TrainerArea }    from './trainer/TrainerArea'
import { ClientDashboard } from './dashboard/ClientDashboard'

// FitQuest.jsx è solo un provider + router — ogni vista gestisce il proprio header
function FitQuestInner({ user }) {
  const { selectedClient } = useClientState()
  return selectedClient
    ? <ClientDashboard client={selectedClient} trainerId={user.uid} />
    : <TrainerArea trainerId={user.uid} />
}

export default function FitQuest({ user }) {
  return (
    <ClientProvider>
      <FitQuestInner user={user} />
    </ClientProvider>
  )
}
