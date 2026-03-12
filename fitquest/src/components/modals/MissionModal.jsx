import { useState } from 'react'
import { Modal, Input, Button } from '../ui'
import { DEFAULT_MISSION_TEMPLATES } from '../../constants/missions'

export function MissionModal({ onClose, onAdd, customTemplates = [] }) {
  const [mode, setMode] = useState('template') // 'template' | 'custom'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', xp: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const allTemplates = [...DEFAULT_MISSION_TEMPLATES, ...customTemplates]

  const selectTemplate = (tpl) => {
    setSelected(tpl.id)
    setForm({ name: tpl.name, description: tpl.description, xp: String(tpl.xp) })
    setMode('custom') // passa al form già precompilato
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Inserisci un nome'
    if (!form.xp || isNaN(form.xp) || +form.xp <= 0) e.xp = 'XP non valido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (saveAsTemplate = false) => {
    if (!validate()) return
    setLoading(true)
    try {
      await onAdd({
        name:        form.name.trim(),
        description: form.description.trim(),
        xp:          parseInt(form.xp),
        saveAsTemplate,
      })
      onClose()
    } catch { setLoading(false) }
  }

  return (
    <Modal title="Nuova Missione" onClose={onClose}>
      {/* Tab switcher */}
      <div className="flex gap-2 mb-5">
        {['template', 'custom'].map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-xl font-display text-[12px] border-2 cursor-pointer transition-all
              ${mode === m ? 'bg-blue-500/20 border-blue-400 text-white' : 'bg-white/[.04] border-transparent text-white/40 hover:text-white/60'}`}>
            {m === 'template' ? 'Da Template' : 'Personalizzata'}
          </button>
        ))}
      </div>

      {/* Template list */}
      {mode === 'template' && (
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          {allTemplates.map(tpl => (
            <button key={tpl.id} onClick={() => selectTemplate(tpl)}
              className="text-left bg-white/[.03] border border-white/[.07] rounded-xl p-3.5 cursor-pointer hover:bg-white/[.07] hover:border-blue-400/40 transition-all group">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="font-body font-bold text-[15px] text-white">{tpl.name}</div>
                  {tpl.description && (
                    <div className="text-white/40 font-body text-[12px] mt-0.5">{tpl.description}</div>
                  )}
                </div>
                <span className="font-display text-[12px] text-yellow-400 whitespace-nowrap shrink-0">{tpl.xp} XP</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Custom form */}
      {mode === 'custom' && (
        <div className="flex flex-col gap-3.5">
          <Field label="Nome Missione" error={errors.name}>
            <Input placeholder="Es. Prima sessione cardio" value={form.name}
              onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })) }}
              autoFocus={!selected} />
          </Field>
          <Field label="Descrizione (opzionale)">
            <Input placeholder="Descrivi la missione..." value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </Field>
          <Field label="XP Ricompensa" error={errors.xp}>
            <Input type="number" placeholder="Es. 200" value={form.xp}
              onChange={e => { setForm(p => ({ ...p, xp: e.target.value })); setErrors(p => ({ ...p, xp: '' })) }} />
          </Field>

          <div className="flex flex-col gap-2 mt-1">
            <Button variant="primary" className="w-full" loading={loading} onClick={() => handleSubmit(false)}>
              AGGIUNGI MISSIONE
            </Button>
            <button onClick={() => handleSubmit(true)} disabled={loading}
              className="w-full py-3 rounded-xl bg-transparent border border-white/10 text-white/50 font-display text-[12px] cursor-pointer hover:text-white/70 hover:border-white/20 transition-all">
              AGGIUNGI E SALVA COME TEMPLATE
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <div className="text-white/40 text-[11px] font-display tracking-wider mb-1.5">{label.toUpperCase()}</div>
      {children}
      {error && <p className="m-0 mt-1 text-red-400 font-body text-[12px]">{error}</p>}
    </div>
  )
}
