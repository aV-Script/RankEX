import { SectionLabel } from '../../components/ui'

/** Sezione del dettaglio di una valutazione */
export function DetailSection({ title, children }) {
  return (
    <section className="flex flex-col gap-1.5">
      <SectionLabel className="!mb-1">{title}</SectionLabel>
      {children}
    </section>
  )
}

/** Riga etichetta → valore del dettaglio */
export function Row({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-3">
      <span className="sm:w-48 shrink-0 text-white/40">{label}</span>
      <span className="text-white/80 break-words">{value}</span>
    </div>
  )
}
