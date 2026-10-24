// Validazione input delle callable — l'Admin SDK non passa da firestore.rules,
// quindi tipi e formati vanno controllati qui.

import { HttpsError } from 'firebase-functions/v2/https'

// Formato degli id Firestore usati dall'app (auto-id, uid Auth, slug org).
// Verificato su tutti gli id esistenti in rankex-dev e fitquest-60a09 (ott 2026).
const ID_RE = /^[A-Za-z0-9_-]{1,128}$/

const isIdKey  = key => key === 'uid' || key.endsWith('Id')
const isIdsKey = key => key.endsWith('Ids')

function invalid(message) {
  throw new HttpsError('invalid-argument', message)
}

/**
 * Controlla tutti i campi id di primo livello di request.data: `uid`, `*Id`
 * (stringa) e `*Ids` (array di stringhe). null/undefined sono ammessi: se il
 * campo è obbligatorio lo verifica la callable.
 * Un id con "/" finiva interpolato nel path (`clients/${clientId}`) e puntava
 * a un documento qualsiasi dell'org.
 */
export function assertIdsInData(data) {
  if (!data || typeof data !== 'object') return
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue
    if (isIdsKey(key)) {
      if (!Array.isArray(value) || value.some(v => typeof v !== 'string' || !ID_RE.test(v))) {
        invalid(`${key} non valido`)
      }
    } else if (isIdKey(key) && (typeof value !== 'string' || !ID_RE.test(value))) {
      invalid(`${key} non valido`)
    }
  }
}

export function requireId(value, name) {
  if (typeof value !== 'string' || !ID_RE.test(value)) invalid(`${name} obbligatorio`)
  return value
}

export function requireNumber(value, name, { min = -Infinity, max = Infinity, integer = false } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)) invalid(`${name} deve essere un numero`)
  if (integer && !Number.isInteger(value)) invalid(`${name} deve essere un numero intero`)
  if (value < min || value > max) invalid(`${name} fuori intervallo (${min}–${max})`)
  return value
}

/** Sessioni previste di una scheda: intero 1..max, oppure null (nessun obiettivo) */
export function optionalTargetSessions(value, max) {
  if (value === undefined || value === null || value === '') return null
  return requireNumber(value, 'targetSessions', { min: 1, max, integer: true })
}

export function optionalString(value, name, maxLength) {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value !== 'string') invalid(`${name} deve essere un testo`)
  if (value.length > maxLength) invalid(`${name} troppo lungo (max ${maxLength} caratteri)`)
  return value
}

/**
 * Stessa policy di src/utils/validation.js → validatePassword. Prima esisteva
 * solo nel client: chiamando la callable direttamente si creavano account con
 * password di 6 caratteri (il minimo di Firebase Auth).
 */
export function requireValidPassword(password) {
  if (typeof password !== 'string' || password.length < 8) invalid('La password deve avere almeno 8 caratteri')
  if (!/[0-9]/.test(password)) invalid('La password deve contenere almeno un numero')
  if (!/[A-Z]/.test(password)) invalid('La password deve contenere almeno una lettera maiuscola')
  return password
}

export function requireDate(value, name) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || isNaN(new Date(value + 'T12:00'))) {
    invalid(`${name} deve essere una data AAAA-MM-GG`)
  }
  return value
}

export function requireTime(value, name) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) invalid(`${name} deve essere un orario HH:MM`)
  return value
}

/** Giorni della settimana 0-6 (0 = domenica), almeno uno, senza duplicati */
export function requireDays(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 7 ||
      value.some(d => !Number.isInteger(d) || d < 0 || d > 6) || new Set(value).size !== value.length) {
    invalid('days deve contenere da 1 a 7 giorni distinti tra 0 e 6')
  }
  return value
}

/** Tiene solo le chiavi ammesse: impedisce di scrivere campi non previsti. */
export function pickAllowed(data, allowedKeys) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) invalid('Dati non validi')
  return Object.fromEntries(Object.entries(data).filter(([key]) => allowedKeys.includes(key)))
}
