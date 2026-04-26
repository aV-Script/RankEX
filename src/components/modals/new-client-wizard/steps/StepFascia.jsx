import { SOCCER_AGE_GROUPS } from '../../../../config/modules.config'

const SOCCER_COLOR = '#00c8ff'

export function StepFascia({ fascia, setFascia }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-body text-[13px] text-white/40 m-0">
        Seleziona la fascia d'età dell'atleta.
      </p>

      {SOCCER_AGE_GROUPS.map(group => (
        <button
          key={group.value}
          onClick={() => setFascia(group.value)}
          className="flex items-center gap-4 p-4 rounded-[4px] cursor-pointer border transition-all text-left"
          style={fascia === group.value
            ? { background: SOCCER_COLOR + '15', borderColor: SOCCER_COLOR + '55' }
            : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }
          }
        >
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: fascia === group.value ? SOCCER_COLOR : 'rgba(255,255,255,0.15)' }}
          />
          <div className="flex flex-col gap-0.5">
            <span
              className="font-display font-black text-[14px]"
              style={{ color: fascia === group.value ? SOCCER_COLOR : 'rgba(255,255,255,0.7)' }}
            >
              {group.label}
            </span>
            <span className="font-body text-[12px] text-white/30">{group.desc}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
