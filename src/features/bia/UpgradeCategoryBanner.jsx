import { useState }            from 'react'
import { ConfirmDialog }       from '../../components/common/ConfirmDialog'

const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

/**
 * Banner upgrade categoria — mostrato nel dashboard trainer
 * quando il cliente non ha uno dei due moduli.
 */
export function UpgradeCategoryBanner({ client, _color, onUpgrade }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading,     setLoading]     = useState(false)

  const profileType = client.profileType ?? 'tests_only'

  // Non mostrare se già completo
  if (profileType === 'complete') return null

  const missingLabel = profileType === 'tests_only'
    ? 'Bioimpedenziometria (BIA)'
    : 'Test atletici'
  const missingDesc = profileType === 'tests_only'
    ? 'Questo cliente non ha la BIA nel suo profilo. Puoi aggiungere la bioimpedenziometria per un profilo completo.'
    : 'Questo cliente non ha i test atletici nel suo profilo. Puoi aggiungere i test per un profilo completo con ranking.'

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onUpgrade(client, 'complete')
      setShowConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className="mx-6 mb-4 rounded-[3px] px-5 py-4 flex items-center justify-between gap-4"
        style={{
          background: 'rgba(245,158,11,0.06)',
          border:     '1px solid rgba(245,158,11,0.2)',
        }}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="shrink-0 mt-0.5 text-amber-400">
            <WarningIcon />
          </span>
          <div>
            <div className="font-display text-[12px] text-amber-400 tracking-wider mb-0.5">
              {missingLabel} non attiva
            </div>
            <div className="font-body text-[12px] text-white/40">
              {missingDesc}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          className="shrink-0 font-display text-[11px] px-4 py-2 rounded-[3px] cursor-pointer border-0 transition-opacity hover:opacity-85"
          style={{
            background:    'linear-gradient(135deg, #f59e0b, #d97706)',
            color:         '#07090e',
            fontWeight:    700,
            letterSpacing: '0.05em',
          }}
        >
          AGGIUNGI AL PROFILO
        </button>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Aggiornare il profilo?"
          description={`${client.name} passerà al profilo Completo (Test + BIA). Lo storico esistente verrà mantenuto.`}
          confirmLabel="AGGIORNA"
          loading={loading}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}
