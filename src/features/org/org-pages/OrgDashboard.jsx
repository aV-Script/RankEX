import { useTrainerState } from '../../../context/TrainerContext'
import { StatCard, PageTitle } from '../../../components/ui'

export function OrgDashboard({ clients, org }) {
  const { terminology } = useTrainerState()
  const t = terminology ?? {}

  return (
    <div className="px-6 py-8 text-white">
      <PageTitle className="mb-2">
        {org?.name ?? 'Organizzazione'}
      </PageTitle>
      <p className="font-body text-[13px] text-white/40 mb-8">
        Pannello di controllo organizzazione
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label={t.clients ?? 'Clienti'}
          value={clients?.length ?? 0}
          color="var(--rx-accent)"
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
