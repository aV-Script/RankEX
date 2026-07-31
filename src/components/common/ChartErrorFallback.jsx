import { Button } from '../ui'

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
      <Button variant="primary" size="sm" onClick={onReset}>RIPROVA</Button>
    </div>
  )
}
