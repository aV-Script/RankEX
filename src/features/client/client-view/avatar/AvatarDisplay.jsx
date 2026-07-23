// AvatarDisplay — renderizza l'avatar scelto dal catalogo fisso (sostituisce SoccerAvatar/DiceBear)

import { getAvatarById, getAvatarsForOrg } from '../../../../config/avatars.config'

export function AvatarDisplay({ avatarId, orgId, width, height, style, className }) {
  const w = parseInt(width) || 80
  const h = parseInt(height) || w

  const avatar = getAvatarById(avatarId) ?? getAvatarsForOrg(orgId)[0] ?? null

  if (!avatar) {
    return (
      <div
        className={className}
        style={{ width: w, height: h, borderRadius: '50%', background: 'var(--rx-surface)', border: '1px solid var(--rx-border)', ...style }}
      />
    )
  }

  return (
    <img
      src={avatar.imageUrl}
      alt={avatar.name}
      width={w}
      height={h}
      draggable={false}
      className={className}
      style={{ width: w, height: h, objectFit: 'cover', display: 'block', userSelect: 'none', ...style }}
    />
  )
}
