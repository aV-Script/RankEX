// createdAt di un'org: la scrive l'app come ISO string, ma i seed e i dati più
// vecchi possono averlo come Timestamp Firestore. L'UI lavora solo con stringhe ISO.

/** Timestamp Firestore → ISO string; ogni altro valore (stringa, null, undefined) invariato */
export function normalizeCreatedAt(value) {
  return value && typeof value.toDate === 'function' ? value.toDate().toISOString() : value
}

/** Documento org con `createdAt` normalizzato */
export function normalizeOrgData(data) {
  return 'createdAt' in data ? { ...data, createdAt: normalizeCreatedAt(data.createdAt) } : data
}

const CREATED_AT_FORMAT = { day: '2-digit', month: 'short', year: 'numeric' }

/**
 * "Creato il" del dettaglio org. Senza `createdAt` (org appena creata, valore del
 * server non ancora arrivato) mostra la data locale di oggi invece di "—".
 */
export function formatOrgCreatedAt(createdAt, now = new Date()) {
  const date = createdAt ? new Date(createdAt) : now
  return (Number.isNaN(date.getTime()) ? now : date).toLocaleDateString('it-IT', CREATED_AT_FORMAT)
}
