import { httpsCallable } from 'firebase/functions'
import { functions }     from '../firebase/config'

const _registraLoginFallito = httpsCallable(functions, 'registraLoginFallito')

export async function logFailedLoginUseCase(email) {
  const { data } = await _registraLoginFallito({ email })
  return data
}
