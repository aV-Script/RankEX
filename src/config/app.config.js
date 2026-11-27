
// UI
export const PAGINATION_PAGE_SIZE = 12
export const TOAST_DURATION_MS    = 4000

// Conferme e avvisi spariscono da soli; gli errori restano finché non vengono chiusi (×)
export function getToastDurationMs(variant) {
  return variant === 'error' ? null : TOAST_DURATION_MS
}

// Programma la rimozione del toast se la variante la prevede; ritorna l'id del timer (o null)
export function scheduleToastRemoval(variant, remove, setTimeoutFn = setTimeout) {
  const durationMs = getToastDurationMs(variant)
  return durationMs === null ? null : setTimeoutFn(remove, durationMs)
}

// Colore-identità area super_admin — unica sorgente, mai var(--rx-accent)
// (che è il colore di brand dell'area trainer/client) dentro le pagine admin.
export const ADMIN_COLOR = '#f87171'
