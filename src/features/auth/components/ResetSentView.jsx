export function ResetSentView({ form }) {
  const { goTo } = form

  return (
    <div className="text-center">
      <div
        className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
        style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      </div>
      <h2 className="font-display font-black text-[22px] text-white m-0 mb-3">
        Email inviata
      </h2>
      <p className="font-body text-white/40 text-[14px] leading-relaxed m-0 mb-8">
        Controlla la tua casella di posta. Il link è valido per 1 ora.
      </p>
      <button
        type="button"
        onClick={() => goTo('login')}
        className="bg-transparent border-none font-body text-[13px] text-blue-400 cursor-pointer hover:text-blue-300 transition-colors p-0"
      >
        Torna al login
      </button>
    </div>
  )
}