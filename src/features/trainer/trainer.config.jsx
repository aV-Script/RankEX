import { lazy }             from 'react'
import { ClientsPage }      from './ClientsPage'
import { TrainerCalendar }  from './TrainerCalendar'
import { ProfilePage }      from './ProfilePage'
import { GroupsPage }       from './GroupsPage'
import { RecurrencesPage }  from './RecurrencesPage'

// Aperta raramente rispetto alle altre pagine — lazy-load per non pesare
// sul bundle iniziale dell'area trainer.
const TestGuidePage = lazy(() =>
  import('./TestGuidePage').then(m => ({ default: m.TestGuidePage }))
)

export const PAGES = {
  clients:     ClientsPage,
  calendar:    TrainerCalendar,
  guide:       TestGuidePage,
  groups:      GroupsPage,
  recurrences: RecurrencesPage,
  profile:     ProfilePage,
}