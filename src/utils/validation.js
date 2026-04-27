/**
 * Funzioni di validazione pure — restituiscono { valid: bool, error: string|null }.
 */

// Calcola l'età intera corrente da una data di nascita (YYYY-MM-DD).
// Restituisce null se la data è assente o non valida.
export function calcAge(dataNascita) {
  if (!dataNascita) return null
  const birth = new Date(dataNascita)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function validateBirthDate(dataNascita) {
  if (!dataNascita)
    return { valid: false, error: 'Data di nascita obbligatoria' }
  const birth = new Date(dataNascita)
  if (isNaN(birth.getTime()))
    return { valid: false, error: 'Data non valida' }
  if (birth > new Date())
    return { valid: false, error: 'Data nel futuro' }
  const age = calcAge(dataNascita)
  if (age < 3 || age > 100)
    return { valid: false, error: 'Età non valida (3–100 anni)' }
  return { valid: true, error: null }
}

export function validateEmail(email) {
  if (!email || !email.trim())
    return { valid: false, error: 'Email obbligatoria' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return { valid: false, error: 'Formato email non valido' }
  return { valid: true, error: null }
}

export function validatePassword(password) {
  if (!password)
    return { valid: false, error: 'Password obbligatoria' }
  if (password.length < 8)
    return { valid: false, error: 'Minimo 8 caratteri' }
  if (!/[0-9]/.test(password))
    return { valid: false, error: 'Deve contenere almeno un numero' }
  return { valid: true, error: null }
}

export function validateAge(age) {
  const n = Number(age)
  if (age === '' || age === null || age === undefined)
    return { valid: false, error: 'Età obbligatoria' }
  if (isNaN(n) || n < 16 || n > 100)
    return { valid: false, error: 'Età non valida (16–100)' }
  return { valid: true, error: null }
}

export function validateRequired(value, label = 'Campo') {
  if (!value || !String(value).trim())
    return { valid: false, error: `${label} obbligatorio` }
  return { valid: true, error: null }
}

export function validateNumber(value, { min, max, label = 'Valore' } = {}) {
  if (value === '' || value === null || value === undefined)
    return { valid: false, error: `${label} obbligatorio` }
  const n = Number(value)
  if (isNaN(n))
    return { valid: false, error: `${label} non valido` }
  if (min !== undefined && n < min)
    return { valid: false, error: `${label} minimo ${min}` }
  if (max !== undefined && n > max)
    return { valid: false, error: `${label} massimo ${max}` }
  return { valid: true, error: null }
}
