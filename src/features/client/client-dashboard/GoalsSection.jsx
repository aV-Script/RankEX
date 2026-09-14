import { useState }                   from 'react'
import { SectionLabel, EmptyState, Field, Input, Button } from '../../../components/ui'
import { Skeleton }                   from '../../../components/common/Skeleton'
import { ConfirmDialog }              from '../../../components/common/ConfirmDialog'
import { useGoals }                   from '../../../hooks/useGoals'
import { getTestsForCategoria }       from '../../../constants'
import { getGoalDisplayStatus }       from '../../../utils/goals'
import { ICON_GOALS }                 from './clientDashboardIcons'

const STATUS_META = {
  active:    { label: 'In corso',   color: 'var(--rx-accent)' },
  achieved:  { label: 'Raggiunto',  color: '#facc15' },
  missed:    { label: 'Scaduto',    color: '#f87171' },
  cancelled: { label: 'Annullato',  color: 'rgba(255,255,255,0.35)' },
}

/**
 * Sezione Obiettivi nel profilo cliente (vista trainer).
 * Il coach fissa un target percentile su un test specifico entro una data —
 * il raggiungimento è rilevato server-side al prossimo campionamento
 * (functions/src/callable/salvaCampionamento.js), mai calcolato qui.
 *
 * @param {object}  client
 * @param {string}  orgId
 * @param {string}  color    — colore accent del profilo
 * @param {boolean} readonly — true per staff_readonly
 */
export function GoalsSection({ client, orgId, color, readonly = false }) {
  const { goals, loading, handleAddGoal, handleCancelGoal } = useGoals(orgId, client.id)
  const tests = getTestsForCategoria(client.categoria)

  const [formOpen,    setFormOpen]    = useState(false)
  const [testKey,     setTestKey]     = useState(tests[0]?.key ?? '')
  const [percentile,  setPercentile]  = useState('70')
  const [deadline,    setDeadline]    = useState('')
  const [note,        setNote]        = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [cancellingId, setCancellingId] = useState(null)
  const [confirmCancelId, setConfirmCancelId] = useState(null)

  const resetForm = () => {
    setTestKey(tests[0]?.key ?? '')
    setPercentile('70')
    setDeadline('')
    setNote('')
  }

  const handleSubmit = async () => {
    if (!testKey || !deadline || submitting) return
    const test = tests.find(t => t.key === testKey)
    setSubmitting(true)
    const ok = await handleAddGoal({
      testKey,
      testLabel:        test?.label ?? testKey,
      targetPercentile: Number(percentile),
      deadline,
      note,
    })
    setSubmitting(false)
    if (ok) {
      resetForm()
      setFormOpen(false)
    }
  }

  const handleConfirmCancel = async () => {
    if (!confirmCancelId) return
    setCancellingId(confirmCancelId)
    await handleCancelGoal(confirmCancelId)
    setCancellingId(null)
    setConfirmCancelId(null)
  }

  return (
    <section className="px-4 py-6">
      <div className="rounded-[4px] p-5 rx-card">
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>◈ Obiettivi</SectionLabel>
          {!readonly && !formOpen && (
            <button
              onClick={() => setFormOpen(true)}
              className="font-display text-[10px] tracking-[1.5px] uppercase px-3 py-1.5 rounded-[3px] cursor-pointer border transition-all"
              style={{ color, borderColor: color + '55', background: color + '11' }}
            >
              + Nuovo
            </button>
          )}
        </div>

        {formOpen && (
          <div className="mb-5 p-4 rounded-[4px] flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Field label="Test" htmlFor="goal-test">
              <select
                id="goal-test"
                className="input-base w-full"
                value={testKey}
                onChange={e => setTestKey(e.target.value)}
              >
                {tests.map(t => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Percentile target" htmlFor="goal-percentile">
                <Input
                  id="goal-percentile"
                  type="number"
                  min={1}
                  max={100}
                  value={percentile}
                  onChange={e => setPercentile(e.target.value)}
                />
              </Field>
              <Field label="Scadenza" htmlFor="goal-deadline">
                <Input
                  id="goal-deadline"
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </Field>
            </div>
            <Field label="Nota (opzionale)" htmlFor="goal-note">
              <Input
                id="goal-note"
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="es. per la finale regionale"
              />
            </Field>
            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={() => { setFormOpen(false); resetForm() }}
                className="font-display text-[11px] px-3 py-1.5 rounded-[3px] cursor-pointer border-none bg-transparent text-white/40 hover:text-white/70 transition-colors"
              >
                ANNULLA
              </button>
              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={!testKey || !deadline}
                accentColor={color}
                size="sm"
              >
                FISSA OBIETTIVO
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <Skeleton variant="list" count={2} />
        ) : goals.length === 0 ? (
          <EmptyState
            color={color}
            icon={ICON_GOALS}
            title="Nessun obiettivo"
            description="Fissa un target su un test specifico per motivare il prossimo campionamento."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                readonly={readonly}
                cancelling={cancellingId === goal.id}
                onCancel={() => setConfirmCancelId(goal.id)}
              />
            ))}
          </div>
        )}

        {confirmCancelId && (
          <ConfirmDialog
            title="Annullare l'obiettivo?"
            description="L'obiettivo verrà segnato come annullato — resta visibile nello storico."
            confirmLabel="ANNULLA OBIETTIVO"
            variant="danger"
            loading={cancellingId === confirmCancelId}
            onConfirm={handleConfirmCancel}
            onCancel={() => setConfirmCancelId(null)}
          />
        )}
      </div>
    </section>
  )
}

function GoalCard({ goal, readonly, cancelling, onCancel }) {
  const status = getGoalDisplayStatus(goal)
  const meta   = STATUS_META[status]

  return (
    <div
      className="rounded-[4px] p-4 flex items-center justify-between gap-3"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display font-bold text-[12px] text-white/80">{goal.testLabel}</span>
          <span
            className="rounded-full font-display font-bold text-[9px] px-2 py-0.5"
            style={{ background: meta.color + '18', color: meta.color, border: `1px solid ${meta.color}33` }}
          >
            {meta.label}
          </span>
        </div>
        <span className="font-body text-[11px] text-white/50">
          {goal.targetPercentile}° percentile entro {formatDate(goal.deadline)}
          {status === 'achieved' && goal.achievedPercentile != null && ` — raggiunto a ${goal.achievedPercentile}°`}
        </span>
        {goal.note && <span className="font-body text-[11px] text-white/40 italic">{goal.note}</span>}
      </div>
      {!readonly && status === 'active' && (
        <button
          onClick={onCancel}
          disabled={cancelling}
          className="text-white/20 hover:text-red-400 transition-colors text-[11px] font-body shrink-0 disabled:opacity-40 disabled:pointer-events-none"
        >
          {cancelling ? '…' : '✕'}
        </button>
      )}
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}
