/**
 * Funzioni pure per le Schede di allenamento.
 * Estratte da WorkoutPlanSection.jsx / ClientWorkoutSection.jsx, dove la stessa
 * normalizzazione era duplicata in più punti.
 */

/**
 * Normalizza una scheda al formato days: [{ label, exercises }].
 * Backward compat: i documenti creati prima di apr 2026 hanno exercises[] flat
 * invece di days[] — vengono avvolti in un unico "Giorno 1".
 */
export function normalizePlanDays(plan) {
  if (plan?.days?.length) return plan.days
  return [{ label: 'Giorno 1', exercises: plan?.exercises ?? [] }]
}

/** La scheda attiva tra quelle di un cliente, o null se nessuna lo è. */
export function pickActivePlan(plans) {
  return plans.find(p => p.status === 'active') ?? null
}

/** Ordina le schede per data di creazione, più recente prima. */
export function sortPlansByCreatedAtDesc(plans) {
  return [...plans].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}
