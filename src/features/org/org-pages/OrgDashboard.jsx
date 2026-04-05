import { useTrainerState } from '../../../context/TrainerContext'

export function OrgDashboard({ clients, org }) {
  const { terminology } = useTrainerState()
  const t = terminology ?? {}

  return (
    <div className="px-6 py-8 text-white">
      <h1 className="font-display font-black text-[20px] mb-2">
        {org?.name ?? 'Organizzazione'}
      </h1>
      <p className="font-body text-[13px] text-white/40 mb-8">
        Pannello di controllo organizzazione
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label={t.clients ?? 'Clienti'}
          value={clients?.length ?? 0}
          color="#0fd65a"
        />
        <StatCard
          label="Modulo"
          value={org?.moduleType === 'soccer_academy' ? 'Soccer' : 'PT'}
          color="#60a5fa"
        />
        <StatCard
          label="Piano"
          value={org?.plan ?? '—'}
          color="#f59e0b"
        />
      </div>
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
