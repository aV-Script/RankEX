import { useState, useEffect } from 'react'
import { getOrganizations }    from '../../../firebase/services/org'
import { CreateOrgForm }       from './CreateOrgForm'
import { usePagination }       from '../../../hooks/usePagination'
import { Pagination }          from '../../../components/common/Pagination'

const MODULE_LABELS = {
  personal_training: 'Personal Training',
  soccer_academy:    'Soccer Academy',
}

const STATUS_COLORS = {
  active:   '#0fd65a',
  inactive: '#6b7280',
  suspended:'#f87171',
}

export function OrgsPage({ onSelectOrg, currentUserUid }) {
  const [orgs,      setOrgs]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [showForm,  setShowForm]  = useState(false)

  useEffect(() => {
    getOrganizations()
      .then(setOrgs)
      .finally(() => setLoading(false))
  }, [])

  const handleCreated = (org) => {
    setOrgs(prev => [org, ...prev])
    setShowForm(false)
  }

  const filtered = orgs.filter(o =>
    o.name?.toLowerCase().includes(search.toLowerCase())
  )

  const { paginatedItems: paginatedOrgs, ...pagination } = usePagination(filtered, 10)

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-black text-[18px] text-white">Organizzazioni</h2>
        <div className="flex items-center gap-3">
          <span className="font-display text-[11px] text-white/30">{orgs.length} totali</span>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 font-display text-[11px] font-bold cursor-pointer border-0 rounded-[3px] transition-all"
            style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            NUOVA
          </button>
        </div>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Cerca per nome..."
        className="input-base w-full max-w-sm mb-6"
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => (
            <div
              key={i}
              className="h-16 rounded-[4px] animate-pulse"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="font-body text-[13px] text-white/20">Nessuna organizzazione trovata.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {paginatedOrgs.map(org => (
            <button
              key={org.id}
              onClick={() => onSelectOrg(org)}
              className="flex items-center justify-between px-5 py-4 w-full text-left cursor-pointer border transition-all rounded-[4px]"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
            >
              <div>
                <div className="font-display text-[14px] text-white">{org.name}</div>
                <div className="font-body text-[12px] text-white/40 mt-0.5">
                  {MODULE_LABELS[org.moduleType] ?? org.moduleType} · {org.id}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="font-display text-[9px] px-2 py-0.5 rounded-[3px]"
                  style={{
                    color:       STATUS_COLORS[org.status] ?? '#6b7280',
                    background: (STATUS_COLORS[org.status] ?? '#6b7280') + '18',
                  }}
                >
                  {(org.status ?? 'active').toUpperCase()}
                </span>
                <span className="text-white/20 text-[14px]">›</span>
              </div>
            </button>
          ))}
        </div>
        <Pagination {...pagination} />
      )}

      {showForm && (
        <CreateOrgForm
          onClose={() => setShowForm(false)}
          onCreated={handleCreated}
          ownerUid={currentUserUid}
        />
      )}
    </div>
  )
}
