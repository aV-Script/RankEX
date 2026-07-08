/**
 * Funzioni pure per il thread di Note & commenti.
 * Pattern: parentId === null → nota principale (thread root),
 *          parentId = noteId → commento di quel thread.
 * Estratte da useNotes.js per essere testabili senza montare l'hook.
 */

/** Raggruppa le note piatte in thread: { ...root, comments: [...] }. */
export function buildNoteThreads(notes) {
  return notes
    .filter(n => !n.parentId)
    .map(root => ({
      ...root,
      comments: notes.filter(n => n.parentId === root.id),
    }))
}

/** Id delle note da eliminare per cancellare in cascata un thread (root + suoi commenti). */
export function notesToDeleteForCascade(notes, noteId) {
  return notes.filter(n => n.id === noteId || n.parentId === noteId)
}
