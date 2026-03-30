import { useAuth } from '../../auth/useAuth'

/**
 * Pagina profilo del cliente.
 * Mostra info account e accesso alla player card.
 */
export function ClientProfilePage({ client, color, onCard }) {
  return (
    <div className="px-6 py-8 max-w-lg">
      <p className="font-display text-[10px] text-white/30 tracking-[3px] mb-6">PROFILO</p>

      {/* Info cliente */}
      <div
        className="rounded-[4px] p-5 mb-4 rx-card"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-[4px] flex items-center justify-center shrink-0"
            style={{ background: color + '22', border: `1px solid ${color}44` }}
          >
            <span className="font-display font-black text-[22px]" style={{ color }}>
              {client.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-display font-black text-[16px] text-white">{client.name}</div>
            <div className="font-body text-[13px] text-white/40 mt-0.5">{client.email ?? '—'}</div>
          </div>
        </div>
      </div>

      {/* Player card */}
      <button
        onClick={onCard}
        className="
          w-full flex items-center gap-3 px-5 py-4 rounded-[4px]
          cursor-pointer transition-all text-left rx-card
        "
      >
        <span className="font-body text-[13px] text-white/60">Visualizza Player Card</span>
        <span className="ml-auto text-white/30">›</span>
      </button>
    </div>
  )
}