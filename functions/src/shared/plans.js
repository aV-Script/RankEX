// Limiti piano SaaS — speculare a src/config/plans.config.js.
// Usato per applicare i limiti lato server: le Firestore rules non bastano perché
// l'Admin SDK (usato da queste Cloud Functions) le bypassa completamente.
export const PLAN_LIMITS = {
  free:       { trainers: 1,        clients: 10 },
  pro:        { trainers: 5,        clients: 100 },
  enterprise: { trainers: Infinity, clients: Infinity },
}

export function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
}

export function isAtTrainerLimit(plan, count) {
  return count >= getPlanLimits(plan).trainers
}

export function isAtClientLimit(plan, count) {
  return count >= getPlanLimits(plan).clients
}
