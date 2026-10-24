import { lazy }             from 'react'
import { ClientsPage }      from './ClientsPage'

// Solo la lista clienti (pagina di default) è nel bundle iniziale: le altre
// pagine si scaricano alla prima apertura. Prima erano tutte in un unico chunk
// da ~240 KB caricato anche da chi apre solo la lista clienti.
const lazyPage = (load, name) => lazy(() => load().then(m => ({ default: m[name] })))

const TrainerCalendar = lazyPage(() => import('./TrainerCalendar'), 'TrainerCalendar')
const ProfilePage     = lazyPage(() => import('./ProfilePage'), 'ProfilePage')
const GroupsPage      = lazyPage(() => import('./GroupsPage'), 'GroupsPage')
const RecurrencesPage = lazyPage(() => import('./RecurrencesPage'), 'RecurrencesPage')
const TestGuidePage   = lazyPage(() => import('./TestGuidePage'), 'TestGuidePage')

export const PAGES = {
  clients:     ClientsPage,
  calendar:    TrainerCalendar,
  guide:       TestGuidePage,
  groups:      GroupsPage,
  recurrences: RecurrencesPage,
  profile:     ProfilePage,
}