import { useState, useMemo } from 'react'
import { Modal, Input, Button, Field } from '../ui'
import { CATEGORIE, getTestsForCategoria, getRankFromMedia } from '../../constants'
import { calcPercentile, calcStatMedia } from '../../utils/percentile'
import { useGroups } from '../../hooks/useGroups'

const TOTAL_STEPS = 9

export function NewClientWizard({ onClose, onAdd, trainerId }) {
  // ─── Stati principali ───
  const [step, setStep] = useState(0)
  const [anagrafica, setAnagrafica] = useState({ name: '', eta: '', sesso: 'M', peso: '', altezza: '' })
  const [categoria, setCategoria] = useState('health')
  const [tests, setTests] = useState({})
  const [settings, setSettings] = useState({ sessionsPerWeek: 3, groupId: null, newGroupName: '' })
  const [account, setAccount] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const { groups, handleAddGroup, handleToggleClient } = useGroups(trainerId ?? null)

  // ─── Test della categoria corrente ───
  const categoryTests = getTestsForCategoria(categoria)
  const currentTest = step >= 2 && step <= 6 ? categoryTests[step - 2] : null

  const livePercentile = useMemo(() => {
  if (!currentTest) return null;

  let finalValue;

  if (currentTest.variables && currentTest.formula) {
    const varsValues = {};
    for (const v of currentTest.variables) {
      const val = Number(tests[v.key]);
      if (tests[v.key] === '' || isNaN(val)) return null; // se manca → null
      varsValues[v.key] = val;
    }
    finalValue = currentTest.formula(varsValues);
  } else {
    const val = Number(tests[currentTest.key]);
    if (tests[currentTest.key] === '' || isNaN(val)) return null;
    finalValue = val;
  }

  return calcPercentile(currentTest.stat, finalValue, anagrafica.sesso, parseInt(anagrafica.eta));
}, [currentTest, tests, anagrafica.sesso, anagrafica.eta]);

// Percentili per radar/tabella (allStats)
const allStats = useMemo(() => {
  const result = {};
  categoryTests.forEach(test => {
    const rawVal = tests[test.key];
    const val = Number(rawVal);
    result[test.stat] =
      rawVal === '' || isNaN(val)
        ? 0
        : calcPercentile(test.stat, val, anagrafica.sesso, parseInt(anagrafica.eta)) ?? 0;
  });
  return result;
}, [tests, categoryTests, anagrafica.sesso, anagrafica.eta]);

  const media = calcStatMedia(allStats)
  const rankObj = getRankFromMedia(media)

  // ─── Validazioni ───
  const validateStep0 = () => {
    const e = {}
    if (!anagrafica.name.trim()) e.name = 'Nome obbligatorio'
    if (!anagrafica.eta || isNaN(anagrafica.eta) || +anagrafica.eta < 16 || +anagrafica.eta > 100) e.eta = 'Età non valida'
    if (!anagrafica.peso || isNaN(anagrafica.peso)) e.peso = 'Peso non valido'
    if (!anagrafica.altezza || isNaN(anagrafica.altezza)) e.altezza = 'Altezza non valida'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateTestStep = () => {
    if (!currentTest) return true;

    if (currentTest.variables && currentTest.variables.length) {
      // Controlla che tutte le variabili siano compilate e valide
      const invalidVar = currentTest.variables.find(
        v => tests[v.key] === '' || isNaN(Number(tests[v.key]))
      );
      if (invalidVar) {
        const newErrors = {};
        currentTest.variables.forEach(v => {
          if (tests[v.key] === '' || isNaN(Number(tests[v.key]))) {
            newErrors[v.key] = 'Inserisci un valore valido';
          }
        });
        setErrors(newErrors);
        return false;
      }
    } else {
      const val = Number(tests[currentTest.key]);
      if (tests[currentTest.key] === '' || isNaN(val)) {
        setErrors({ [currentTest.key]: 'Inserisci un valore valido' });
        return false;
      }
    }

    setErrors({});
    return true;
  };

  const validateAccount = () => {
    const e = {}
    if (!account.email.trim() || !account.email.includes('@')) e.email = 'Email non valida'
    if (!account.password || account.password.length < 8) e.password = 'Password minimo 8 caratteri'
    else if (!/[0-9]/.test(account.password)) e.password = 'Deve contenere almeno un numero'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ─── Navigazione ───
  const next = () => {
    if (step === 0 && !validateStep0()) return;
    if (step >= 2 && step <= 6) {
      if (!validateTestStep()) return;
      if (currentTest?.variables && currentTest?.formula) {
        const varsValues = {};
        currentTest.variables.forEach(v => {
          varsValues[v.key] = Number(tests[v.key]);
        });
        const finalVal = currentTest.formula(varsValues);
        setTests(p => ({ ...p, [currentTest.key]: finalVal }));
      }
    }

    setStep(s => s + 1);
  };

  const prev = () => setStep(s => s - 1)

  // ─── Invio form ───
  const handleSubmit = async () => {
    if (!validateAccount()) return
    setLoading(true)
    try {
      const newClient = await onAdd({
        ...anagrafica,
        eta: parseInt(anagrafica.eta),
        peso: parseFloat(anagrafica.peso),
        altezza: parseFloat(anagrafica.altezza),
        categoria,
        testValues: { ...tests }, // valori grezzi inseriti
        stats: allStats,           // percentili per radar/tabella
        email: account.email.trim(),
        password: account.password,
        sessionsPerWeek: parseInt(settings.sessionsPerWeek) || 3,
      });
      // Gruppo opzionale
      if (settings.newGroupName.trim() && trainerId) {
        const g = await handleAddGroup(settings.newGroupName.trim())
        if (g?.id && newClient?.id) await handleToggleClient(g.id, newClient.id)
      } else if (settings.groupId && newClient?.id) {
        await handleToggleClient(settings.groupId, newClient.id)
      }
      onClose()
    } catch (err) {
      setErrors({ email: err.message })
      setLoading(false)
    }
  }

  const isLastStep = step === TOTAL_STEPS - 1
  const progressPct = Math.round((step / (TOTAL_STEPS - 1)) * 100)

  const getStepTitle = () => {
    if (step === 0) return 'Dati anagrafici'
    if (step === 1) return 'Categoria'
    if (step >= 2 && step <= 6) return `Test ${step - 1}/5 — ${currentTest?.label}`
    if (step === 7) return 'Impostazioni allenamento'
    return 'Account cliente'
  }

  return (
    <Modal onClose={onClose} disableOverlayClose size="lg">
      <div className="flex flex-col gap-4">
        {/* ── Progress bar ── */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-display text-[11px] text-white/40">{getStepTitle()}</span>
            <span className="font-display text-[11px] text-white/25">Step {step + 1} di {TOTAL_STEPS}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-[width] duration-300"
                 style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
          </div>
        </div>

        {/* ── Step Content ── */}
        {step === 0 && (
          <div className="flex flex-col gap-3">
            <Field label="Nome e cognome" error={errors.name}>
              <Input value={anagrafica.name} onChange={e => setAnagrafica(p => ({ ...p, name: e.target.value }))} placeholder="Mario Rossi" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Età" error={errors.eta}>
                <Input type="number" value={anagrafica.eta} onChange={e => setAnagrafica(p => ({ ...p, eta: e.target.value }))} placeholder="30" />
              </Field>
              <Field label="Sesso">
                <div className="flex gap-2">
                  {['M','F'].map(s => (
                    <button key={s} onClick={() => setAnagrafica(p => ({ ...p, sesso: s }))}
                            className={`flex-1 py-2.5 rounded-xl font-display text-[12px] cursor-pointer border`}
                            style={anagrafica.sesso === s
                              ? { background: 'rgba(59,130,246,0.2)', borderColor: '#3b82f6', color: '#fff' }
                              : { background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Peso (kg)" error={errors.peso}>
                <Input type="number" value={anagrafica.peso} onChange={e => setAnagrafica(p => ({ ...p, peso: e.target.value }))} placeholder="70" />
              </Field>
              <Field label="Altezza (cm)" error={errors.altezza}>
                <Input type="number" value={anagrafica.altezza} onChange={e => setAnagrafica(p => ({ ...p, altezza: e.target.value }))} placeholder="175" />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-3">
            <p className="font-body text-[13px] text-white/40 m-0">La categoria determina i 5 test somministrati al cliente.</p>
            {CATEGORIE.map(cat => (
              <button key={cat.id} onClick={() => setCategoria(cat.id)}
                      className="flex items-start gap-4 p-4 rounded-2xl cursor-pointer border transition-all text-left"
                      style={categoria === cat.id
                        ? { background: cat.color + '15', borderColor: cat.color + '55' }
                        : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: categoria === cat.id ? cat.color : 'rgba(255,255,255,0.15)' }} />
                <div>
                  <div className="font-display font-black text-[14px]" style={{ color: categoria === cat.id ? cat.color : 'rgba(255,255,255,0.7)' }}>{cat.label}</div>
                  <div className="font-body text-[12px] text-white/40 mt-0.5">{cat.desc}</div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {getTestsForCategoria(cat.id).map(t => (
                      <span key={t.key} className="font-display text-[9px] px-2 py-0.5 rounded-md" style={{ background: cat.color + '18', color: cat.color + 'cc' }}>{t.test}</span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {step >= 2 && step <= 6 && currentTest && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-display text-[10px] text-white/30 tracking-[2px] m-0 mb-1">{currentTest.test}</p>
              <p className="font-body text-[13px] text-white/50 m-0">{currentTest.desc || ''}</p>
            </div>

            {/* Se il test ha variabili, genera input per ciascuna */}
            {currentTest.variables ? (
              <div className="flex flex-col gap-2">
                {currentTest.variables.map(v => (
                  <Field key={`${currentTest.key}_${v.key}`} label={`${v.label} (${v.unit})`} error={errors[v.key]}>
                    <Input
                      type="number"
                      step="0.1"
                      value={tests[v.key] ?? ''}
                      onChange={e => setTests(p => ({ ...p, [v.key]: e.target.value }))}
                      placeholder={`Inserisci valore in ${v.unit}`}
                    />
                  </Field>
                ))}
              </div>
            ) : (
              <Field label={`${currentTest.label} (${currentTest.unit})`} error={errors[currentTest.key]}>
                <Input
                  type="number"
                  step="0.1"
                  value={tests[currentTest.key] ?? ''}
                  onChange={e => setTests(p => ({ ...p, [currentTest.key]: e.target.value }))}
                  placeholder={`Inserisci valore in ${currentTest.unit}`}
                />
              </Field>
            )}

            {/* Mostra percentile live solo se l’utente ha inserito un valore valido */}
            {livePercentile !== null && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between mb-1.5">
                  <span className="font-display text-[10px] text-white/30 tracking-[2px]">PERCENTILE</span>
                  <span className="font-display text-[13px] font-black" style={{ color: '#60a5fa' }}>
                    {livePercentile}°
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${livePercentile}%`, background: '#60a5fa' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 7: Impostazioni ── */}
        {step === 7 && (
          <div className="flex flex-col gap-5">
            <Field label="Sessioni per settimana">
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={7} step={1}
                  value={settings.sessionsPerWeek}
                  onChange={e => setSettings(p => ({ ...p, sessionsPerWeek: e.target.value }))}
                  className="flex-1" />
                <span className="font-display font-black text-[22px] w-8 text-center" style={{ color: '#60a5fa' }}>
                  {settings.sessionsPerWeek}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-body text-[11px] text-white/25">1×/sett</span>
                <span className="font-body text-[11px] text-white/40">
                  ~{Math.round(settings.sessionsPerWeek * 4.33)} sessioni/mese · {Math.round(500 / Math.round(settings.sessionsPerWeek * 4.33))} XP/sessione
                </span>
                <span className="font-body text-[11px] text-white/25">7×/sett</span>
              </div>
            </Field>

            <div>
              <div className="font-display text-[10px] text-white/40 tracking-wider mb-2">GRUPPO (opzionale)</div>
              {groups.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-3">
                  <button
                    onClick={() => setSettings(p => ({ ...p, groupId: null, newGroupName: '' }))}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer border-none bg-transparent text-left"
                    style={!settings.groupId && !settings.newGroupName
                      ? { background: 'rgba(255,255,255,0.07)', color: '#fff' }
                      : { color: 'rgba(255,255,255,0.35)' }}>
                    <span className="font-body text-[13px]">Nessun gruppo</span>
                  </button>
                  {groups.map(g => (
                    <button key={g.id}
                      onClick={() => setSettings(p => ({ ...p, groupId: g.id, newGroupName: '' }))}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer border-none text-left"
                      style={settings.groupId === g.id
                        ? { background: 'rgba(59,130,246,0.15)', color: '#fff' }
                        : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.55)' }}>
                      <span className="font-body text-[13px]">{g.name}</span>
                      <span className="font-display text-[10px] opacity-40">{g.clientIds.length} clienti</span>
                    </button>
                  ))}
                </div>
              )}
              <Input
                className="w-full"
                placeholder="Oppure crea un nuovo gruppo..."
                value={settings.newGroupName}
                onChange={e => setSettings(p => ({ ...p, newGroupName: e.target.value, groupId: null }))}
              />
              {settings.newGroupName.trim() && (
                <p className="font-body text-[11px] text-blue-400/70 mt-1.5 m-0">
                  Verrà creato il gruppo "{settings.newGroupName.trim()}"
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Step 8: Account ── */}
        {step === 8 && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl p-4 flex items-center gap-4"
              style={{ background: rankObj.color + '11', border: `1px solid ${rankObj.color}33` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: rankObj.color + '22' }}>
                <span className="font-display font-black text-[18px]" style={{ color: rankObj.color }}>
                  {rankObj.label}
                </span>
              </div>
              <div>
                <div className="font-display font-black text-[15px] text-white">{anagrafica.name}</div>
                <div className="font-body text-[12px] text-white/40">
                  {CATEGORIE.find(c => c.id === categoria)?.label} · Media {media}/100
                </div>
              </div>
            </div>
            <Field label="Email" error={errors.email}>
              <Input type="email" value={account.email}
                onChange={e => setAccount(p => ({ ...p, email: e.target.value }))}
                placeholder="cliente@email.com" />
            </Field>
            <Field label="Password temporanea" error={errors.password}>
              <Input type="password" value={account.password}
                onChange={e => setAccount(p => ({ ...p, password: e.target.value }))}
                placeholder="Minimo 8 caratteri + 1 numero" />
            </Field>
            <p className="font-body text-[11px] text-white/25 m-0">
              Il cliente potrà cambiarla al primo accesso.
            </p>
          </div>
        )}

        {/* Navigazione */}
        <div className={`flex gap-3 mt-2 ${step === 0 ? 'justify-end' : 'justify-between'}`}>
          {step > 0 && <button onClick={prev} className="bg-transparent border border-white/10 rounded-xl px-5 py-3 text-white/50 font-display text-[12px] cursor-pointer hover:text-white/70 transition-colors">‹ INDIETRO</button>}
          {!isLastStep
            ? <Button variant="primary" className="flex-1" onClick={next}>AVANTI ›</Button>
            : <Button variant="primary" className="flex-1" loading={loading} onClick={handleSubmit}>CREA CLIENTE</Button>
          }
        </div>
      </div>
    </Modal>
  )
}