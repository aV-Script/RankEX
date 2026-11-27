// Logica pura del dialog di eliminazione cliente (STORY-055): cosa viene cancellato
// e quando il nome digitato conferma. Niente React, niente nomi nei log.

/**
 * Elenco di ciò che `eliminaCliente` cancella, derivato dalle capability del modulo.
 * Note, schede, notifiche e rimozione da calendario/gruppi ci sono sempre.
 */
export function getDeletedItems(capabilities, terminology) {
  const caps = capabilities ?? {}
  const planLabel = terminology?.workoutPlanTitle ?? 'Scheda allenamento'
  const sessionsLabel = (terminology?.sessions ?? 'Allenamenti').toLowerCase()
  return [
    caps.hasClientLogin && 'Account di accesso',
    caps.hasPercentileTests && 'Campionamenti e statistiche',
    caps.hasAssessments && 'Valutazioni',
    caps.hasBia && 'Misurazioni BIA',
    'Note e commenti',
    caps.hasGoals && 'Obiettivi',
    `${planLabel} (${terminology?.workoutPlanGender === 'm' ? 'tutti' : 'tutte'})`,
    'Notifiche',
    `Rimozione da ${sessionsLabel}, ricorrenze e gruppi`,
  ].filter(Boolean)
}

/** Nome digitato = nome del cliente, ignorando spazi esterni e maiuscole. */
export function isDeleteNameConfirmed(typedName, clientName) {
  const expected = (clientName ?? '').trim().toLowerCase()
  return expected !== '' && (typedName ?? '').trim().toLowerCase() === expected
}
