import { useState, useCallback } from 'react'
import { updateOrganization }    from '../../../firebase/services/org'
import { useToast }              from '../../../hooks/useToast'
import { PLAN_OPTIONS, getPlanLimits } from '../../../config/plans.config'

const MODULE_OPTIONS = [
  { value: 'personal_training', label: 'Personal Training' },
  { value: 'soccer_academy',    label: 'Soccer Academy' },
]

export function OrgSettingsPage({ org, orgId }) {
  const [name,       setName]       = useState(org?.name ?? '')
  const [moduleType, setModuleType] = useState(org?.moduleType ?? 'personal_training')
  const [plan,       setPlan]       = useState(org?.plan ?? '')
  const [saving,     setSaving]     = useState(false)
  const toast = useToast()

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await updateOrganization(orgId, { name, moduleType, plan })
      toast.success('Impostazioni salvate')
    } catch {
      toast.error('Impossibile salvare le impostazioni')
    } finally {
      setSaving(false)
    }
  }, [orgId, name, moduleType, plan, toast])

  return (
    <div className="px-6 py-8 text-white max-w-lg">
      <h1 className="font-display font-black text-[20px] mb-8">Impostazioni</h1>

      <div className="flex flex-col gap-5">
        <div>
          <label className="font-display text-[10px] tracking-[2px] text-white/30 block mb-1.5">
            NOME ORGANIZZAZIONE
          </label>
          <input
            className="input-base w-full"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="font-display text-[10px] tracking-[2px] text-white/30 block mb-1.5">
            MODULO
          </label>
          <select
            className="input-base w-full"
            value={moduleType}
            onChange={e => setModuleType(e.target.value)}
          >
            {MODULE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-display text-[10px] tracking-[2px] text-white/30 block mb-1.5">
            PIANO
          </label>
          <select
            className="input-base w-full"
            value={plan || 'free'}
            onChange={e => setPlan(e.target.value)}
          >
            {PLAN_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {(() => {
            const limits = getPlanLimits(plan || 'free')
            return (
              <div className="font-body text-[11px] text-white/25 mt-1.5">
                {limits.trainers === Infinity
                  ? 'Trainer e clienti illimitati'
                  : `Max ${limits.trainers} trainer · Max ${limits.clients} clienti`
                }
              </div>
            )
          })()}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="py-3 rounded-[3px] font-display text-[12px] font-bold cursor-pointer border-0 transition-opacity hover:opacity-85 disabled:opacity-40 mt-2"
          style={{ background: 'linear-gradient(135deg, #1aff6e, #0fd65a, #00c8ff)', color: '#080c12' }}
        >
          {saving ? 'SALVATAGGIO...' : 'SALVA IMPOSTAZIONI'}
        </button>
      </div>
    </div>
  )
}
