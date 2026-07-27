// Catalogo avatar — set fissi di personaggi pre-disegnati (no più builder procedurale)
// Ogni avatar è esclusivo di una org (orgId) — vedi CLAUDE.md "Roadmap futura > moduli org custom"

export const AVATAR_CATALOG = [
  { id: 'vdp5_01', orgId: 'vdp5-tgtdu', name: 'Portiere',   imageUrl: '/avatars/vdp5_01.png' },
  { id: 'vdp5_02', orgId: 'vdp5-tgtdu', name: 'Capitano',   imageUrl: '/avatars/vdp5_02.png' },
  { id: 'vdp5_03', orgId: 'vdp5-tgtdu', name: 'Numero 4',   imageUrl: '/avatars/vdp5_03.png' },
  { id: 'vdp5_04', orgId: 'vdp5-tgtdu', name: 'Numero 2',   imageUrl: '/avatars/vdp5_04.png' },
  { id: 'vdp5_05', orgId: 'vdp5-tgtdu', name: 'Numero 8',   imageUrl: '/avatars/vdp5_05.png' },
  { id: 'vdp5_06', orgId: 'vdp5-tgtdu', name: 'Numero 10',  imageUrl: '/avatars/vdp5_06.png' },
  { id: 'vdp5_07', orgId: 'vdp5-tgtdu', name: 'Numero 7',   imageUrl: '/avatars/vdp5_07.png' },
  { id: 'vdp5_08', orgId: 'vdp5-tgtdu', name: 'Numero 9',   imageUrl: '/avatars/vdp5_08.png' },
  { id: 'vdp5_09', orgId: 'vdp5-tgtdu', name: 'Numero 11',  imageUrl: '/avatars/vdp5_09.png' },
]

export function getAvatarsForOrg(orgId) {
  return AVATAR_CATALOG.filter(a => a.orgId === orgId)
}

export function getAvatarById(avatarId) {
  return AVATAR_CATALOG.find(a => a.id === avatarId) ?? null
}
