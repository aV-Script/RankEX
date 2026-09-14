// Speculare a src/config/avatars.config.js — SOLO le regole di sblocco (id-suffix →
// unlockType/price), non l'intero catalogo (label/imageUrl/orgId non servono qui).
// Necessario perché acquistaAvatar.js deve validare il prezzo server-side — il client
// non deve poter dettare lui stesso quanto costa un avatar.
// Spike EPIC-005 (vedi docs/DECISIONS.md → ADR-002) — importi dimostrativi, non
// un'economia bilanciata. Se cambi le soglie qui, aggiorna anche l'altra copia.

const UNLOCK_RULES_BY_SUFFIX = {
  '01': { unlockType: 'default' },
  '02': { unlockType: 'default' },
  '03': { unlockType: 'default' },
  '04': { unlockType: 'level', unlockValue: 5 },
  '05': { unlockType: 'level', unlockValue: 10 },
  '06': { unlockType: 'level', unlockValue: 15 },
  '07': { unlockType: 'purchase', price: 30 },
  '08': { unlockType: 'purchase', price: 60 },
  '09': { unlockType: 'purchase', price: 100 },
}

export function getUnlockRuleForAvatarId(avatarId) {
  const suffix = String(avatarId).slice(-2)
  return UNLOCK_RULES_BY_SUFFIX[suffix] ?? { unlockType: 'default' }
}
