export function ErrorFallback({ error, onReset }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div>
        <div className="font-display font-black text-[28px] bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
          ERRORE
        </div>
        <p className="font-body text-white/40 text-[14px] mt-2 m-0">
          Qualcosa è andato storto.
        </p>
        {error?.message && (
          <p className="font-body text-white/20 text-[12px] mt-2 m-0 max-w-xs mx-auto">
            {error.message}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="px-4 py-2.5 rounded-[3px] font-display text-[11px] tracking-widest text-white border border-white/20 bg-transparent cursor-pointer hover:bg-white/10 transition-colors"
        >
          RIPROVA
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2.5 rounded-[3px] font-display text-[11px] tracking-widest text-white cursor-pointer hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #1aff6e, #0fd65a, #00c8ff)', border: 'none' }}
        >
          RICARICA
        </button>
      </div>
    </div>
  )
}
