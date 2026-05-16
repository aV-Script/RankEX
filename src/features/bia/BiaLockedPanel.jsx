/**
 * Pannello BIA bloccato — mostrato al cliente che non ha la BIA.
 */
export function BiaLockedPanel({ profileType, _color }) {
  const isTestsOnly = profileType === 'tests_only'
  const lockedLabel = isTestsOnly ? 'Bioimpedenziometria' : 'Test atletici'
  const lockedDesc  = isTestsOnly
    ? 'Analisi completa della composizione corporea: massa grassa, muscolare, acqua e molto altro.'
    : 'Valutazione atletica completa con test fisici standardizzati e sistema di ranking.'

  return (
    <section className="px-6 py-6">
      <div
        className="flex flex-col items-center justify-center text-center gap-4 py-10 rounded-[4px]"
        style={{
          background: 'rgba(13,21,32,0.6)',
          border:     '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Icona lucchetto */}
        <div
          className="w-12 h-12 rounded-[4px] flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border:     '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <svg
            width="22" height="22" viewBox="0 0 24 24"
            fill="none" stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <div>
          <div className="font-display font-black text-[15px] text-white mb-1">
            {lockedLabel}
          </div>
          <div className="font-body text-[13px] text-white/35 max-w-xs">
            {lockedDesc}
          </div>
        </div>

        <div
          className="font-display text-[10px] tracking-[2px] text-white/25 px-4 py-1.5 rounded-[2px]"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}
        >
          CONTATTA IL TUO TRAINER
        </div>
      </div>
    </section>
  )
}
