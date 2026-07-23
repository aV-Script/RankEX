// AvatarPicker — selezione fra avatar completi predefiniti (sostituisce AvatarEditor/builder DiceBear)

import { useState } from 'react'
import { updateClient } from '../../../../firebase/services/clients'
import { getAvatarsForOrg } from '../../../../config/avatars.config'
import { AvatarDisplay } from './AvatarDisplay'

export function AvatarPicker({ client, clientId, orgId, color }) {
  const avatars = getAvatarsForOrg(orgId)

  const [avatarId,  setAvatarId]  = useState(client.avatarId ?? avatars[0]?.id ?? null)
  const [saving,    setSaving]    = useState(false)
  const [savedOk,   setSavedOk]   = useState(false)
  const [saveError, setSaveError] = useState(false)

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
        style={{ borderRadius: 16, border: '1px solid var(--rx-border)' }} />

      <div className="grid grid-cols-3 gap-3 w-full max-w-md">
        {avatars.map(a => {
          const active = avatarId === a.id
          return (
            <button
              key={a.id}
              onClick={() => setAvatarId(a.id)}
              className="flex flex-col items-center overflow-hidden cursor-pointer rounded-[5px]"
              style={{
                background: active ? color + '12' : 'color-mix(in srgb, var(--rx-green) 4%, transparent)',
                border:     active ? `2px solid ${color}` : '2px solid var(--rx-border)',
                transition: 'all 0.15s ease',
              }}
            >
              <AvatarDisplay avatarId={a.id} orgId={orgId} width={90} height={90} />
              <span className="font-display tracking-[1px] uppercase py-1"
                style={{ fontSize: 7, color: active ? color : 'rgba(255,255,255,0.28)' }}>
                {a.name}
              </span>
            </button>
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
