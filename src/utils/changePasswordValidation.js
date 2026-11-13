import { validatePassword } from './validation'

/**
 * Validazione del form "imposta la tua password" (primo accesso).
 * Ritorna gli errori per campo (`current`, `password`, `confirm`); oggetto vuoto se valido.
 * La regola "diversa dalla temporanea" vale solo con una nuova password già valida:
 * a campi vuoti o con password debole resta il messaggio di `validatePassword`.
 */
export function validateChangePasswordForm({ current, password, confirm }) {
  const errors = {}
  if (!current) errors.current = 'Password temporanea obbligatoria'
  const pwCheck = validatePassword(password)
  if (!pwCheck.valid) errors.password = pwCheck.error
  if (password !== confirm) errors.confirm = 'Le password non coincidono'
  if (pwCheck.valid && password === current) {
    errors.password = 'La nuova password deve essere diversa da quella temporanea'
  }
  return errors
}
