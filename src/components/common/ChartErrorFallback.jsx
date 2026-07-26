/**
 * Fallback compatto per ErrorBoundary attorno a sezioni grafico (Recharts/SVG).
 * A differenza di ErrorFallback (full-page), contiene il crash nella card
 * del grafico senza svuotare il resto della dashboard/tab (RX-49).
 */
export function ChartErrorFallback({ onReset }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="font-body text-[13px] text-white/60">
        Impossibile visualizzare questo grafico.
      </span>
      <button
        onClick={onReset}
        className="font-display text-[10px] tracking-widest px-3 py-1.5 rounded-[3px] cursor-pointer border-0 transition-opacity hover:opacity-85"
        style={{ background: 'color-mix(in srgb, var(--rx-green) 7%, transparent)', border: '1px solid color-mix(in srgb, var(--rx-green) 35%, transparent)', color: 'var(--rx-green)', fontWeight: 700 }}
      >
        RIPROVA
      </button>
    </div>
  )
}
