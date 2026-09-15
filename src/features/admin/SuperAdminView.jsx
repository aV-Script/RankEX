import { useState }              from 'react'
import { AdminShell }            from './AdminShell'
import { AdminDashboard }        from './admin-pages/AdminDashboard'
import { OrgsPage }              from './admin-pages/OrgsPage'
import { OrgDetailView }         from './admin-pages/OrgDetailView'
import { AdminProfilePage }      from './admin-pages/AdminProfilePage'
import { RunbookPage }           from './admin-pages/RunbookPage'
import { useViewBackButton }     from '../../hooks/useModalStack'

export default function SuperAdminView({ user }) {
  const [page,        setPage]        = useState('dashboard')
  const [selectedOrg, setSelectedOrg] = useState(null)

  // Back button nativo: con un'org selezionata, torna alla lista invece di
  // minimizzare l'app — mirror del prop onBack già passato a OrgDetailView
  // (STORY-028/ADR-005, wave 2)
  useViewBackButton(selectedOrg ? () => setSelectedOrg(null) : null)

  // OrgDetailView sostituisce il contenuto corrente (non usa AdminShell per via del back)
  if (selectedOrg) {
    return (
      <AdminShell page="orgs" onNavigate={(p) => { setSelectedOrg(null); setPage(p) }}>
        <OrgDetailView
          org={selectedOrg}
          onBack={() => setSelectedOrg(null)}
        />
      </AdminShell>
    )
  }

  return (
    <AdminShell page={page} onNavigate={setPage}>
      {page === 'dashboard' && <AdminDashboard onSelectOrg={(org) => { setSelectedOrg(org) }} />}
      {page === 'orgs'      && <OrgsPage onSelectOrg={setSelectedOrg} currentUserUid={user?.uid} />}
      {page === 'profile'   && <AdminProfilePage user={user} />}
      {page === 'runbook'   && <RunbookPage />}
    </AdminShell>
  )
}
