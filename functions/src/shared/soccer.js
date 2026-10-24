// Fasce d'età soccer — speculare a src/config/modules.config.js
// (getCategoriaFromEta / resolveCategoria). Se cambi le soglie, aggiorna
// entrambe le copie: il test di parità in src/__tests__/parity le confronta.

import { calcAge } from './percentile.js'

export function getCategoriaFromEta(eta) {
  const age = Number(eta)
  if (isNaN(age) || age < 10) return 'soccer_youth'
  if (age < 14)               return 'soccer_junior'
  return 'soccer'
}

/**
 * Categoria con cui valutare il cliente oggi: per il soccer dipende dall'età
 * attuale, non da quella alla creazione del cliente.
 */
export function resolveCategoria(client) {
  const categoria = client?.categoria
  if (!categoria?.startsWith('soccer')) return categoria
  const age = calcAge(client.dataNascita) ?? client.eta
  return age === null || age === undefined ? categoria : getCategoriaFromEta(age)
}
