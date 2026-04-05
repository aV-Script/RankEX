import { useState, useCallback }           from 'react'
import { useClientRank }                   from '../../hooks/useClientRank'
import { SectionLabel, Divider, ActivityLog, StatsSection } from '../../components/ui'
import { StatsChart }                      from './StatsChart'
import { DashboardHeader }                 from './client-dashboard/DashboardHeader'
import { DeleteDialog }                    from './client-dashboard/DeleteDialog'
import { ClientSessionsSummary }           from './client-dashboard/ClientSessionsSummary'
import { CampionamentoView }               from './CampionamentoView'
import { useBia }                          from '../bia/useBia'
import { BiaView }                         from '../bia/BiaView'
import { BiaSummary }                      from '../bia/bia-view/BiaSummary'
import { BiaHistoryChart }                 from '../bia/bia-view/BiaHistoryChart'
import { UpgradeCategoryBanner }           from '../bia/UpgradeCategoryBanner'
import { getProfileCategory }              from '../../constants/bia'
import { calcBiaScore, getBiaRankFromScore } from '../../utils/bia'

export function ClientDashboard({ client, orgId, onBack, onCampionamento, onDelete }) {
  const { rankObj: testRankObj, color: testColor } = useClientRank(client)
  const [view,       setView]       = useState('dashboard') // 'dashboard' | 'campionamento' | 'bia'
  const [showDelete, setShowDelete] = useState(false)

  const { handleSaveBia, handleUpgradeProfile } = useBia()

  const profileType = client.profileType ?? 'tests_only'
  const profile     = getProfileCategory(profileType)

  const biaScore   = calcBiaScore(client.lastBia, client.sesso, client.eta)
  const biaRank    = getBiaRankFromScore(biaScore)
  const biaRankObj = biaScore > 0 ? biaRank : { label: 'F', color: '#4a5568' }
  const biaColor   = biaRankObj.color

  // Colore e rank primari della scheda — BIA per bia_only, test per gli altri
  const color   = profileType === 'bia_only' ? biaColor : testColor
  const rankObj = profileType === 'bia_only' ? biaRankObj : testRankObj

  const prevStats = client.campionamenti?.[1]?.stats ?? null

  const handleDelete = useCallback(async () => {
    await onDelete(client.id)
    setShowDelete(false)
    onBack()
  }, [onDelete, client.id, onBack])

  const handleSaveCampionamento = useCallback(async (newStats, testValues) => {
    await onCampionamento(client, newStats, testValues)
  }, [onCampionamento, client])

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

  // Vista BIA
  if (view === 'bia') {
    return (
      <BiaView
        client={client}
        color={color}
        onSave={(biaData) => handleSaveBia(client, biaData)}
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
        biaRankObj={profileType === 'complete' ? biaRankObj : null}
        onBack={onBack}
        onDelete={() => setShowDelete(true)}
      />

      <Divider color={color} />

      <ClientSessionsSummary
        clientId={client.id}
        orgId={orgId}
      />

      <Divider color={color} />

      {/* Banner upgrade se profilo incompleto */}
      <UpgradeCategoryBanner
        client={client}
        color={color}
        onUpgrade={handleUpgradeProfile}
      />

      {/* Sezione test — solo se il profilo include test */}
      {profile.hasTests && (
        <section className="px-6 pt-6 pb-4">
          <div className="rounded-[4px] p-5 rx-card">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel className="mb-0">◈ Status</SectionLabel>
              <button
                onClick={() => setView('campionamento')}
                className="text-[11px] font-display px-3 py-1.5 rounded-[3px] cursor-pointer border transition-all hover:opacity-80"
                style={{ color, borderColor: color + '55', background: color + '11' }}
              >
                CAMPIONAMENTO
              </button>
            </div>
            <div
              className="rounded-[4px] p-5"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <StatsSection
                stats={client.stats}
                prevStats={prevStats}
                color={color}
                categoria={client.categoria}
              />
            </div>
            <div className="mt-6">
              <StatsChart
                campionamenti={client.campionamenti}
                color={color}
                categoria={client.categoria}
              />
            </div>
          </div>
        </section>
      )}

      {/* Sezione BIA — solo se il profilo include BIA */}
      {profile.hasBia && (
        <>
          <Divider color={biaColor} />
          <section className="px-6 pt-6 pb-4">
            <div className="rounded-[4px] p-5 rx-card">
              <div className="flex items-center justify-between mb-4">
                <SectionLabel className="mb-0">◈ BIA</SectionLabel>
                <button
                  onClick={() => setView('bia')}
                  className="text-[11px] font-display px-3 py-1.5 rounded-[3px] cursor-pointer border transition-all hover:opacity-80"
                  style={{ color: biaColor, borderColor: biaColor + '55', background: biaColor + '11' }}
                >
                  NUOVA MISURAZIONE
                </button>
              </div>
              <BiaSummary
                bia={client.lastBia}
                prevBia={client.biaHistory?.[1] ?? null}
                sex={client.sesso}
                age={client.eta}
                color={biaColor}
                rank={biaRank.label}
              />
              <div className="mt-6">
                <BiaHistoryChart biaHistory={client.biaHistory} color={biaColor} />
              </div>
            </div>
          </section>
        </>
      )}

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
