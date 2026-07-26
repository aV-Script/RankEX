import { useState, useRef }      from 'react'
import { Field, Input, Button }  from '../../../components/ui'
import { useFocusTrap }          from '../../../hooks/useFocusTrap'
import { createMemberUseCase }   from '../../../usecases/createMemberUseCase'

const ROLE_OPTIONS = [
  { value: 'trainer',        label: 'Trainer' },
  { value: 'staff_readonly', label: 'Solo lettura' },
  { value: 'org_admin',      label: 'Admin' },
]

/**
 * Flusso: crea membro via Cloud Function (creaMembroTeam) — Auth + Firestore in atomico.
 */
export function CreateMemberForm({ orgId, onClose, onCreated }) {
  const [form,   setForm]   = useState({ name: '', email: '', password: '', role: 'trainer' })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)
  const formRef = useRef(null)
  useFocusTrap(formRef, true)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return
    setSaving(true)
    setError(null)

    try {
      const member = await createMemberUseCase(orgId, form.role, form.name, form.email, form.password)
      onCreated({ id: member.uid, name: member.name, email: member.email, role: member.role })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(8,12,18,0.9)' }}
      onClick={onClose}
    >
      <form
        ref={formRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-member-title"
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-6"
        style={{ background: 'var(--rx-surface)', border: '1px solid var(--rx-border)', borderRadius: '4px' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 id="create-member-title" className="font-display font-black text-[16px] text-white mb-5">
          Aggiungi membro
        </h3>

        <div className="flex flex-col gap-3 mb-5">
          <Field label="Nome" htmlFor="member-name">
            <Input
              id="member-name"
              placeholder="Nome"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
            />
          </Field>
          <Field label="Email" htmlFor="member-email">
            <Input
              id="member-email"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
            />
          </Field>
          <Field label="Password temporanea" htmlFor="member-password">
            <Input
              id="member-password"
              placeholder="Password temporanea"
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
            />
          </Field>
          <Field label="Ruolo" htmlFor="member-role">
            <select
              id="member-role"
              className="input-base"
              value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
            >
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {error && (
          <p role="alert" className="font-body text-[12px] mb-4" style={{ color: '#f87171' }}>{error}</p>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="neutral" className="flex-1" onClick={onClose}>
            ANNULLA
          </Button>
          <Button type="submit" variant="primary" className="flex-1" loading={saving}>
            CREA
          </Button>
        </div>
      </form>
    </div>
  )
}
