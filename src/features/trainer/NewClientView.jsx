import { useGroups }              from '../../hooks/useGroups'
import { useTrainerState }        from '../../context/TrainerContext'
import { getModule }              from '../../config/modules.config'
import { getPlanLimits }          from '../../config/plans.config'
import { ConfirmDialog }          from '../../components/common/ConfirmDialog'
import { useWizard }              from '../../components/modals/new-client-wizard/useWizard'
import { WizardProgress }         from '../../components/modals/new-client-wizard/WizardProgress'
import { WizardNav }              from '../../components/modals/new-client-wizard/WizardNav'
import { StepAnagrafica }         from '../../components/modals/new-client-wizard/steps/StepAnagrafica'
import { StepCategoria }          from '../../components/modals/new-client-wizard/steps/StepCategoria'
import { StepRuolo }              from '../../components/modals/new-client-wizard/steps/StepRuolo'
import { StepAccount }            from '../../components/modals/new-client-wizard/steps/StepAccount'
import { StepProfileType }        from '../../components/modals/new-client-wizard/steps/StepProfileType'
import { TOTAL_STEPS_MAP }        from '../../components/modals/new-client-wizard/wizard.config'

export function NewClientView({ orgId, onAdd, onBack, clients = [] }) {
  const { moduleType, orgPlan }                     = useTrainerState()
  const isSoccer                                    = getModule(moduleType).isSoccer
  const planLimits                                  = getPlanLimits(orgPlan)
  const atClientLimit                               = clients.length >= planLimits.clients
  const { groups, handleAddGroup, handleToggleClient } = useGroups(orgId)

  const wizard = useWizard({
    orgId,
    groups,
    onAdd,
    onClose:             onBack,
    onAddGroup:          handleAddGroup,
    onToggleClientGroup: handleToggleClient,
    isSoccer,
  })

  const totalSteps = isSoccer
    ? TOTAL_STEPS_MAP.soccer
    : (TOTAL_STEPS_MAP[wizard.profileType] ?? TOTAL_STEPS_MAP.tests_only)

  return (
    <div className="min-h-screen text-white">

      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[.05]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-transparent border-none text-white/30 font-body text-[13px] cursor-pointer hover:text-white/60 transition-colors p-0"
        >
          ‹ Clienti
        </button>
        <span className="font-display font-black text-[16px] text-white">
          Nuovo cliente
        </span>
        <div className="w-24" />
      </div>

      {atClientLimit ? (
        <PlanLimitScreen
          current={clients.length}
          limit={planLimits.clients}
          plan={orgPlan}
          onBack={onBack}
        />
      ) : null}

      {!atClientLimit && <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">
        <WizardProgress
          step={wizard.step}
          totalSteps={totalSteps}
          title={wizard.stepTitle}
          progressPct={wizard.progressPct}
        />

        <StepContent wizard={wizard} />

        <WizardNav
          step={wizard.step}
          isLastStep={wizard.isLastStep}
          loading={wizard.isLoading}
          onPrev={wizard.prev}
          onNext={wizard.next}
          onSubmit={wizard.handleRequestSubmit}
        />
      </div>

      {wizard.showConfirm && (
        <ConfirmDialog
          title="Creare il cliente?"
          description={`Stai per creare l'account per ${wizard.anagrafica.name}.`}
          confirmLabel="CREA CLIENTE"
          loading={wizard.isLoading}
          onConfirm={wizard.handleConfirmSubmit}
          onCancel={() => wizard.setShowConfirm(false)}
        />
      )}
      </div>}
    </div>
  )
}

function PlanLimitScreen({ current, limit, plan, onBack }) {
  return (
    <div className="max-w-md mx-auto px-6 py-16 flex flex-col items-center gap-4 text-center">
      <div
        className="w-14 h-14 rounded-[4px] flex items-center justify-center mb-2"
        style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <h2 className="font-display font-black text-[18px] text-white">Limite piano raggiunto</h2>
      <p className="font-body text-[14px] text-white/40 leading-relaxed">
        Il piano <span className="text-white/70 font-bold">{plan?.toUpperCase() ?? 'FREE'}</span> consente
        un massimo di <span className="text-white/70 font-bold">{limit} clienti</span>.
        Hai già {current} {current === 1 ? 'cliente' : 'clienti'}.
      </p>
      <p className="font-body text-[12px] text-white/25">
        Contatta il tuo amministratore per aggiornare il piano.
      </p>
      <button
        onClick={onBack}
        className="mt-4 px-6 py-2.5 font-display text-[12px] cursor-pointer rounded-[3px] border"
        style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)', background: 'transparent' }}
      >
        ‹ TORNA INDIETRO
      </button>
    </div>
  )
}

function StepContent({ wizard }) {
  const { currentStep } = wizard

  if (currentStep?.type === 'anagrafica') return (
    <StepAnagrafica
      anagrafica={wizard.anagrafica}
      setAnagrafica={wizard.setAnagrafica}
      errors={wizard.errors}
    />
  )

  if (currentStep?.type === 'profileType') return (
    <StepProfileType
      profileType={wizard.profileType}
      setProfileType={wizard.setProfileType}
    />
  )

  if (currentStep?.type === 'categoria') return (
    <StepCategoria
      categoria={wizard.categoria}
      setCategoria={wizard.setCategoria}
    />
  )

  if (currentStep?.type === 'ruolo') return (
    <StepRuolo
      ruolo={wizard.ruolo}
      setRuolo={wizard.setRuolo}
    />
  )

  if (currentStep?.type === 'account') return (
    <StepAccount
      account={wizard.account}
      setAccount={wizard.setAccount}
      errors={wizard.errors}
      anagrafica={wizard.anagrafica}
      categoria={wizard.categoria}
      rankObj={wizard.rankObj}
      media={wizard.media}
    />
  )

  return null
}
