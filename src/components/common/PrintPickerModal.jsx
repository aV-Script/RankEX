export function PrintPickerModal({ onSelect, onCancel }) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.72)' }}>
      <div
        className="rounded-xl p-6 flex flex-col gap-5"
        style={{ background: '#0c1219', border: '1px solid #1e293b', width: 360, boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}
      >
        <div>
          <div className="font-display font-black tracking-[3px] text-[13px] text-white uppercase mb-1">Esporta PDF</div>
          <div className="text-[11px] text-white/40 font-body">Scegli il formato di stampa</div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => onSelect('dark')}
            className="flex items-center gap-4 p-4 rounded-lg text-left cursor-pointer transition-colors"
            style={{ background: '#07090e', border: '1px solid #1e293b' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--rx-green)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#1e293b'}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center" style={{ background: '#0f1820' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--rx-green)" strokeWidth="1.8">
                <path d="M21 15.9A9 9 0 1 1 8.1 3a7 7 0 0 0 12.9 12.9z"/>
              </svg>
            </div>
            <div>
              <div className="font-display font-bold text-[11px] tracking-[1.5px] text-white uppercase mb-0.5">Colore — Dark</div>
              <div className="text-[10px] text-white/40">Sfondo scuro, colori rank completi</div>
            </div>
          </button>

          <button
            onClick={() => onSelect('bw')}
            className="flex items-center gap-4 p-4 rounded-lg text-left cursor-pointer transition-colors"
            style={{ background: '#07090e', border: '1px solid #1e293b' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#94a3b8'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#1e293b'}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center" style={{ background: '#0f1820' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18" strokeWidth="1.2"/>
              </svg>
            </div>
            <div>
              <div className="font-display font-bold text-[11px] tracking-[1.5px] text-white uppercase mb-0.5">B&amp;N — Economica</div>
              <div className="text-[10px] text-white/40">Sfondo bianco, scala di grigi, meno inchiostro</div>
            </div>
          </button>
        </div>

        <button
          onClick={onCancel}
          className="text-white/30 hover:text-white/60 text-[10px] font-display tracking-[2px] uppercase transition-colors bg-transparent border-none cursor-pointer self-center"
        >
          Annulla
        </button>
      </div>
    </div>
  )
}
