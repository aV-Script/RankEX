// AvatarPicker — selezione fra avatar completi predefiniti (sostituisce AvatarEditor/builder DiceBear)
// + negozio (spike EPIC-005, vedi docs/DECISIONS.md → ADR-002): avatar bloccati per
// livello o acquistabili con Monete, riusando le stesse immagini esistenti.

import { useState } from 'react'
import { updateClient } from '../../../../firebase/services/clients'
import { getAvatarsForOrg, isAvatarUnlocked } from '../../../../config/avatars.config'
import { purchaseAvatarUseCase } from '../../../../usecases/purchaseAvatarUseCase'
import { useToast } from '../../../../hooks/useToast'
import { AvatarDisplay } from './AvatarDisplay'

export function AvatarPicker({ client, clientId, orgId, color }) {
  const { error: toastError, success: toastSuccess } = useToast()
  const avatars = getAvatarsForOrg(orgId)

  const [avatarId,  setAvatarId]  = useState(client.avatarId ?? avatars[0]?.id ?? null)
  const [saving,    setSaving]    = useState(false)
  const [savedOk,   setSavedOk]   = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [purchasingId, setPurchasingId] = useState(null)

  const coins = client.coins ?? 0

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateClient(orgId, clientId, { avatarId })
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 2000)
    } catch (err) {
      console.error('[AvatarPicker] save failed', { orgId, clientId, err })
      setSaveError(true)
      setTimeout(() => setSaveError(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handlePurchase = async (avatar) => {
    if (purchasingId) return
    setPurchasingId(avatar.id)
    try {
      await purchaseAvatarUseCase(orgId, clientId, avatar.id)
      toastSuccess(`${avatar.name} sbloccato!`)
      // Niente patch locale: la vista client è su onSnapshot (useClient.js), il nuovo
      // saldo Monete + avatarPurchased arrivano da soli dal realtime update.
    } catch (err) {
      toastError(err.message?.includes('Monete insufficienti') ? 'Monete insufficienti' : 'Acquisto non riuscito')
    } finally {
      setPurchasingId(null)
    }
  }

  if (avatars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 text-center"
        style={{ minHeight: 'calc(100svh - 80px)' }}>
        <div className="font-display font-black uppercase text-white" style={{ fontSize: 13 }}>
          Nessun avatar disponibile
        </div>
        <div className="font-display text-[9px]" style={{ color: 'var(--rx-text-muted)' }}>
          Il set avatar per la tua organizzazione non è ancora stato caricato.
        </div>
      </div>
    )
  }

  const saveLabel = saving ? '…' : savedOk ? '✓ SALVATO' : saveError ? '✗ ERRORE' : 'SALVA AVATAR'
  const isDirty = avatarId !== (client.avatarId ?? avatars[0]?.id ?? null)

  return (
    <div className="flex flex-col items-center gap-6 p-6" style={{ minHeight: 'calc(100svh - 80px)' }}>
      <AvatarDisplay avatarId={avatarId} orgId={orgId} width={200} height={200}
        style={{ borderRadius: 8, border: '1px solid var(--rx-border)' }} />

      <div className="flex items-center gap-1.5 font-display tracking-[1px]" style={{ fontSize: 11, color }}>
        🪙 {coins} Monete
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-md">
        {avatars.map(a => {
          const active   = avatarId === a.id
          const unlocked = isAvatarUnlocked(a, client)
          const purchasing = purchasingId === a.id

          return (
            <div key={a.id} className="relative flex flex-col items-center overflow-hidden rounded-[4px]"
              style={{
                background: active ? color + '12' : 'color-mix(in srgb, var(--rx-accent) 4%, transparent)',
                border:     active ? `2px solid ${color}` : '2px solid var(--rx-border)',
              }}
            >
              <button
                onClick={() => unlocked && setAvatarId(a.id)}
                disabled={!unlocked}
                aria-pressed={active}
                className="flex flex-col items-center w-full cursor-pointer disabled:cursor-not-allowed"
                style={{ background: 'transparent', border: 'none', opacity: unlocked ? 1 : 0.35 }}
              >
                <AvatarDisplay avatarId={a.id} orgId={orgId} width={90} height={90} />
                <span className="font-display tracking-[1px] uppercase py-1"
                  style={{ fontSize: 7, color: active ? color : 'rgba(255,255,255,0.28)' }}>
                  {a.name}
                </span>
              </button>

              {!unlocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none"
                  style={{ background: 'rgba(0,0,0,0.55)' }}>
                  <span aria-hidden="true" style={{ fontSize: 16 }}>🔒</span>
                  <span className="font-display text-[7px] tracking-[1px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {a.unlockType === 'level' ? `LIVELLO ${a.unlockValue}` : `${a.price} MONETE`}
                  </span>
                  {a.unlockType === 'purchase' && (
                    <button
                      onClick={() => handlePurchase(a)}
                      disabled={purchasing || coins < a.price}
                      className="pointer-events-auto font-display text-[7px] tracking-[1px] px-2 py-1 rounded-[3px] cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color, borderColor: color + '66', background: color + '22' }}
                    >
                      {purchasing ? '…' : 'ACQUISTA'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !isDirty}
        className="w-full max-w-md rx-btn-primary font-display tracking-[3px] py-3 rounded-[4px] cursor-pointer disabled:opacity-50"
        style={{ fontSize: 10 }}
      >
        {saveLabel}
      </button>
    </div>
  )
}
