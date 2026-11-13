import { describe, it, expect } from 'vitest'
import { validateChangePasswordForm } from '../../utils/changePasswordValidation.js'

describe('validateChangePasswordForm', () => {
  it('campi vuoti: sulla nuova password resta "Password obbligatoria", non "diversa dalla temporanea"', () => {
    const errors = validateChangePasswordForm({ current: '', password: '', confirm: '' })
    expect(errors.current).toBe('Password temporanea obbligatoria')
    expect(errors.password).toBe('Password obbligatoria')
    expect(errors.confirm).toBeUndefined()
  })

  it('nuova password debole uguale alla temporanea: errore di complessità', () => {
    const errors = validateChangePasswordForm({ current: 'abc', password: 'abc', confirm: 'abc' })
    expect(errors.password).toBe('Minimo 8 caratteri')
  })

  it('nuova password valida ma uguale alla temporanea: errore "diversa"', () => {
    const errors = validateChangePasswordForm({ current: 'Password1', password: 'Password1', confirm: 'Password1' })
    expect(errors.password).toBe('La nuova password deve essere diversa da quella temporanea')
  })

  it('conferma diversa', () => {
    const errors = validateChangePasswordForm({ current: 'Temp1234', password: 'Nuova1234', confirm: 'Altra1234' })
    expect(errors).toEqual({ confirm: 'Le password non coincidono' })
  })

  it('form valido: nessun errore', () => {
    expect(validateChangePasswordForm({ current: 'Temp1234', password: 'Nuova1234', confirm: 'Nuova1234' })).toEqual({})
  })
})
