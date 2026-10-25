import { describe, it, expect } from 'vitest'
import {
  FILTER_ALL, SORT_KEYS,
  getAvailableSortKeys, resolveSortKey, getCategoriaFilterField,
  getCategoriaOptions, getFasciaOptions, filterAndSortClients,
} from '../../utils/clientFilters.js'
import { getModule, MODULES } from '../../config/modules.config.js'

const PT       = getModule(MODULES.PERSONAL_TRAINING)
const SOCCER   = getModule(MODULES.SOCCER_ACADEMY)
const LIPEDEMA = getModule(MODULES.LIPEDEMA)

const PT_CLIENTS = [
  { id: 'a', name: 'Bruno',  categoria: 'health',  media: 40, level: 3 },
  { id: 'b', name: 'Anna',   categoria: 'athlete', media: 80, level: 1 },
  { id: 'c', name: 'Carlo',  categoria: 'health',  media: 60, level: 7 },
]

const SOCCER_CLIENTS = [
  { id: 's1', name: 'Zeno',  categoria: 'soccer',       ruolo: 'forward',    media: 50, level: 2 },
  { id: 's2', name: 'Elia',  categoria: 'soccer_youth', ruolo: 'goalkeeper', media: 70, level: 5 },
  { id: 's3', name: 'Marco', categoria: 'soccer',       ruolo: 'forward',    media: 30, level: 9 },
]

// Pazienti con campi legacy di gamification valorizzati: non devono influenzare nulla
const LIPEDEMA_CLIENTS = [
  { id: 'l1', name: 'Paola',   media: 10, level: 9, categoria: 'health' },
  { id: 'l2', name: 'Barbara', media: 90, level: 1, categoria: 'athlete' },
]

const names = (list) => list.map(client => client.name)

describe('getAvailableSortKeys', () => {
  it('PT e soccer: nome, rank, livello (invariato)', () => {
    expect(getAvailableSortKeys(PT)).toEqual([SORT_KEYS.NAME, SORT_KEYS.RANK, SORT_KEYS.LEVEL])
    expect(getAvailableSortKeys(SOCCER)).toEqual([SORT_KEYS.NAME, SORT_KEYS.RANK, SORT_KEYS.LEVEL])
  })

  it('lipedema: solo nome', () => {
    expect(getAvailableSortKeys(LIPEDEMA)).toEqual([SORT_KEYS.NAME])
  })

  it('modulo sconosciuto: solo nome (default restrittivo)', () => {
    expect(getAvailableSortKeys(getModule('ignoto'))).toEqual([SORT_KEYS.NAME])
  })
})

describe('resolveSortKey', () => {
  it('una chiave disponibile resta invariata', () => {
    expect(resolveSortKey(SORT_KEYS.RANK, PT)).toBe(SORT_KEYS.RANK)
  })

  it('rank/livello senza capability ricadono sul nome', () => {
    expect(resolveSortKey(SORT_KEYS.RANK, LIPEDEMA)).toBe(SORT_KEYS.NAME)
    expect(resolveSortKey(SORT_KEYS.LEVEL, LIPEDEMA)).toBe(SORT_KEYS.NAME)
  })
})

describe('getCategoriaFilterField', () => {
  it('PT → categoria, soccer → ruolo, lipedema → nessuno', () => {
    expect(getCategoriaFilterField(PT)).toBe('categoria')
    expect(getCategoriaFilterField(SOCCER)).toBe('ruolo')
    expect(getCategoriaFilterField(LIPEDEMA)).toBeNull()
  })
})

describe('getCategoriaOptions', () => {
  it('PT: categorie presenti, senza duplicati', () => {
    expect(getCategoriaOptions(PT_CLIENTS, PT)).toEqual([FILTER_ALL, 'health', 'athlete'])
  })

  it('soccer: ruoli presenti', () => {
    expect(getCategoriaOptions(SOCCER_CLIENTS, SOCCER)).toEqual([FILTER_ALL, 'forward', 'goalkeeper'])
  })

  it('lipedema: nessuna opzione oltre "tutti", anche con categoria legacy sui pazienti', () => {
    expect(getCategoriaOptions(LIPEDEMA_CLIENTS, LIPEDEMA)).toEqual([FILTER_ALL])
  })
})

describe('getFasciaOptions', () => {
  it('soccer con due fasce: opzioni presenti', () => {
    expect(getFasciaOptions(SOCCER_CLIENTS, SOCCER)).toEqual([FILTER_ALL, 'soccer', 'soccer_youth'])
  })

  it('soccer con una sola fascia: nessun filtro', () => {
    expect(getFasciaOptions(SOCCER_CLIENTS.filter(client => client.categoria === 'soccer'), SOCCER)).toEqual([])
  })

  it('PT e lipedema: mai', () => {
    expect(getFasciaOptions(PT_CLIENTS, PT)).toEqual([])
    expect(getFasciaOptions(LIPEDEMA_CLIENTS, LIPEDEMA)).toEqual([])
  })
})

describe('filterAndSortClients', () => {
  it('PT: ordinamento per rank (media decrescente)', () => {
    expect(names(filterAndSortClients(PT_CLIENTS, [], { sortBy: SORT_KEYS.RANK }, PT))).toEqual(['Anna', 'Carlo', 'Bruno'])
  })

  it('PT: ordinamento per livello', () => {
    expect(names(filterAndSortClients(PT_CLIENTS, [], { sortBy: SORT_KEYS.LEVEL }, PT))).toEqual(['Carlo', 'Bruno', 'Anna'])
  })

  it('PT: filtro categoria', () => {
    expect(names(filterAndSortClients(PT_CLIENTS, [], { filterCategoria: 'health' }, PT))).toEqual(['Bruno', 'Carlo'])
  })

  it('soccer: filtro ruolo + fascia', () => {
    const list = filterAndSortClients(SOCCER_CLIENTS, [], { filterCategoria: 'forward', filterFascia: 'soccer' }, SOCCER)
    expect(names(list)).toEqual(['Marco', 'Zeno'])
  })

  it('lipedema: sortBy rank/livello ignorati → ordinamento per nome', () => {
    expect(names(filterAndSortClients(LIPEDEMA_CLIENTS, [], { sortBy: SORT_KEYS.RANK }, LIPEDEMA))).toEqual(['Barbara', 'Paola'])
    expect(names(filterAndSortClients(LIPEDEMA_CLIENTS, [], { sortBy: SORT_KEYS.LEVEL }, LIPEDEMA))).toEqual(['Barbara', 'Paola'])
  })

  it('lipedema: filtro categoria/fascia ignorati anche se valorizzati', () => {
    const list = filterAndSortClients(LIPEDEMA_CLIENTS, [], { filterCategoria: 'health', filterFascia: 'soccer' }, LIPEDEMA)
    expect(names(list)).toEqual(['Barbara', 'Paola'])
  })

  it('ricerca per nome e filtro gruppo valgono in ogni modulo', () => {
    const groups = [{ id: 'g1', clientIds: ['l1'] }]
    expect(names(filterAndSortClients(LIPEDEMA_CLIENTS, groups, { filterGroup: 'g1' }, LIPEDEMA))).toEqual(['Paola'])
    expect(names(filterAndSortClients(LIPEDEMA_CLIENTS, [], { query: ' barb ' }, LIPEDEMA))).toEqual(['Barbara'])
  })

  it('non modifica l\'array di input', () => {
    const input = [...PT_CLIENTS]
    filterAndSortClients(input, [], { sortBy: SORT_KEYS.RANK }, PT)
    expect(input).toEqual(PT_CLIENTS)
  })
})
