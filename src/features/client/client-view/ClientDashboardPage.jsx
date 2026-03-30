import { RankRing }                       from '../../../components/ui/RankRing'
import { XPBar }                          from '../../../components/ui/XPBar'
import { SectionLabel, Divider, ActivityLog, StatsSection } from '../../../components/ui'
import { StatsChart }                     from '../StatsChart'
import { getCategoriaById }               from '../../../constants'

/**
 * Pagina dashboard del cliente — statistiche, grafico, attività.
 */
export function ClientDashboardPage({ client, color, rankObj }) {
  const prevStats  = client.campionamenti?.[1]?.stats ?? null
  const categoria  = getCategoriaById(client.categoria)

  return (
    <div>
      {/* Hero */}
      <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
        <RankRing rankObj={rankObj} xp={client.xp} xpNext={client.xpNext} size={160} />

        <div>
          <div className="font-display font-black text-[28px] leading-none tracking-wide text-white">
            {client.name}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            <span
              className="font-display text-[12px] rounded-[3px] px-3 py-1"
              style={{ background: color + '22', color, border: `1px solid ${color}44` }}
            >
              LIVELLO {client.level}
            </span>
            {categoria && (
              <span className="font-body text-[12px] text-white/30 border border-white/10 rounded-[3px] px-3 py-1">
                {categoria.label}
              </span>
            )}
          </div>
        </div>

        <XPBar xp={client.xp} xpNext={client.xpNext} color={color} />
      </div>

      <Divider color={color} />

      {/* Status */}
      <section className="px-6 py-6">
        <div
          className="rounded-[4px] p-5 rx-card"
        >
          <SectionLabel>◈ Status</SectionLabel>
          <StatsSection
            stats={client.stats}
            prevStats={prevStats}
            color={color}
            categoria={client.categoria}
          />
        </div>
      </section>

      <Divider color={color} />

      {/* Andamento */}
      <section className="px-6 py-6">
        <StatsChart
          campionamenti={client.campionamenti}
          color={color}
          categoria={client.categoria}
        />
      </section>

      <Divider color={color} />

      {/* Attività */}
      <section className="px-6 py-6">
        <ActivityLog log={client.log} color={color} />
      </section>

      <div className="h-10" />
    </div>
  )
}