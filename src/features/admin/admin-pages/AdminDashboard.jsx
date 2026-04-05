import { useState, useEffect, useMemo } from 'react'
import { getOrganizations }             from '../../../firebase/services/org'

const MODULE_LABELS = {
  personal_training: 'Personal Training',
  soccer_academy:    'Soccer Academy',
}

const STATUS_COLORS = {
  active:    '#0fd65a',
  inactive:  '#6b7280',
  suspended: '#f87171',
}

const PLAN_COLORS = {
  free:       '#6b7280',
  pro:        '#60a5fa',
  enterprise: '#f59e0b',
}

export function AdminDashboard({ onSelectOrg }) {
  const [orgs,    setOrgs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOrganizations()
      .then(setOrgs)
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const active    = orgs.filter(o => (o.status ?? 'active') === 'active').length
    const pt        = orgs.filter(o => o.moduleType === 'personal_training').length
    const soccer    = orgs.filter(o => o.moduleType === 'soccer_academy').length
    const suspended = orgs.filter(o => o.status === 'suspended').length
    const free       = orgs.filter(o => (o.plan ?? 'free') === 'free').length
    const pro        = orgs.filter(o => o.plan === 'pro').length
    const enterprise = orgs.filter(o => o.plan === 'enterprise').length
    return { active, pt, soccer, suspended, free, pro, enterprise }
  }, [orgs])

  const recentOrgs = useMemo(() =>
    [...orgs]
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      .slice(0, 5),
    [orgs]
  )

  if (loading) {
    return (
      <div className="px-6 py-8">
        <div className="font-display text-[10px] tracking-[3px] text-white/20 mb-6">DASHBOARD</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 rounded-[4px] animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1,2,3].map(i => (
            <div key={i} className="h-16 rounded-[4px] animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8">
      <div className="font-display text-[10px] tracking-[3px] text-white/20 mb-6">DASHBOARD</div>

      {/* Stat principali */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Organizzazioni" value={orgs.length}        color="#0fd65a" />
        <StatCard label="Attive"          value={stats.active}       color="#34d399" />
        <StatCard label="Personal Tr."    value={stats.pt}           color="#60a5fa" />
        <StatCard label="Soccer Academy"  value={stats.soccer}       color="#f59e0b" />
      </div>

      {/* Piano breakdown */}
      <div className="font-display text-[10px] tracking-[2px] text-white/25 mb-3 mt-6">PIANI</div>
      <div className="grid grid-cols-3 gap-3 mb-8">
        <PlanCard label="Free"       value={stats.free}       color={PLAN_COLORS.free} />
        <PlanCard label="Pro"        value={stats.pro}        color={PLAN_COLORS.pro} />
        <PlanCard label="Enterprise" value={stats.enterprise} color={PLAN_COLORS.enterprise} />
      </div>

      {/* Organizzazioni recenti */}
      {recentOrgs.length > 0 && (
        <div>
          <div className="font-display text-[10px] tracking-[2px] text-white/25 mb-3">AGGIUNTE DI RECENTE</div>
          <div className="flex flex-col gap-2">
            {recentOrgs.map(org => {
              const statusColor = STATUS_COLORS[org.status ?? 'active'] ?? '#6b7280'
              const planColor   = PLAN_COLORS[org.plan ?? 'free']       ?? '#6b7280'
              return (
                <button
                  key={org.id}
                  onClick={() => onSelectOrg?.(org)}
                  className="flex items-center justify-between px-4 py-3 rounded-[4px] w-full text-left cursor-pointer border transition-all"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
                >
                  <div className="min-w-0">
                    <div className="font-display text-[13px] text-white truncate">{org.name}</div>
                    <div className="font-body text-[11px] text-white/30 mt-0.5">
                      {MODULE_LABELS[org.moduleType] ?? org.moduleType} · {org.id}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span
                      className="font-display text-[9px] px-2 py-0.5 rounded-[2px]"
                      style={{ background: planColor + '18', color: planColor }}
                    >
                      {(org.plan ?? 'free').toUpperCase()}
                    </span>
                    <span
                      className="font-display text-[9px] px-2 py-0.5 rounded-[2px]"
                      style={{ background: statusColor + '18', color: statusColor }}
                    >
                      {(org.status ?? 'active').toUpperCase()}
                    </span>
                    <span className="text-white/20 text-[14px]">›</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div
      className="p-5 rounded-[4px]"
      style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}22` }}
    >
      <div className="font-display font-black text-[32px] mb-1" style={{ color }}>
        {value}
      </div>
      <div className="font-body text-[12px] text-white/40">{label}</div>
    </div>
  )
}

function PlanCard({ label, value, color }) {
  return (
    <div
      className="px-4 py-3 rounded-[4px] flex items-center justify-between"
      style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}22` }}
    >
      <span className="font-body text-[12px] text-white/40">{label}</span>
      <span className="font-display font-black text-[22px]" style={{ color }}>{value}</span>
    </div>
  )
}
