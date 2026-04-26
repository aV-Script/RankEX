import { useState, useCallback }  from 'react'
import { RankRing }               from '../../../components/ui/RankRing'
import { getCategoriaById }        from '../../../constants'
import { resetPassword }           from '../../../firebase/services/auth'

/**
 * Hero section del dashboard cliente.
 * Mostra rank ring, nome, categoria, XP bar e azioni (back + elimina + reset pw).
 */
export function DashboardHeader({ client, rankObj, color, biaRankObj, onBack, onDelete, onExport }) {
  const categoria = getCategoriaById(client.categoria)
  const [resetState, setResetState] = useState('idle') // 'idle' | 'loading' | 'sent' | 'error'

  const handleResetPassword = useCallback(async () => {
    if (!client.email || resetState === 'loading') return
    setResetState('loading')
    try {
      await resetPassword(client.email)
      setResetState('sent')
      setTimeout(() => setResetState('idle'), 4000)
    } catch {
      setResetState('error')
      setTimeout(() => setResetState('idle'), 3000)
    }
  }, [client.email, resetState])

  return (
    <div className="relative">

      {/* Barra azioni */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/[.05]">

        <div className="flex items-center gap-2">
          {/* Esporta PDF */}
          {onExport && (
            <button
              onClick={onExport}
              title="Esporta scheda atleta come PDF"
              className="bg-transparent border rounded-[3px] px-3 py-1.5 font-display text-[11px] cursor-pointer transition-all"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(200,212,224,0.4)' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
                e.currentTarget.style.color = 'rgba(200,212,224,0.7)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                e.currentTarget.style.color = 'rgba(200,212,224,0.4)'
              }}
            >
              ESPORTA PDF
            </button>
          )}

          {/* Reset password */}
          <button
            onClick={handleResetPassword}
            disabled={resetState === 'loading' || resetState === 'sent'}
            title={`Invia reset password a ${client.email}`}
            className="bg-transparent border rounded-[3px] px-3 py-1.5 font-display text-[11px] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-default"
            style={resetState === 'sent'
              ? { borderColor: 'rgba(15,214,90,0.4)', color: '#0fd65a' }
              : resetState === 'error'
              ? { borderColor: 'rgba(248,113,113,0.4)', color: '#f87171' }
              : { borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(200,212,224,0.4)' }
            }
            onMouseEnter={e => {
              if (resetState === 'idle') {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
                e.currentTarget.style.color = 'rgba(200,212,224,0.7)'
              }
            }}
            onMouseLeave={e => {
              if (resetState === 'idle') {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                e.currentTarget.style.color = 'rgba(200,212,224,0.4)'
              }
            }}
          >
            {resetState === 'loading' ? 'INVIO...'
             : resetState === 'sent'  ? 'EMAIL INVIATA'
             : resetState === 'error' ? 'ERRORE'
             : 'RESET PASSWORD'}
          </button>

          <button
            onClick={onDelete}
            className="bg-transparent border border-red-500/20 rounded-[3px] px-3 py-1.5 text-red-400/50 font-display text-[11px] cursor-pointer hover:border-red-500/50 hover:text-red-400 transition-all"
          >
            ELIMINA
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="px-4 sm:px-6 py-8 flex flex-col items-center text-center gap-4">

        {/* Ring(s) rank */}
        {biaRankObj ? (
          <div className="flex items-end gap-6">
            <div className="flex flex-col items-center gap-1.5">
              <RankRing rankObj={rankObj} xp={client.xp} xpNext={client.xpNext} size={120} />
              <span className="font-display text-[10px] font-semibold tracking-[2px] text-white/30">TEST</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <RankRing rankObj={biaRankObj} xp={client.xp} xpNext={client.xpNext} size={120} />
              <span className="font-display text-[10px] font-semibold tracking-[2px] text-white/30">BIA</span>
            </div>
          </div>
        ) : (
          <RankRing rankObj={rankObj} xp={client.xp} xpNext={client.xpNext} size={160} />
        )}

        <div>
          <div className="font-display font-black text-[28px] leading-none tracking-wide text-white">
            {client.name}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            <span className="font-display text-[12px] rounded-[3px] px-3 py-1 text-white/40 border border-white/10">
              LIVELLO {client.level}
            </span>
            {categoria && (
              <span
                className="font-display text-[12px] rounded-[3px] px-3 py-1"
                style={{ background: categoria.color + '1a', color: categoria.color, border: `1px solid ${categoria.color}44` }}
              >
                {categoria.label}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}