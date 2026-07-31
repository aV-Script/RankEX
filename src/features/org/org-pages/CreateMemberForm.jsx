import { useState }              from 'react'
import { Modal, Field, Input, Button } from '../../../components/ui'
import { createMemberUseCase }   from '../../../usecases/createMemberUseCase'
import { getFirebaseErrorMessage } from '../../../utils/firebaseErrors'
import { validateRequired }      from '../../../utils/validation'

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
  const [errors, setErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()

    const nameCheck  = validateRequired(form.name, 'Nome')
    const emailCheck = validateRequired(form.email, 'Email')
    const pwCheck     = validateRequired(form.password, 'Password')
    if (!nameCheck.valid || !emailCheck.valid || !pwCheck.valid) {
      setErrors({ name: nameCheck.error, email: emailCheck.error, password: pwCheck.error })
      return
    }

    setSaving(true)
    setErrors({})

    try {
      const member = await createMemberUseCase(orgId, form.role, form.name, form.email, form.password)
      onCreated({ id: member.uid, name: member.name, email: member.email, role: member.role })
    } catch (err) {
      const message = getFirebaseErrorMessage(err, 'Impossibile creare il membro')
      const isEmailError = err?.code === 'auth/email-already-in-use' || err?.code === 'auth/invalid-email'
      setErrors(isEmailError ? { email: message } : { form: message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Aggiungi membro" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 mb-5">
          <Field label="Nome" htmlFor="member-name" error={errors.name}>
            <Input
              id="member-name"
              placeholder="Nome"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
            />
          </Field>
          <Field label="Email" htmlFor="member-email" error={errors.email}>
            <Input
              id="member-email"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
            />
          </Field>
          <Field label="Password temporanea" htmlFor="member-password" error={errors.password}>
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

        {errors.form && (
          <p role="alert" className="font-body text-[12px] mb-4 m-0" style={{ color: '#f87171' }}>{errors.form}</p>
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
    </Modal>
  )
}
