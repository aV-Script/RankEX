import { useState }                from 'react'
import { Field }                   from '../../components/ui'
import { updatePassword }          from 'firebase/auth'
import { doc, updateDoc }          from 'firebase/firestore'
import { auth }                    from '../../firebase/services/auth'
import { db }                      from '../../firebase/services/db'
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors'
import { validatePassword }        from '../../utils/validation'

export default function ChangePasswordScreen({ userId, onDone }) {
  const [form,    setForm]    = useState({ password: '', confirm: '' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    const pwCheck = validatePassword(form.password)
    if (!pwCheck.valid)                 e.password = pwCheck.error
    if (form.password !== form.confirm) e.confirm  = 'Le password non coincidono'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await updatePassword(auth.currentUser, form.password)
      await updateDoc(doc(db, 'users', userId), { mustChangePassword: false })
      onDone()
    } catch (err) {
      setErrors({ password: getFirebaseErrorMessage(err, 'Impossibile aggiornare la password') })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-display font-black text-[28px] bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            FIT<span className="font-normal">QUEST</span>
          </div>
          <div className="text-white/30 font-body text-[13px] mt-1">Imposta la tua password</div>
        </div>

        <div className="bg-white/[.04] border border-white/[.08] rounded-3xl p-8">
          <div className="mb-6">
            <div className="font-display text-white text-[16px] mb-1">Benvenuto!</div>
            <div className="font-body text-white/40 text-[13px]">
              Per accedere alla tua area personale, imposta una password sicura.
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Field label="Nuova Password" error={errors.password} htmlFor="cp-password">
              <input id="cp-password" type="password" placeholder="Minimo 8 caratteri"
                value={form.password}
                onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })) }}
                autoFocus
                aria-invalid={!!errors.password}
                className="w-full bg-white/[.05] border border-white/10 rounded-xl px-4 py-3 text-white font-body text-[14px] outline-none focus:border-blue-400/50 transition-colors" />
            </Field>

            <Field label="Conferma Password" error={errors.confirm} htmlFor="cp-confirm">
              <input id="cp-confirm" type="password" placeholder="Ripeti la password"
                value={form.confirm}
                onChange={e => { setForm(p => ({ ...p, confirm: e.target.value })); setErrors(p => ({ ...p, confirm: '' })) }}
                aria-invalid={!!errors.confirm}
                className="w-full bg-white/[.05] border border-white/10 rounded-xl px-4 py-3 text-white font-body text-[14px] outline-none focus:border-blue-400/50 transition-colors" />
            </Field>

            {/* Requisiti */}
            <ul className="m-0 p-0 list-none flex flex-col gap-1">
              {[
                ['Almeno 8 caratteri e un numero', form.password.length >= 8 && /[0-9]/.test(form.password)],
                ['Le password coincidono', form.password.length > 0 && form.password === form.confirm],
              ].map(([label, ok]) => (
                <li key={label} className={`font-body text-[12px] flex items-center gap-2 ${ok ? 'text-emerald-400' : 'text-white/25'}`}>
                  <span>{ok ? '✓' : '○'}</span> {label}
                </li>
              ))}
            </ul>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-3.5 rounded-xl font-display text-[13px] font-bold tracking-widest text-white cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', border: '1px solid rgba(99,102,241,0.4)' }}>
              {loading ? 'SALVATAGGIO...' : 'ACCEDI A FITQUEST →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

