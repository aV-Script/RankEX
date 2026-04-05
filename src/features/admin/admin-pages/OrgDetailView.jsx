import { useState, useEffect, useCallback }  from 'react'
import { getMembers, removeMember, updateMember } from '../../../firebase/services/org'
import { updateUserProfile }    from '../../../firebase/services/users'
import { getClients }           from '../../../firebase/services/clients'
import { CreateMemberForm }     from '../../org/org-pages/CreateMemberForm'
import { ConfirmDialog }        from '../../../components/common/ConfirmDialog'
import { usePagination }        from '../../../hooks/usePagination'
import { Pagination }           from '../../../components/common/Pagination'
import { getPlanLimits }        from '../../../config/plans.config'

const MODULE_LABELS = {
  personal_training: 'Personal Training',
  soccer_academy:    'Soccer Academy',
}


const ROLE_OPTIONS = [
  { value: 'trainer',        label: 'Trainer' },
  { value: 'staff_readonly', label: 'Solo lettura' },
  { value: 'org_admin',      label: 'Admin' },
]

export function OrgDetailView({ org, onBack }) {
  const [members,       setMembers]       = useState([])
  const [clients,       setClients]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(null)

  useEffect(() => {
    Promise.all([
      getMembers(org.id),
      getClients(org.id),
    ])
      .then(([m, c]) => { setMembers(m); setClients(c) })
      .finally(() => setLoading(false))
  }, [org.id])

  const handleMemberCreated = (member) => {
    setMembers(prev => [member, ...prev])
    setShowAddMember(false)
  }

  const handleRemove = useCallback(async () => {
    await removeMember(org.id, confirmRemove.id)
    setMembers(prev => prev.filter(m => m.id !== confirmRemove.id))
    setConfirmRemove(null)
  }, [org.id, confirmRemove])

  const handleRoleChange = useCallback(async (member, newRole) => {
    const snapshot = member.role
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m))
    try {
      await Promise.all([
        updateMember(org.id, member.id, { role: newRole }),
        updateUserProfile(member.id, { role: newRole }),
      ])
    } catch {
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: snapshot } : m))
    }
  }, [org.id])

  const { paginatedItems: paginatedMembers, ...memberPagination } = usePagination(members, 8)

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <button
          onClick={onBack}
          className="bg-transparent border-none text-white/30 font-body text-[13px] cursor-pointer hover:text-white/60 p-0"
        >
          ‹ Organizzazioni
        </button>
        <span className="font-display font-black text-[16px] text-white">{org.name}</span>
        <span
          className="font-display text-[9px] px-2 py-0.5 rounded-[3px]"
          style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}
        >
          {MODULE_LABELS[org.moduleType] ?? org.moduleType}
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-8">

        {/* Info + utilizzo piano */}
        <section>
          <div className="font-display text-[10px] tracking-[2px] text-white/30 mb-3">INFO</div>
          <div
            className="p-4 rounded-[4px] flex flex-col gap-2"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {[
              ['ID',          org.id],
              ['Piano',       org.plan ?? '—'],
              ['Status',      org.status ?? 'active'],
              ['Terminologia',org.terminologyVariant ?? '—'],
              ['Owner',       org.ownerId ?? '—'],
              ['Creato il',   org.createdAt ? new Date(org.createdAt).toLocaleDateString('it-IT') : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="font-body text-[12px] text-white/40">{label}</span>
                <span className="font-display text-[12px] text-white/70">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Utilizzo piano */}
        {!loading && (() => {
          const limits = getPlanLimits(org.plan)
          const trainerPct = limits.trainers === Infinity ? 0 : Math.round((members.length / limits.trainers) * 100)
          const clientPct  = limits.clients  === Infinity ? 0 : Math.round((clients.length  / limits.clients)  * 100)
          const atT = limits.trainers !== Infinity && members.length >= limits.trainers
          const atC = limits.clients  !== Infinity && clients.length  >= limits.clients
          return (
            <section>
              <div className="font-display text-[10px] tracking-[2px] text-white/30 mb-3">UTILIZZO PIANO</div>
              <div
                className="p-4 rounded-[4px] flex flex-col gap-4"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <UsageBar
                  label="Trainer"
                  current={members.length}
                  limit={limits.trainers}
                  pct={trainerPct}
                  atLimit={atT}
                />
                <UsageBar
                  label="Clienti"
                  current={clients.length}
                  limit={limits.clients}
                  pct={clientPct}
                  atLimit={atC}
                />
              </div>
            </section>
          )
        })()}

        {/* Membri */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="font-display text-[10px] tracking-[2px] text-white/30">
              MEMBRI ({members.length})
            </div>
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 font-display text-[10px] cursor-pointer rounded-[3px] transition-all"
              style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              AGGIUNGI
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[1,2].map(i => (
                <div key={i} className="h-10 rounded-[3px] animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
              ))}
            </div>
          ) : members.length === 0 ? (
            <p className="font-body text-[13px] text-white/20">Nessun membro.</p>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                {paginatedMembers.map(m => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-4 py-2.5 rounded-[3px]"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-body text-[13px] text-white/70">{m.name ?? m.email ?? m.id}</div>
                      {m.email && (
                        <div className="font-display text-[10px] text-white/25 mt-0.5">{m.email}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={m.role}
                        onChange={e => handleRoleChange(m, e.target.value)}
                        className="input-base text-[11px] py-1.5 px-2"
                        style={{ width: 'auto', minWidth: 100 }}
                      >
                        {ROLE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setConfirmRemove(m)}
                        className="font-display text-[10px] px-2.5 py-1.5 rounded-[3px] cursor-pointer border transition-all bg-transparent"
                        style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}
                      >
                        RIMUOVI
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination {...memberPagination} />
            </>
          )}
        </section>

        {/* Clienti */}
        <section>
          <div className="font-display text-[10px] tracking-[2px] text-white/30 mb-3">
            CLIENTI ({clients.length})
          </div>
          {loading ? (
            <div className="h-10 rounded-[3px] animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ) : (
            <div
              className="px-4 py-3 rounded-[3px]"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span className="font-display font-black text-[28px] text-white/70">{clients.length}</span>
              <span className="font-body text-[12px] text-white/30 ml-2">clienti registrati</span>
            </div>
          )}
        </section>
      </div>

      {showAddMember && (
        <CreateMemberForm
          orgId={org.id}
          onClose={() => setShowAddMember(false)}
          onCreated={handleMemberCreated}
        />
      )}

      {confirmRemove && (
        <ConfirmDialog
          title={`Rimuovere ${confirmRemove.name ?? confirmRemove.id}?`}
          description="Il membro non potrà più accedere all'organizzazione."
          confirmLabel="RIMUOVI"
          onConfirm={handleRemove}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
    </div>
  )
}

function UsageBar({ label, current, limit, pct, atLimit }) {
  const isUnlimited = limit === Infinity
  const color = atLimit ? '#f87171' : pct > 80 ? '#fbbf24' : '#0fd65a'
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-display text-[11px] text-white/50">{label}</span>
        <span className="font-display text-[11px]" style={{ color }}>
          {current}{isUnlimited ? '' : ` / ${limit}`}
          {isUnlimited && <span className="text-white/25 ml-1">· illimitati</span>}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(pct, 100)}%`, background: color }}
          />
        </div>
      )}
    </div>
  )
}
