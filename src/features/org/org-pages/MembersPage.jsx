import { useState, useEffect, useCallback } from 'react'
import { getMembers, removeMember, updateMember } from '../../../firebase/services/org'
import { updateUserProfile }                from '../../../firebase/services/users'
import { ConfirmDialog }                    from '../../../components/common/ConfirmDialog'
import { CreateMemberForm }                 from './CreateMemberForm'
import { getPlanLimits }                    from '../../../config/plans.config'
import { EmptyState }                       from '../../../components/ui'

const ROLE_OPTIONS = [
  { value: 'trainer',        label: 'Trainer' },
  { value: 'staff_readonly', label: 'Solo lettura' },
  { value: 'org_admin',      label: 'Admin' },
]

const ROLE_LABELS = Object.fromEntries(ROLE_OPTIONS.map(r => [r.value, r.label]))

export function MembersPage({ orgId, org }) {
  const [members,    setMembers]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(null)

  const planLimits    = getPlanLimits(org?.plan)
  const atTrainerLimit = members.length >= planLimits.trainers

  const fetchMembers = useCallback(() => {
    setLoading(true)
    getMembers(orgId)
      .then(setMembers)
      .finally(() => setLoading(false))
  }, [orgId])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const handleRemove = useCallback(async () => {
    await removeMember(orgId, confirmRemove.id)
    setMembers(prev => prev.filter(m => m.id !== confirmRemove.id))
    setConfirmRemove(null)
  }, [orgId, confirmRemove])

  const handleRoleChange = useCallback(async (member, newRole) => {
    const snapshot = member.role
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m))
    try {
      await Promise.all([
        updateMember(orgId, member.id, { role: newRole }),
        updateUserProfile(member.id, { role: newRole }),
      ])
    } catch {
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: snapshot } : m))
    }
  }, [orgId])

  return (
    <div className="px-6 py-8 text-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display font-black text-[24px]">Team</h1>
        <button
          onClick={() => !atTrainerLimit && setShowCreate(true)}
          disabled={atTrainerLimit}
          className="font-display text-[11px] px-4 py-2 rounded-[3px] border-0 transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #1aff6e, #0fd65a, #00c8ff)', color: '#080c12', fontWeight: 700, cursor: atTrainerLimit ? 'not-allowed' : 'pointer' }}
        >
          + AGGIUNGI
        </button>
      </div>

      {/* Banner limite piano */}
      {atTrainerLimit && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-[3px] mb-5"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
        >
          <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <div className="font-display text-[11px] font-bold mb-0.5" style={{ color: '#fbbf24' }}>
              LIMITE PIANO RAGGIUNTO
            </div>
            <div className="font-body text-[12px] text-white/40">
              Il piano <span className="text-white/60">{(org?.plan ?? 'free').toUpperCase()}</span> consente
              massimo <span className="text-white/60">{planLimits.trainers} trainer</span>.
              Aggiorna il piano per aggiungere altri membri.
            </div>
          </div>
        </div>
      )}

      {/* Info utilizzo */}
      {!atTrainerLimit && planLimits.trainers !== Infinity && (
        <div className="font-body text-[11px] text-white/25 mb-5">
          {members.length} / {planLimits.trainers} trainer · piano {(org?.plan ?? 'free').toUpperCase()}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-14 rounded-[3px] animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          title="Nessun membro"
          description="Aggiungi il primo membro del team per iniziare."
        />
      ) : (
        <div className="flex flex-col gap-2 rx-animate-in">
          {members.map(member => (
            <div
              key={member.id}
              className="flex items-center justify-between px-4 py-3 rounded-[3px]"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-[14px] text-white">
                  {member.name ?? member.email ?? member.id}
                </div>
                {member.email && (
                  <div className="font-display text-[11px] text-white/25 mt-0.5">{member.email}</div>
                )}
              </div>
              <select
                value={member.role}
                onChange={e => handleRoleChange(member, e.target.value)}
                className="input-base text-[11px] py-1.5 px-2 mr-2"
                style={{ width: 'auto', minWidth: 100 }}
              >
                {ROLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={() => setConfirmRemove(member)}
                className="font-display text-[10px] px-2.5 py-1 rounded-[3px] cursor-pointer border transition-all bg-transparent shrink-0"
                style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}
              >
                RIMUOVI
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateMemberForm
          orgId={orgId}
          onClose={() => setShowCreate(false)}
          onCreated={(member) => {
            setMembers(prev => [member, ...prev])
            setShowCreate(false)
          }}
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
