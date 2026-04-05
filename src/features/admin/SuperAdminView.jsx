import { useState }              from 'react'
import { AdminShell }            from './AdminShell'
import { AdminDashboard }        from './admin-pages/AdminDashboard'
import { OrgsPage }              from './admin-pages/OrgsPage'
import { OrgDetailView }         from './admin-pages/OrgDetailView'
import { AdminProfilePage }      from './admin-pages/AdminProfilePage'

export default function SuperAdminView({ user }) {
  const [page,        setPage]        = useState('dashboard')
  const [selectedOrg, setSelectedOrg] = useState(null)

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
    </AdminShell>
  )
}
