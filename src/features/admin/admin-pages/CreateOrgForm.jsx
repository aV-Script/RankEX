import { useState }            from 'react'
import { createOrganization }  from '../../../firebase/services/org'

const MODULE_OPTIONS = [
  { value: 'personal_training', label: 'Personal Training' },
  { value: 'soccer_academy',    label: 'Soccer Academy' },
]

const TERMINOLOGY_BY_MODULE = {
  personal_training: [
    { value: 'pt',  label: 'PT — Trainer / Cliente' },
    { value: 'gym', label: 'GYM — Personal Trainer / Membro' },
  ],
  soccer_academy: [
    { value: 'soccer', label: 'Soccer — Coach / Allievo' },
  ],
}

const PLAN_OPTIONS = [
  { value: 'free',       label: 'Free' },
  { value: 'pro',        label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
]

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function generateOrgId(name) {
  const slug = slugify(name) || 'org'
  const rand = Math.random().toString(36).slice(2, 7)
  return `${slug}-${rand}`
}

/**
 * Modal per creare una nuova organizzazione.
 * Props: onClose, onCreated(org)
 */
export function CreateOrgForm({ onClose, onCreated, ownerUid }) {
  const [form,   setForm]   = useState({
    name:               '',
    moduleType:         'personal_training',
    terminologyVariant: 'pt',
    plan:               'free',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  const handleModuleChange = (moduleType) => {
    const variants = TERMINOLOGY_BY_MODULE[moduleType]
    setForm(p => ({ ...p, moduleType, terminologyVariant: variants[0].value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)

    const orgId = generateOrgId(form.name)
    try {
      await createOrganization(orgId, {
        name:               form.name.trim(),
        moduleType:         form.moduleType,
        terminologyVariant: form.terminologyVariant,
        plan:               form.plan,
        ownerId:            ownerUid ?? null,
      })
      onCreated({ id: orgId, ...form, name: form.name.trim(), status: 'active', ownerId: ownerUid ?? null })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const termOptions = TERMINOLOGY_BY_MODULE[form.moduleType]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(8,12,18,0.92)' }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-6"
        style={{ background: '#0d1520', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '4px' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-display font-black text-[16px] text-white mb-5">
          Nuova organizzazione
        </h3>

        <div className="flex flex-col gap-3 mb-5">
          <div>
            <label className="font-display text-[10px] tracking-[1.5px] text-white/40 mb-1.5 block">
              NOME
            </label>
            <input
              className="input-base w-full"
              placeholder="Nome organizzazione"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="font-display text-[10px] tracking-[1.5px] text-white/40 mb-1.5 block">
              MODULO
            </label>
            <select
              className="input-base w-full"
              value={form.moduleType}
              onChange={e => handleModuleChange(e.target.value)}
            >
              {MODULE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-display text-[10px] tracking-[1.5px] text-white/40 mb-1.5 block">
              TERMINOLOGIA
            </label>
            <select
              className="input-base w-full"
              value={form.terminologyVariant}
              onChange={e => setForm(p => ({ ...p, terminologyVariant: e.target.value }))}
              disabled={termOptions.length === 1}
            >
              {termOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-display text-[10px] tracking-[1.5px] text-white/40 mb-1.5 block">
              PIANO
            </label>
            <select
              className="input-base w-full"
              value={form.plan}
              onChange={e => setForm(p => ({ ...p, plan: e.target.value }))}
            >
              {PLAN_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="font-body text-[12px] mb-4" style={{ color: '#f87171' }}>{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 font-display text-[12px] cursor-pointer bg-transparent text-white/40 rounded-[3px]"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            ANNULLA
          </button>
          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="flex-1 py-2.5 font-display text-[12px] font-bold cursor-pointer border-0 rounded-[3px] disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #f87171, #ef4444)', color: '#fff' }}
          >
            {saving ? 'CREAZIONE...' : 'CREA'}
          </button>
        </div>
      </form>
    </div>
  )
}
