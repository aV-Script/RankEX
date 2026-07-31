import { useState }           from 'react'
import { createOrganization } from '../../../firebase/services/org'
import { ADMIN_COLOR }        from '../../../config/app.config'
import { Modal, Field, Button } from '../../../components/ui'

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
  const [errors, setErrors] = useState({})

  const handleModuleChange = (moduleType) => {
    const variants = TERMINOLOGY_BY_MODULE[moduleType]
    setForm(p => ({ ...p, moduleType, terminologyVariant: variants[0].value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setErrors({ name: 'Il nome è obbligatorio' })
      return
    }
    setSaving(true)
    setErrors({})

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
      setErrors({ form: err.message })
    } finally {
      setSaving(false)
    }
  }

  const termOptions = TERMINOLOGY_BY_MODULE[form.moduleType]

  return (
    <Modal title="Nuova organizzazione" onClose={onClose} accentColor={ADMIN_COLOR}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 mb-5">
          <Field label="Nome" htmlFor="org-name" error={errors.name}>
            <input
              id="org-name"
              className="input-base w-full"
              placeholder="Nome organizzazione"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
              autoFocus
            />
          </Field>

          <Field label="Modulo" htmlFor="org-module">
            <select
              id="org-module"
              className="input-base w-full"
              value={form.moduleType}
              onChange={e => handleModuleChange(e.target.value)}
            >
              {MODULE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Terminologia" htmlFor="org-terminology">
            <select
              id="org-terminology"
              className="input-base w-full"
              value={form.terminologyVariant}
              onChange={e => setForm(p => ({ ...p, terminologyVariant: e.target.value }))}
              disabled={termOptions.length === 1}
            >
              {termOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Piano" htmlFor="org-plan">
            <select
              id="org-plan"
              className="input-base w-full"
              value={form.plan}
              onChange={e => setForm(p => ({ ...p, plan: e.target.value }))}
            >
              {PLAN_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {errors.form && (
          <p role="alert" className="font-body text-[12px] mb-4 m-0" style={{ color: ADMIN_COLOR }}>{errors.form}</p>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="neutral" onClick={onClose} className="flex-1">
            ANNULLA
          </Button>
          <Button
            type="submit"
            variant="primary"
            accentColor={ADMIN_COLOR}
            loading={saving}
            disabled={!form.name.trim()}
            className="flex-1"
          >
            CREA
          </Button>
        </div>
      </form>
    </Modal>
  )
}
