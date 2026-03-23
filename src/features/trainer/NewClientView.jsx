import { useGroups }      from '../../hooks/useGroups'
import { ConfirmDialog }  from '../../components/common/ConfirmDialog'
import { useWizard }      from '../../components/modals/new-client-wizard/useWizard'
import { WizardProgress } from '../../components/modals/new-client-wizard/WizardProgress'
import { WizardNav }      from '../../components/modals/new-client-wizard/WizardNav'
import { StepAnagrafica } from '../../components/modals/new-client-wizard/steps/StepAnagrafica'
import { StepCategoria }  from '../../components/modals/new-client-wizard/steps/StepCategoria'
import { StepTest }       from '../../components/modals/new-client-wizard/steps/StepTest'
import { StepSettings }   from '../../components/modals/new-client-wizard/steps/StepSettings'
import { StepAccount }    from '../../components/modals/new-client-wizard/steps/StepAccount'
import { TOTAL_STEPS }    from '../../components/modals/new-client-wizard/wizard.config'

export function NewClientView({ trainerId, onAdd, onBack }) {
  const { groups, handleAddGroup, handleToggleClient } = useGroups(trainerId)

  const wizard = useWizard({
    trainerId,
    groups,
    onAdd,
    onClose:            onBack,
    onAddGroup:         handleAddGroup,
    onToggleClientGroup: handleToggleClient,
  })

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

      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">
        <WizardProgress
          step={wizard.step}
          totalSteps={TOTAL_STEPS}
          title={wizard.stepTitle}
          progressPct={wizard.progressPct}
        />

        <StepContent wizard={wizard} />

        <WizardNav
          step={wizard.step}
          isLastStep={wizard.isLastStep}
          loading={wizard.loading}
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
          loading={wizard.loading}
          onConfirm={wizard.handleConfirmSubmit}
          onCancel={() => wizard.setShowConfirm(false)}
        />
      )}
    </div>
  )
}

function StepContent({ wizard }) {
  const { currentStep, currentTest } = wizard

  if (currentStep?.type === 'anagrafica') return (
    <StepAnagrafica
      anagrafica={wizard.anagrafica}
      setAnagrafica={wizard.setAnagrafica}
      errors={wizard.errors}
    />
  )

  if (currentStep?.type === 'categoria') return (
    <StepCategoria
      categoria={wizard.categoria}
      setCategoria={wizard.setCategoria}
    />
  )

  if (currentStep?.type === 'test') return (
    <StepTest
      test={currentTest}
      tests={wizard.tests}
      setTests={wizard.setTests}
      errors={wizard.errors}
      livePercentile={wizard.livePercentile}
    />
  )

  if (currentStep?.type === 'settings') return (
    <StepSettings
      settings={wizard.settings}
      setSettings={wizard.setSettings}
      groups={wizard.groups}
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