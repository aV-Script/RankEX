/**
 * Controlli di paginazione riusabili.
 * Mostra: prima, prev, pagine, next, ultima.
 * Su mobile mostra solo prev/next e indicatore pagina.
 */
export function Pagination({ page, totalPages, goTo, next, prev, hasNext, hasPrev, from, to, total }) {
  if (totalPages <= 1) return null

  // Genera array di pagine da mostrare — max 5 pagine visibili
  const pages = useMemo(() => {
    const delta = 2
    const range = []
    const left  = Math.max(1, page - delta)
    const right = Math.min(totalPages, page + delta)

    for (let i = left; i <= right; i++) range.push(i)

    if (left > 1) {
      range.unshift('...')
      range.unshift(1)
    }
    if (right < totalPages) {
      range.push('...')
      range.push(totalPages)
    }
    return range
  }, [page, totalPages])

  return (
    <div className="flex flex-col items-center gap-3 mt-6">

      {/* Indicatore risultati */}
      <p className="font-body text-[12px] text-white/30">
        {from}–{to} di {total}
      </p>

      {/* Controlli */}
      <div className="flex items-center gap-1">

        {/* Prev */}
        <PageBtn onClick={prev} disabled={!hasPrev}>‹</PageBtn>

        {/* Pagine — solo desktop */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} className="font-display text-[12px] text-white/25 px-2">
                …
              </span>
            ) : (
              <PageBtn key={p} onClick={() => goTo(p)} active={p === page}>
                {p}
              </PageBtn>
            )
          )}
        </div>

        {/* Indicatore mobile */}
        <span className="sm:hidden font-display text-[12px] text-white/40 px-3">
          {page} / {totalPages}
        </span>

        {/* Next */}
        <PageBtn onClick={next} disabled={!hasNext}>›</PageBtn>

      </div>
    </div>
  )
}

function PageBtn({ onClick, disabled, active, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-lg font-display text-[12px] cursor-pointer border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      style={active
        ? { background: 'rgba(59,130,246,0.2)', borderColor: '#3b82f655', color: '#60a5fa' }
        : { background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }
      }
    >
      {children}
    </button>
  )
}