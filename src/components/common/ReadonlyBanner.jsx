import { useReadonly } from '../../context/ReadonlyContext'

/**
 * Banner informativo mostrato quando il ruolo è staff_readonly.
 * Va messo in cima al contenuto principale.
 */
export function ReadonlyBanner() {
  const readonly = useReadonly()
  if (!readonly) return null

  return (
    <div
      className="w-full py-2 px-6 flex items-center gap-2"
      style={{
        background:  'rgba(248,113,113,0.08)',
        borderBottom: '1px solid rgba(248,113,113,0.2)',
      }}
    >
      <span className="text-[12px]">🔒</span>
      <span className="font-display text-[11px] tracking-[1px]" style={{ color: '#f87171' }}>
        MODALITÀ SOLA LETTURA — le modifiche non sono permesse per questo ruolo
      </span>
    </div>
  )
}
