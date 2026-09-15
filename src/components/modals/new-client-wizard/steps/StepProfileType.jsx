import { PROFILE_CATEGORIES } from '../../../../constants/bia'

export function StepProfileType({ profileType, setProfileType }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-body text-[13px] text-white/40 m-0">
        Scegli il tipo di valutazione per questo cliente.
        Potrai sempre aggiornarlo in seguito.
      </p>

      {PROFILE_CATEGORIES.map(cat => (
        <button
          key={cat.id}
          onClick={() => setProfileType(cat.id)}
          className="flex items-start gap-4 p-4 rounded-[4px] cursor-pointer border transition-all text-left"
          style={profileType === cat.id
            ? { background: `color-mix(in srgb, ${cat.color} 7%, transparent)`, borderColor: `color-mix(in srgb, ${cat.color} 27%, transparent)` }
            : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }
          }
        >
          {/* Indicatore selezione */}
          <div
            className="w-3 h-3 rounded-full mt-1.5 shrink-0"
            style={{ background: profileType === cat.id ? cat.color : 'rgba(255,255,255,0.15)' }}
          />
          <div className="flex-1">
            <div
              className="font-display font-black text-[14px] mb-1"
              style={{ color: profileType === cat.id ? cat.color : 'rgba(255,255,255,0.7)' }}
            >
              {cat.label}
            </div>
            <div className="font-body text-[12px] text-white/40">
              {cat.desc}
            </div>
            <div className="flex gap-2 mt-2">
              {cat.hasTests && (
                <span
                  className="font-display text-[9px] px-2 py-0.5 rounded-[2px]"
                  style={{ background: `color-mix(in srgb, ${cat.color} 9%, transparent)`, color: `color-mix(in srgb, ${cat.color} 80%, transparent)` }}
                >
                  TEST ATLETICI
                </span>
              )}
              {cat.hasBia && (
                <span
                  className="font-display text-[9px] px-2 py-0.5 rounded-[2px]"
                  style={{ background: `color-mix(in srgb, ${cat.color} 9%, transparent)`, color: `color-mix(in srgb, ${cat.color} 80%, transparent)` }}
                >
                  BIOIMPEDENZIOMETRIA
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
