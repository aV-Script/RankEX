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

/**
 * Avanzamento di una scheda. completedSessions/completedAt li scrive solo
 * chiudiSessione (una presenza = una sessione); il giorno consigliato ruota
 * sui giorni della scheda (Giorno 1 → 2 → … → 1).
 */
export function getPlanProgress(plan) {
  const days   = normalizePlanDays(plan)
  const done   = plan?.completedSessions ?? 0
  const target = plan?.targetSessions ?? null
  return {
    done,
    target,
    pct:          target ? Math.min(100, Math.round((done / target) * 100)) : null,
    completed:    Boolean(plan?.completedAt),
    nextDayIndex: done % days.length,
  }
}

/** La scheda attiva tra quelle di un cliente, o null se nessuna lo è. */
export function pickActivePlan(plans) {
  return plans.find(p => p.status === 'active') ?? null
}

/** Ordina le schede per data di creazione, più recente prima. */
export function sortPlansByCreatedAtDesc(plans) {
  return [...plans].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}
