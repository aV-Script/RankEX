/**
 * Path helpers per le subcollections Firestore.
 * Tutti i dati operativi vivono sotto organizations/{orgId}/.
 */

export const clientsPath       = (orgId) => `organizations/${orgId}/clients`
export const slotsPath         = (orgId) => `organizations/${orgId}/slots`
export const groupsPath        = (orgId) => `organizations/${orgId}/groups`
export const recurrencesPath   = (orgId) => `organizations/${orgId}/recurrences`
export const notificationsPath = (orgId) => `organizations/${orgId}/notifications`
export const notesPath         = (orgId, clientId) => `organizations/${orgId}/clients/${clientId}/notes`
export const groupNotesPath    = (orgId, groupId)  => `organizations/${orgId}/groups/${groupId}/notes`
export const workoutPlansPath  = (orgId) => `organizations/${orgId}/workoutPlans`
