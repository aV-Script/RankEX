// Catalogo avatar — set fissi di personaggi pre-disegnati (no più builder procedurale)
// Ogni avatar è esclusivo di una org (orgId) — vedi CLAUDE.md "Roadmap futura > moduli org custom"

export const AVATAR_CATALOG = [
  { id: 'vdp5_01', orgId: 'vdp5-tgtdu', name: 'Portiere',  imageUrl: '/avatars/vdp5_01.png' },
  { id: 'vdp5_02', orgId: 'vdp5-tgtdu', name: 'Numero 5',  imageUrl: '/avatars/vdp5_02.png' },
]

export function getAvatarsForOrg(orgId) {
  return AVATAR_CATALOG.filter(a => a.orgId === orgId)
}

export function getAvatarById(avatarId) {
  return AVATAR_CATALOG.find(a => a.id === avatarId) ?? null
}
