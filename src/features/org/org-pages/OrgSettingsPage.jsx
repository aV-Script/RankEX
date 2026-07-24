import { useState, useCallback } from 'react'
import { updateOrganization }    from '../../../firebase/services/org'
import { useToast }              from '../../../hooks/useToast'
import { getPlanLimits }         from '../../../config/plans.config'

const MODULE_LABELS = {
  personal_training: 'Personal Training',
  soccer_academy:     'Soccer Academy',
}

export function OrgSettingsPage({ org, orgId }) {
  const [name,   setName]   = useState(org?.name ?? '')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const plan   = org?.plan ?? 'free'
  const limits = getPlanLimits(plan)

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await updateOrganization(orgId, { name })
      toast.success('Impostazioni salvate')
    } catch {
      toast.error('Impossibile salvare le impostazioni')
    } finally {
      setSaving(false)
    }
  }, [orgId, name, toast])

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
          <div className="input-base w-full opacity-60 cursor-not-allowed">
            {MODULE_LABELS[org?.moduleType] ?? org?.moduleType}
          </div>
          <p className="font-body text-[11px] text-white/25 mt-1.5">
            Solo il super admin può modificare il modulo dell'organizzazione.
          </p>
        </div>

        <div>
          <label className="font-display text-[10px] tracking-[2px] text-white/30 block mb-1.5">
            PIANO
          </label>
          <div className="input-base w-full opacity-60 cursor-not-allowed">
            {plan.toUpperCase()}
          </div>
          <div className="font-body text-[11px] text-white/25 mt-1.5">
            {limits.trainers === Infinity
              ? 'Trainer e clienti illimitati'
              : `Max ${limits.trainers} trainer · Max ${limits.clients} clienti`
            }
            {' — '}solo il super admin può cambiare il piano.
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="py-3 rounded-[3px] font-display text-[12px] font-bold cursor-pointer border-0 transition-opacity hover:opacity-85 disabled:opacity-40 mt-2"
          style={{ background: 'color-mix(in srgb, var(--rx-green) 7%, transparent)', border: '1px solid color-mix(in srgb, var(--rx-green) 35%, transparent)', color: 'var(--rx-green)' }}
        >
          {saving ? 'SALVATAGGIO...' : 'SALVA IMPOSTAZIONI'}
        </button>
      </div>
    </div>
  )
}
