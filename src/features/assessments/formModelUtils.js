// Conversioni comuni ai form delle valutazioni: stato del form (stringhe, come
// arrivano dagli input) ↔ input della callable (numeri o null). La validazione
// resta quella condivisa col server (utils/lipedema.js → validateAssessmentInput).

/** id dell'elemento DOM di un campo, da usare anche come htmlFor del Field */
export function fieldId(field) {
  return `assessment-${field.replace(/\./g, '-')}`
}

/** '' → null; virgola decimale accettata; testo non numerico → NaN (lo segnala la validazione) */
export function toNumber(value) {
  if (value === null || value === undefined) return null
  const text = String(value).trim().replace(',', '.')
  return text === '' ? null : Number(text)
}

export function toText(value) {
  return value === null || value === undefined ? '' : String(value)
}

/** Campi clinici del form, tutti vuoti */
export function emptyClinical(keys) {
  return Object.fromEntries(keys.map(key => [key, '']))
}

/** Campi clinici dal documento salvato (Correggi) */
export function clinicalFromAssessment(keys, clinical = {}) {
  return Object.fromEntries(keys.map(key => [key, toText(clinical[key])]))
}

/** Campi clinici come input della callable */
export function clinicalToInput(keys, clinical) {
  return Object.fromEntries(keys.map(key => [key, toNumber(clinical[key])]))
}

/** Quanti parametri clinici facoltativi sono compilati (contatore della sezione) */
export function countFilledClinical(keys, form) {
  return keys.filter(key => form.clinical[key] !== '').length + (form.conditionsNote.trim() ? 1 : 0)
}

/** Chiavi cliniche di un insieme di righe PRE/POST */
export function clinicalKeysOf(rows) {
  return rows.flatMap(row => [row.pre, row.post])
}
