import { Button }           from '../../components/ui'
import { calcAge }          from '../../utils/validation'
import { ConfirmDialog }    from '../../components/common/ConfirmDialog'
import { TestInput }        from '../../components/modals/campionamento-modal/TestInput'
import { RankPreview }      from '../../components/modals/campionamento-modal/RankPreview'
import { useCampionamento } from '../../components/modals/campionamento-modal/useCampionamento'
import { useCallback }      from 'react'
import { useRegisterContextMenu } from '../../context/NavMenuContext'

const ICON_BACK = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const ICON_SAVE = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
)
const CAMP_CTX = [
  { id: '__back__', label: 'Dashboard', icon: ICON_BACK },
  { id: '__save__', label: 'Salva',     icon: ICON_SAVE },
]

export function CampionamentoView({ client, color, onSave, onBack }) {
  const {
    config,
    testValues,
    errors,
    loading,
    showConfirm,
    liveStats,
    ageWarnings,
    statsForPreview,
    newMedia,
    newRankObj,
    oldMedia,
    oldRankObj,
    filledCount,
    updateValue,
    handleRequestSave,
    handleConfirmSave,
    setShowConfirm,
  } = useCampionamento({ client, onSave, onBack })

  const handleCampCtx = useCallback(id => {
    if (id === '__back__') onBack()
    else if (id === '__save__') handleRequestSave()
  }, [onBack, handleRequestSave])

  useRegisterContextMenu('Test', CAMP_CTX, null, handleCampCtx)

  return (
    <div className="min-h-screen text-white">

      {/* Contenuto */}
      <div className="max-w-5xl mx-auto px-6 py-8">

        <p className="text-[13px] text-white/40 mb-2">
          {client.name} · {client.sesso} · {calcAge(client.dataNascita)} anni
        </p>
        <p className="font-body text-[12px] text-white/25 mb-6 leading-relaxed">
          Il percentile indica la posizione rispetto ai pari età/sesso: 70° = meglio del 70% delle persone simili.
        </p>

        <div className="flex gap-8 items-start">

          {/* Test */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {config.map(test => (
              <TestInput
                key={test.stat}
                test={test}
                testValues={testValues}
                livePercentile={liveStats[test.stat]}
                prevValue={client.stats?.[test.stat]}
                errors={errors}
                ageWarning={ageWarnings[test.stat]}
                onUpdate={updateValue}
              />
            ))}
          </div>

          {/* Preview desktop */}
          <div className="hidden lg:flex flex-col gap-4 w-80 shrink-0 sticky top-6">
            <RankPreview
              client={client}
              statsForPreview={statsForPreview}
              newRankObj={newRankObj}
              newMedia={newMedia}
              oldRankObj={oldRankObj}
              oldMedia={oldMedia}
              filledCount={filledCount}
            />
          </div>

        </div>

      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Salvare il campionamento?"
          description={`Stai per aggiornare le statistiche di ${client.name}. Questa operazione aggiornerà rank e XP.`}
          confirmLabel="SALVA"
          loading={loading}
          onConfirm={handleConfirmSave}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}