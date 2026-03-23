/**
 * Funzioni di validazione pure — restituiscono { valid: bool, error: string|null }.
 */

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
