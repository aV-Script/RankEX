import { Button } from '../ui'

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
          <p className="font-body text-white/60 text-[12px] mt-2 m-0 max-w-xs mx-auto">
            {error.message}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="neutral" size="sm" onClick={onReset}>RIPROVA</Button>
        <Button variant="primary" size="sm" onClick={() => window.location.reload()}>RICARICA</Button>
      </div>
    </div>
  )
}
