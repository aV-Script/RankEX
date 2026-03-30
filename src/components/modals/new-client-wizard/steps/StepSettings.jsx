import { Input } from '../../../ui'
import { calcSessionConfig } from '../../../../utils/gamification'

export function StepSettings({ settings, setSettings, groups }) {
  const { monthlySessions, xpPerSession } = calcSessionConfig(settings.sessionsPerWeek)

  const update = (key) => (val) =>
    setSettings(p => ({ ...p, [key]: val }))

  return (
    <div className="flex flex-col gap-5">

      {/* Frequenza */}
      <div>
        <div className="font-display text-[10px] text-white/40 tracking-wider mb-3">
          SESSIONI PER SETTIMANA
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range" min={1} max={7} step={1}
            value={settings.sessionsPerWeek}
            onChange={e => update('sessionsPerWeek')(e.target.value)}
            className="flex-1"
          />
          <span className="font-display font-black text-[22px] w-8 text-center" style={{ color: '#0fd65a' }}>
            {settings.sessionsPerWeek}
          </span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-body text-[11px] text-white/25">1×/sett</span>
          <span className="font-body text-[11px] text-white/40">
            ~{monthlySessions} sessioni/mese · {xpPerSession} XP/sessione
          </span>
          <span className="font-body text-[11px] text-white/25">7×/sett</span>
        </div>
      </div>

      {/* Gruppo */}
      <div>
        <div className="font-display text-[10px] text-white/40 tracking-wider mb-2">
          GRUPPO (opzionale)
        </div>

        {groups.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-3">
            <button
              onClick={() => setSettings(p => ({ ...p, groupId: null, newGroupName: '' }))}
              className="flex items-center gap-2 px-3 py-2.5 rounded-[3px] cursor-pointer border-none bg-transparent text-left"
              style={!settings.groupId && !settings.newGroupName
                ? { background: 'rgba(255,255,255,0.07)', color: '#fff' }
                : { color: 'rgba(255,255,255,0.35)' }
              }
            >
              <span className="font-body text-[13px]">Nessun gruppo</span>
            </button>

            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => setSettings(p => ({ ...p, groupId: g.id, newGroupName: '' }))}
                className="flex items-center justify-between px-3 py-2.5 rounded-[3px] cursor-pointer border-none text-left"
                style={settings.groupId === g.id
                  ? { background: 'rgba(15,214,90,0.12)', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.55)' }
                }
              >
                <span className="font-body text-[13px]">{g.name}</span>
                <span className="font-display text-[10px] opacity-40">
                  {g.clientIds.length} clienti
                </span>
              </button>
            ))}
          </div>
        )}

        <Input
          className="w-full"
          placeholder="Oppure crea un nuovo gruppo..."
          value={settings.newGroupName}
          onChange={e => setSettings(p => ({ ...p, newGroupName: e.target.value, groupId: null }))}
        />
        {settings.newGroupName.trim() && (
          <p className="font-body text-[11px] mt-1.5 m-0" style={{ color: 'rgba(15,214,90,0.7)' }}>
            Verrà creato il gruppo "{settings.newGroupName.trim()}"
          </p>
        )}
      </div>
    </div>
  )
}