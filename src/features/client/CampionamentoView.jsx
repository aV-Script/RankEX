import { Button }           from '../../components/ui'
import { calcAge }          from '../../utils/validation'
import { ConfirmDialog }    from '../../components/common/ConfirmDialog'
import { TestInput }        from '../../components/modals/campionamento-modal/TestInput'
import { RankPreview }      from '../../components/modals/campionamento-modal/RankPreview'
import { useCampionamento } from '../../components/modals/campionamento-modal/useCampionamento'

export function CampionamentoView({ client, _color, onSave, onBack }) {
  const {
    config,
    testValues,
    errors,
    loading,
    showConfirm,
    liveStats,
    ageWarnings,
    asymmetryAlerts,
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
                asymmetryAlert={asymmetryAlerts[test.stat]}
                onUpdate={updateValue}
              />
            ))}
            <div className="lg:hidden mt-2 grid grid-cols-2 gap-2">
              <Button size="sm" variant="ghost" onClick={onBack}>INDIETRO</Button>
              <Button size="sm" onClick={handleRequestSave} disabled={loading}>SALVA</Button>
            </div>
          </div>

          {/* Preview desktop */}
          <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0 sticky top-6">
            <RankPreview
              client={client}
              statsForPreview={statsForPreview}
              newRankObj={newRankObj}
              newMedia={newMedia}
              oldRankObj={oldRankObj}
              oldMedia={oldMedia}
              filledCount={filledCount}
            />
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="ghost" onClick={onBack}>INDIETRO</Button>
              <Button size="sm" onClick={handleRequestSave} disabled={loading}>SALVA</Button>
            </div>
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
