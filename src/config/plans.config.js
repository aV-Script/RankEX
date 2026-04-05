/**
 * Definizione piani SaaS — limiti trainer e clienti per organizzazione.
 * Enterprise = illimitato (Infinity nelle regole UI; 999999 nelle Firestore rules).
 */
export const PLAN_LIMITS = {
  free:       { trainers: 1,        clients: 10,        label: 'Free' },
  pro:        { trainers: 5,        clients: 100,       label: 'Pro' },
  enterprise: { trainers: Infinity, clients: Infinity,  label: 'Enterprise' },
}

export const PLAN_OPTIONS = [
  { value: 'free',       label: 'Free — 1 trainer · 10 clienti' },
  { value: 'pro',        label: 'Pro — 5 trainer · 100 clienti' },
  { value: 'enterprise', label: 'Enterprise — illimitati' },
]

/**
 * Restituisce i limiti del piano. Default: free.
 */
export function getPlanLimits(plan) {
  return PLAN_LIMITS[plan ?? 'free'] ?? PLAN_LIMITS.free
}

/**
 * true se il numero corrente di trainer ha raggiunto il limite del piano.
 */
export function isAtTrainerLimit(plan, count) {
  return count >= getPlanLimits(plan).trainers
}

/**
 * true se il numero corrente di clienti ha raggiunto il limite del piano.
 */
export function isAtClientLimit(plan, count) {
  return count >= getPlanLimits(plan).clients
}
