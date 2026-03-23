import { Button }           from '../../components/ui'
import { ConfirmDialog }    from '../../components/common/ConfirmDialog'
import { TestInput }        from '../../components/modals/campionamento-modal/TestInput'
import { RankPreview }      from '../../components/modals/campionamento-modal/RankPreview'
import { useCampionamento } from '../../components/modals/campionamento-modal/useCampionamento'

export function CampionamentoView({ client, color, onSave, onBack }) {
  const {
    config,
    testValues,
    errors,
    loading,
    showConfirm,
    liveStats,
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

  return (
    <div className="min-h-screen text-white">

      {/* Header - SOLO DESKTOP */}
      <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-white/[.05]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/30 text-[13px] hover:text-white/60 transition-colors"
        >
          ‹ Dashboard
        </button>

        <button
          onClick={handleRequestSave}
          className="font-display text-[11px] px-3 py-1.5 rounded-xl cursor-pointer border transition-all"
          style={{ color, borderColor: color + '55', background: color + '11' }}
        >
          SALVA CAMPIONAMENTO
        </button>
      </div>

      {/* Contenuto */}
      <div className="max-w-5xl mx-auto px-6 py-8">

        <p className="text-[13px] text-white/40 mb-6">
          {client.name} · {client.sesso} · {client.eta} anni
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

        {/* AZIONI MOBILE */}
        <div className="lg:hidden mt-8 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/30 text-[13px] hover:text-white/60 transition-colors"
          >
            ‹ Dashboard
          </button>

          <button
            onClick={handleRequestSave}
            className="font-display text-[11px] px-3 py-1.5 rounded-xl cursor-pointer border transition-all"
            style={{ color, borderColor: color + '55', background: color + '11' }}
          >
            SALVA CAMPIONAMENTO
          </button>
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