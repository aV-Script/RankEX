// AvatarDisplay — renderizza l'avatar scelto dal catalogo fisso (sostituisce SoccerAvatar/DiceBear)

import { useState, useEffect } from 'react'
import { getAvatarById, getAvatarsForOrg } from '../../../../config/avatars.config'

function EmptyCircle({ className, w, h, style }) {
  return (
    <div
      className={className}
      style={{ width: w, height: h, borderRadius: '50%', background: 'var(--rx-surface)', border: '1px solid var(--rx-border)', overflow: 'hidden', ...style }}
    />
  )
}

export function AvatarDisplay({ avatarId, orgId, width, height, style, className }) {
  const w = parseInt(width) || 80
  const h = parseInt(height) || w

  const avatar = getAvatarById(avatarId) ?? getAvatarsForOrg(orgId)[0] ?? null

  // Se il PNG referenziato manca/fallisce il caricamento, evita che il testo
  // alt trabocchi fuori dal cerchio — fallback a un placeholder neutro.
  const [imgError, setImgError] = useState(false)
  useEffect(() => { setImgError(false) }, [avatar?.imageUrl])

  if (!avatar || imgError) {
    return <EmptyCircle className={className} w={w} h={h} style={style} />
  }

  return (
    <img
      src={avatar.imageUrl}
      alt={avatar.name}
      width={w}
      height={h}
      draggable={false}
      loading="lazy"
      decoding="async"
      onError={() => setImgError(true)}
      className={className}
      style={{ width: w, height: h, objectFit: 'cover', display: 'block', userSelect: 'none', ...style }}
    />
  )
}
