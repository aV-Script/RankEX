import { useState }              from 'react'
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
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-6"
        style={{ background: 'var(--rx-surface)', border: '1px solid var(--rx-border)', borderRadius: '4px' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-display font-black text-[16px] text-white mb-5">
          Aggiungi membro
        </h3>

        <div className="flex flex-col gap-3 mb-5">
          <input
            className="input-base"
            placeholder="Nome"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            required
          />
          <input
            className="input-base"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            required
          />
          <input
            className="input-base"
            placeholder="Password temporanea"
            type="password"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            required
          />
          <select
            className="input-base"
            value={form.role}
            onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
          >
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="font-body text-[12px] mb-4" style={{ color: '#f87171' }}>{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 font-display text-[12px] cursor-pointer bg-transparent text-white/40"
            style={{ borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            ANNULLA
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 font-display text-[12px] font-bold cursor-pointer border-0 disabled:opacity-40"
            style={{ background: 'color-mix(in srgb, var(--rx-green) 7%, transparent)', border: '1px solid color-mix(in srgb, var(--rx-green) 35%, transparent)', borderRadius: '3px', color: 'var(--rx-green)' }}
          >
            {saving ? 'CREAZIONE...' : 'CREA'}
          </button>
        </div>
      </form>
    </div>
  )
}
