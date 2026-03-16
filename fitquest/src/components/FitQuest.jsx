import { useState } from 'react'
import { ClientProvider, useClientState } from '../context/ClientContext'
import { TrainerShell }   from './layout/TrainerShell'
import { ClientDashboard } from './dashboard/ClientDashboard'
import { ClientsPage }     from './trainer/ClientsPage'
import { TrainerCalendar } from './trainer/TrainerCalendar'
import { TestGuidePage }   from './trainer/TestGuidePage'
import { ProfilePage }     from './trainer/ProfilePage'
import { useClients }      from '../hooks/useClients'

function FitQuestInner({ user }) {
  const { selectedClient }  = useClientState()
  const { clients }         = useClients(user.uid)
  const [page, setPage]     = useState('clients')

  // Sidebar sempre visibile, ClientDashboard come contenuto se selezionato
  return (
    <TrainerShell page={page} setPage={setPage}>
      {selectedClient ? (
        <ClientDashboard client={selectedClient} trainerId={user.uid} />
      ) : (
        <>
          {page === 'clients'  && <ClientsPage  trainerId={user.uid} />}
          {page === 'calendar' && <TrainerCalendar trainerId={user.uid} clients={clients} />}
          {page === 'guide'    && <TestGuidePage />}
          {page === 'profile'  && <ProfilePage user={user} />}
        </>
      )}
    </TrainerShell>
  )
}

export default function FitQuest({ user }) {
  return (
    <ClientProvider>
      <FitQuestInner user={user} />
    </ClientProvider>
  )
}
