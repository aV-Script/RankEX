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

  // Test Org Soccer — stesso set VDP5, riusato per QA/test (stesse immagini)
  { id: 'test_soccer_01', orgId: 'test-org-soccer', name: 'Portiere',   imageUrl: '/avatars/vdp5_01.png' },
  { id: 'test_soccer_02', orgId: 'test-org-soccer', name: 'Capitano',   imageUrl: '/avatars/vdp5_02.png' },
  { id: 'test_soccer_03', orgId: 'test-org-soccer', name: 'Numero 4',   imageUrl: '/avatars/vdp5_03.png' },
  { id: 'test_soccer_04', orgId: 'test-org-soccer', name: 'Numero 2',   imageUrl: '/avatars/vdp5_04.png' },
  { id: 'test_soccer_05', orgId: 'test-org-soccer', name: 'Numero 8',   imageUrl: '/avatars/vdp5_05.png' },
  { id: 'test_soccer_06', orgId: 'test-org-soccer', name: 'Numero 10',  imageUrl: '/avatars/vdp5_06.png' },
  { id: 'test_soccer_07', orgId: 'test-org-soccer', name: 'Numero 7',   imageUrl: '/avatars/vdp5_07.png' },
  { id: 'test_soccer_08', orgId: 'test-org-soccer', name: 'Numero 9',   imageUrl: '/avatars/vdp5_08.png' },
  { id: 'test_soccer_09', orgId: 'test-org-soccer', name: 'Numero 11',  imageUrl: '/avatars/vdp5_09.png' },

  // Test Org PT — stesso set VDP5, riusato per QA/test (stesse immagini)
  { id: 'test_pt_01', orgId: 'test-org-pt', name: 'Portiere',   imageUrl: '/avatars/vdp5_01.png' },
  { id: 'test_pt_02', orgId: 'test-org-pt', name: 'Capitano',   imageUrl: '/avatars/vdp5_02.png' },
  { id: 'test_pt_03', orgId: 'test-org-pt', name: 'Numero 4',   imageUrl: '/avatars/vdp5_03.png' },
  { id: 'test_pt_04', orgId: 'test-org-pt', name: 'Numero 2',   imageUrl: '/avatars/vdp5_04.png' },
  { id: 'test_pt_05', orgId: 'test-org-pt', name: 'Numero 8',   imageUrl: '/avatars/vdp5_05.png' },
  { id: 'test_pt_06', orgId: 'test-org-pt', name: 'Numero 10',  imageUrl: '/avatars/vdp5_06.png' },
  { id: 'test_pt_07', orgId: 'test-org-pt', name: 'Numero 7',   imageUrl: '/avatars/vdp5_07.png' },
  { id: 'test_pt_08', orgId: 'test-org-pt', name: 'Numero 9',   imageUrl: '/avatars/vdp5_08.png' },
  { id: 'test_pt_09', orgId: 'test-org-pt', name: 'Numero 11',  imageUrl: '/avatars/vdp5_09.png' },

  // ASD Calcio Demo — stesso set VDP5, riusato per QA/test (stesse immagini)
  { id: 'soccer_demo_01', orgId: 'soccer-demo-moaokrn4', name: 'Portiere',   imageUrl: '/avatars/vdp5_01.png' },
  { id: 'soccer_demo_02', orgId: 'soccer-demo-moaokrn4', name: 'Capitano',   imageUrl: '/avatars/vdp5_02.png' },
  { id: 'soccer_demo_03', orgId: 'soccer-demo-moaokrn4', name: 'Numero 4',   imageUrl: '/avatars/vdp5_03.png' },
  { id: 'soccer_demo_04', orgId: 'soccer-demo-moaokrn4', name: 'Numero 2',   imageUrl: '/avatars/vdp5_04.png' },
  { id: 'soccer_demo_05', orgId: 'soccer-demo-moaokrn4', name: 'Numero 8',   imageUrl: '/avatars/vdp5_05.png' },
  { id: 'soccer_demo_06', orgId: 'soccer-demo-moaokrn4', name: 'Numero 10',  imageUrl: '/avatars/vdp5_06.png' },
  { id: 'soccer_demo_07', orgId: 'soccer-demo-moaokrn4', name: 'Numero 7',   imageUrl: '/avatars/vdp5_07.png' },
  { id: 'soccer_demo_08', orgId: 'soccer-demo-moaokrn4', name: 'Numero 9',   imageUrl: '/avatars/vdp5_08.png' },
  { id: 'soccer_demo_09', orgId: 'soccer-demo-moaokrn4', name: 'Numero 11',  imageUrl: '/avatars/vdp5_09.png' },

  // Test (org generica) — stesso set VDP5, riusato per QA/test (stesse immagini)
  { id: 'test_default_01', orgId: 'test-1tevc', name: 'Portiere',   imageUrl: '/avatars/vdp5_01.png' },
  { id: 'test_default_02', orgId: 'test-1tevc', name: 'Capitano',   imageUrl: '/avatars/vdp5_02.png' },
  { id: 'test_default_03', orgId: 'test-1tevc', name: 'Numero 4',   imageUrl: '/avatars/vdp5_03.png' },
  { id: 'test_default_04', orgId: 'test-1tevc', name: 'Numero 2',   imageUrl: '/avatars/vdp5_04.png' },
  { id: 'test_default_05', orgId: 'test-1tevc', name: 'Numero 8',   imageUrl: '/avatars/vdp5_05.png' },
  { id: 'test_default_06', orgId: 'test-1tevc', name: 'Numero 10',  imageUrl: '/avatars/vdp5_06.png' },
  { id: 'test_default_07', orgId: 'test-1tevc', name: 'Numero 7',   imageUrl: '/avatars/vdp5_07.png' },
  { id: 'test_default_08', orgId: 'test-1tevc', name: 'Numero 9',   imageUrl: '/avatars/vdp5_08.png' },
  { id: 'test_default_09', orgId: 'test-1tevc', name: 'Numero 11',  imageUrl: '/avatars/vdp5_09.png' },
]

export function getAvatarsForOrg(orgId) {
  return AVATAR_CATALOG.filter(a => a.orgId === orgId)
}

export function getAvatarById(avatarId) {
  return AVATAR_CATALOG.find(a => a.id === avatarId) ?? null
}
