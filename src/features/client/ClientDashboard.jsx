import { useState, useCallback }    from 'react'
import { useClients }               from '../../hooks/useClients'
import { useClientRank }            from '../../hooks/useClientRank'
import { SectionLabel, Divider, ActivityLog, StatsSection } from '../../components/ui'
import { StatsChart }               from './StatsChart'
import { DashboardHeader }          from './client-dashboard/DashboardHeader'
import { DeleteDialog }             from './client-dashboard/DeleteDialog'
import { ClientSessionsSummary }    from './client-dashboard/ClientSessionsSummary'
import { CampionamentoView }        from './CampionamentoView'

export function ClientDashboard({ client, trainerId, onBack }) {
  const { handleCampionamento, handleDeleteClient } = useClients(trainerId)
  const { rankObj, color }                          = useClientRank(client)
  const [view,       setView]       = useState('dashboard') // 'dashboard' | 'campionamento'
  const [showDelete, setShowDelete] = useState(false)

  const prevStats = client.campionamenti?.[1]?.stats ?? null

  const handleDelete = useCallback(async () => {
    await handleDeleteClient(client.id)
    setShowDelete(false)
    onBack()
  }, [handleDeleteClient, client.id, onBack])

  const handleSaveCampionamento = useCallback(async (newStats, testValues) => {
    await handleCampionamento(client, newStats, testValues)
  }, [handleCampionamento, client])

  // Vista campionamento — sostituisce il dashboard
    if (view === 'campionamento') {
      return (
        <CampionamentoView
          client={client}
          color={color}
          onSave={handleSaveCampionamento}
          onBack={() => setView('dashboard')}
        />
      )
    }

  return (
    <div className="min-h-screen text-white">

      <DashboardHeader
        client={client}
        rankObj={rankObj}
        color={color}
        onBack={onBack}
        onDelete={() => setShowDelete(true)}
      />

      <Divider color={color} />

      <ClientSessionsSummary
        clientId={client.id}
        sessionsPerWeek={client.sessionsPerWeek}
      />

      <Divider color={color} />

      <section className="px-6 pt-6 pb-4">
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <SectionLabel className="mb-0">◈ Status</SectionLabel>
            <button
              onClick={() => setView('campionamento')}
              className="text-[11px] font-display px-3 py-1.5 rounded-lg cursor-pointer border transition-all hover:opacity-80"
              style={{ color, borderColor: color + '55', background: color + '11' }}
            >
              CAMPIONAMENTO
            </button>
          </div>
          <StatsSection
            stats={client.stats}
            prevStats={prevStats}
            color={color}
            categoria={client.categoria}
          />
        </div>
      </section>

      <Divider color={color} />

      <section className="px-6 py-6">
        <StatsChart
          campionamenti={client.campionamenti}
          color={color}
          categoria={client.categoria}
        />
      </section>

      <Divider color={color} />

      <section className="px-6 py-6">
        <ActivityLog log={client.log} color={color} />
      </section>

      <div className="h-10" />

      {showDelete && (
        <DeleteDialog
          clientName={client.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}