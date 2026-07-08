import { describe, it, expect } from 'vitest'
import { buildNoteThreads, notesToDeleteForCascade } from '../../utils/notes'

const notes = [
  { id: 'root-1', parentId: null,   text: 'Nota trainer' },
  { id: 'c1',      parentId: 'root-1', text: 'Risposta cliente 1' },
  { id: 'c2',      parentId: 'root-1', text: 'Risposta cliente 2' },
  { id: 'root-2', parentId: null,   text: 'Altra nota' },
]

describe('buildNoteThreads', () => {
  it('mantiene solo le note root come primo livello', () => {
    const threads = buildNoteThreads(notes)
    expect(threads.map(t => t.id)).toEqual(['root-1', 'root-2'])
  })

  it('associa i commenti al thread root corretto', () => {
    const threads = buildNoteThreads(notes)
    const root1 = threads.find(t => t.id === 'root-1')
    expect(root1.comments.map(c => c.id)).toEqual(['c1', 'c2'])
  })

  it('un thread senza commenti ha comments: []', () => {
    const threads = buildNoteThreads(notes)
    const root2 = threads.find(t => t.id === 'root-2')
    expect(root2.comments).toEqual([])
  })

  it('con lista vuota restituisce array vuoto', () => {
    expect(buildNoteThreads([])).toEqual([])
  })
})

describe('notesToDeleteForCascade', () => {
  it('include la nota root e tutti i suoi commenti', () => {
    const toDelete = notesToDeleteForCascade(notes, 'root-1').map(n => n.id)
    expect(toDelete.sort()).toEqual(['c1', 'c2', 'root-1'])
  })

  it('non tocca i thread diversi da quello eliminato', () => {
    const toDelete = notesToDeleteForCascade(notes, 'root-1').map(n => n.id)
    expect(toDelete).not.toContain('root-2')
  })

  it('eliminare un singolo commento non trascina il thread root', () => {
    const toDelete = notesToDeleteForCascade(notes, 'c1').map(n => n.id)
    expect(toDelete).toEqual(['c1'])
  })
})
