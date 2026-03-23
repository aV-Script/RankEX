import { RankRing }        from '../../../components/ui/RankRing'
import { getCategoriaById } from '../../../constants'
import { XPBar } from '../../../components/ui/XPBar'
/**
 * Hero section del dashboard cliente.
 * Mostra rank ring, nome, categoria, XP bar e azioni (back + elimina).
 */
export function DashboardHeader({ client, rankObj, color, onBack, onDelete }) {
  const categoria = getCategoriaById(client.categoria)

  return (
    <div className="relative">

      {/* Barra azioni */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[.05]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-transparent border-none text-white/30 font-body text-[13px] cursor-pointer hover:text-white/60 transition-colors p-0"
        >
          ‹ Clienti
        </button>

        <button
          onClick={onDelete}
          className="bg-transparent border border-red-500/20 rounded-xl px-3 py-1.5 text-red-400/50 font-display text-[11px] cursor-pointer hover:border-red-500/50 hover:text-red-400 transition-all"
        >
          ELIMINA
        </button>
      </div>

      {/* Hero */}
      <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
        <RankRing
          rankObj={rankObj}
          xp={client.xp}
          xpNext={client.xpNext}
          size={160}
        />

        <div>
          <div className="font-display font-black text-[28px] leading-none tracking-wide text-white">
            {client.name}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            <span
              className="font-display text-[12px] rounded-lg px-3 py-1"
              style={{ background: color + '22', color, border: `1px solid ${color}44` }}
            >
              LIVELLO {client.level}
            </span>
            {categoria && (
              <span className="font-body text-[12px] text-white/30 border border-white/10 rounded-lg px-3 py-1">
                {categoria.label}
              </span>
            )}
          </div>
        </div>

        <XPBar xp={client.xp} xpNext={client.xpNext} color={color} />
      </div>
    </div>
  )
}