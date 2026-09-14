/**
 * Helper puri per gli obiettivi trainer (client-dashboard/GoalsSection.jsx).
 * 'missed' non è uno status salvato in Firestore — si calcola qui al volo
 * confrontando la deadline con oggi, per non richiedere un cron/trigger
 * dedicato solo per marcare un obiettivo scaduto.
 */
export function isGoalMissed(goal) {
  if (goal.status !== 'active' || !goal.deadline) return false
  return goal.deadline < new Date().toISOString().slice(0, 10)
}

/** Stato effettivo da mostrare in UI — include 'missed' calcolato. */
export function getGoalDisplayStatus(goal) {
  return isGoalMissed(goal) ? 'missed' : goal.status
}
