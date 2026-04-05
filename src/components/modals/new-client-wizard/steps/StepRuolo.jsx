import { PLAYER_ROLES } from '../../../../config/modules.config'

const SOCCER_COLOR = '#00c8ff'

export function StepRuolo({ ruolo, setRuolo }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-body text-[13px] text-white/40 m-0">
        Seleziona il ruolo del giocatore.
      </p>

      {PLAYER_ROLES.map(role => (
        <button
          key={role.value}
          onClick={() => setRuolo(role.value)}
          className="flex items-center gap-4 p-4 rounded-[4px] cursor-pointer border transition-all text-left"
          style={ruolo === role.value
            ? { background: SOCCER_COLOR + '15', borderColor: SOCCER_COLOR + '55' }
            : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }
          }
        >
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: ruolo === role.value ? SOCCER_COLOR : 'rgba(255,255,255,0.15)' }}
          />
          <span
            className="font-display font-black text-[14px]"
            style={{ color: ruolo === role.value ? SOCCER_COLOR : 'rgba(255,255,255,0.7)' }}
          >
            {role.label}
          </span>
        </button>
      ))}
    </div>
  )
}
