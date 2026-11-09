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
