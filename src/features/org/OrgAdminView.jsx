import { useState }        from 'react'
import { TrainerProvider } from '../../context/TrainerContext'
import { ReadonlyProvider } from '../../context/ReadonlyContext'
import { TrainerShell }    from '../../components/layout/TrainerShell'
import { ReadonlyBanner }  from '../../components/common/ReadonlyBanner'
import { useTrainerNav }   from '../trainer/useTrainerNav'
import { useClients }      from '../../hooks/useClients'
import { ClientDashboard } from '../client/ClientDashboard'
import { PAGES }           from '../trainer/trainer.config'
import { OrgDashboard }    from './org-pages/OrgDashboard'
import { MembersPage }     from './org-pages/MembersPage'
import { OrgSettingsPage } from './org-pages/OrgSettingsPage'

// Pagine aggiuntive per org_admin
const ORG_PAGES = {
  ...PAGES,
  org_dashboard: OrgDashboard,
  members:       MembersPage,
  org_settings:  OrgSettingsPage,
}

export default function OrgAdminView({ user, profile, org, terminology }) {
  const orgId      = profile?.orgId ?? user.uid
  const moduleType = org?.moduleType ?? 'personal_training'
  const userRole   = 'org_admin'

  return (
    <TrainerProvider
      orgId={orgId}
      moduleType={moduleType}
      terminology={terminology}
      userRole={userRole}
      orgPlan={org?.plan ?? 'free'}
    >
      <ReadonlyProvider readonly={false}>
        <OrgAdminLayout user={user} orgId={orgId} org={org} />
      </ReadonlyProvider>
    </TrainerProvider>
  )
}

function OrgAdminLayout({ user, orgId, org }) {
  const { page, navParams, selectedClient, navigateTo, deselectClient } = useTrainerNav()
  const {
    clients, isLoading, fetchError,
    fetchClients,
    handleAddClient, handleCampionamento, handleDeleteClient,
  } = useClients(orgId, user.uid)

  const CurrentPage = ORG_PAGES[page] ?? ORG_PAGES.clients

  return (
    <TrainerShell page={page} onNavigate={navigateTo}>
      <ReadonlyBanner />
      {selectedClient ? (
        <ClientDashboard
          client={selectedClient}
          orgId={orgId}
          onBack={deselectClient}
          onCampionamento={handleCampionamento}
          onDelete={handleDeleteClient}
        />
      ) : (
        <CurrentPage
          orgId={orgId}
          trainerId={user.uid}
          org={org}
          clients={clients}
          clientsLoading={isLoading}
          clientsError={fetchError}
          onAddClient={handleAddClient}
          onRefreshClients={fetchClients}
          onNavigate={navigateTo}
          {...(navParams ?? {})}
        />
      )}
    </TrainerShell>
  )
}
