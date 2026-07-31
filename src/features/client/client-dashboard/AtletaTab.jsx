import { XPBar }         from '../../../components/ui/XPBar'
import { AvatarDisplay } from '../client-view/avatar/AvatarDisplay'

/**
 * Contenuto del tab "Atleta" della dashboard cliente — card riepilogo con
 * avatar, rank/livello/media e XP bar. Estratto da ClientDashboard.jsx (RX-07).
 */
export function AtletaTab({ client, orgId, campCount, rankObj, ruoloObj, categoriaObj, profileType, biaRankObj }) {
  const mediaVal  = client.media != null ? Math.round(client.media) : null
  const roleLabel = ruoloObj?.label ?? categoriaObj?.label ?? null

  return (
    <section className="p-4">

      {/* Card atleta — tutto dentro */}
      <div className="rx-card rounded-[4px] overflow-hidden">
        <div className="h-[2px]" style={{ background: 'var(--rx-gradient)' }} />

        {/* Avatar + Info */}
        <div className="flex items-center gap-4 px-4 pt-4 pb-3">

          {/* Avatar */}
          <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
            <AvatarDisplay
              avatarId={client.avatarId} orgId={orgId} width={80} height={80}
              style={{ borderRadius: '50%' }}
            />
            {/* Ring colorato sopra */}
            <div className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: '2px solid color-mix(in srgb, var(--rx-accent) 33%, transparent)', boxSizing: 'border-box' }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            {roleLabel && (
              <span className="font-display text-[9px] font-bold tracking-[2px] uppercase"
                style={{ color: 'var(--rx-accent)' }}>{roleLabel}</span>
            )}
            <div className="font-display font-black text-white text-[17px] uppercase truncate leading-tight">
              {client.name}
            </div>
            <div className="flex items-end gap-4 mt-1">
              <div>
                <div className="font-display font-black leading-none"
                  style={{ fontSize: 38, color: campCount > 0 ? 'var(--rx-accent)' : 'rgba(255,255,255,0.15)' }}>
                  {campCount > 0 ? (rankObj?.label ?? 'F') : '—'}
                </div>
                <div className="font-display text-[8px] font-bold tracking-[2px] uppercase"
                  style={{ color: 'rgba(255,255,255,0.6)' }}>RANK</div>
              </div>
              <div>
                <div className="font-display font-black text-[22px] text-white leading-none">{client.level ?? 1}</div>
                <div className="font-display text-[8px] font-bold tracking-[2px] uppercase"
                  style={{ color: 'rgba(255,255,255,0.6)' }}>LV.</div>
              </div>
              {campCount > 0 && mediaVal != null && (
                <div className="ml-auto">
                  <div className="font-display font-black text-[22px] leading-none" style={{ color: 'var(--rx-accent)' }}>{mediaVal}°</div>
                  <div className="font-display text-[8px] font-bold tracking-[2px] uppercase"
                    style={{ color: 'rgba(255,255,255,0.6)' }}>MEDIA</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="px-4 pb-4">
          <XPBar xp={client.xp} xpNext={client.xpNext} color="var(--rx-accent)" size="sm" fullWidth />
        </div>

        {/* Stats strip — dentro la stessa card */}
        <div className="flex" style={{ borderTop: '1px solid var(--border-default)' }}>
          {[
            { label: 'Campionamenti', value: campCount },
            { label: 'Sessioni / sett.', value: client.sessionsPerWeek ?? '—' },
            profileType !== 'tests_only' && { label: 'BIA', value: biaRankObj?.label ?? '—' },
          ].filter(Boolean).map((s, i) => (
            <div key={s.label} className="flex-1 flex flex-col items-center py-4"
              style={{ borderLeft: i > 0 ? '1px solid var(--border-default)' : 'none' }}>
              <span className="font-display font-black text-[18px] text-white leading-none">{s.value}</span>
              <span className="font-display text-[8px] font-semibold tracking-[1.5px] uppercase mt-1.5"
                style={{ color: 'rgba(255,255,255,0.25)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

    </section>
  )
}
