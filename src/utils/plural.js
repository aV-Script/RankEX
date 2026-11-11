// Plurale italiano generico: solo il nome, senza regole morfologiche.
// Il chiamante passa singolare e plurale già scritti (es. terminologia del modulo).

/**
 * Sceglie singolare o plurale in base alla quantità.
 * Singolare solo per |count| === 1; zero e tutto il resto vanno al plurale.
 * @param {number} count
 * @param {string} singular
 * @param {string} plural
 * @returns {string}
 */
export function pluralize(count, singular, plural) {
  return Math.abs(count) === 1 ? singular : plural
}

/**
 * Quantità seguita dal nome concordato: "1 cliente", "2 clienti", "0 clienti".
 * @param {number} count
 * @param {string} singular
 * @param {string} plural
 * @returns {string}
 */
export function countLabel(count, singular, plural) {
  return `${count} ${pluralize(count, singular, plural)}`
}
