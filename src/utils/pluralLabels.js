import { pluralize, countLabel } from './plural'
import { bySessionGender } from '../config/modules.config'

// Etichette con quantità usate in più componenti: tutte passano da pluralize/countLabel,
// la terminologia del modulo arriva sempre dal chiamante (mai nomi scritti a mano).

/** "1 paziente" / "2 pazienti" / "0 pazienti", nome secondo la terminologia del modulo. */
export function clientCountLabel(terminology, count) {
  return countLabel(count, terminology.client.toLowerCase(), terminology.clients.toLowerCase())
}

/** "1 non letta" / "2 non lette". */
export function unreadLabel(count) {
  return `${count} non ${pluralize(count, 'letta', 'lette')}`
}

/** "1 commento" / "2 commenti". */
export function commentCountLabel(count) {
  return countLabel(count, 'commento', 'commenti')
}

/** "1 allenamento svolto" / "2 sessioni svolte": nome e participio concordano col genere del modulo. */
export function plannedDoneLabel(terminology, done) {
  const noun = countLabel(done, terminology.session.toLowerCase(), terminology.sessions.toLowerCase())
  const participle = bySessionGender(
    terminology,
    pluralize(done, 'svolto', 'svolti'),
    pluralize(done, 'svolta', 'svolte'),
  )
  return `${noun} ${participle}`
}

/** "1 paziente ha raggiunto il massimale mensile." / "2 pazienti hanno raggiunto…". */
export function monthlyLimitMessage(terminology, count) {
  return `${clientCountLabel(terminology, count)} ${pluralize(count, 'ha', 'hanno')} raggiunto il massimale mensile.`
}

/** Etichetta di uno slot nella vista mese: nessuna con 0 nomi, il nome con 1, il conteggio con 2 o più. */
export function slotClientsLabel(terminology, clientNames) {
  if (clientNames.length === 0) return ''
  if (clientNames.length === 1) return clientNames[0]
  return clientCountLabel(terminology, clientNames.length)
}

/** "1 compilato" / "2 compilati". */
export function filledCountLabel(count) {
  return `${count} ${pluralize(count, 'compilato', 'compilati')}`
}

/** "1 ripetizione" / "2 ripetizioni" (il numero è già formattato dal chiamante). */
export function repetitionsLabel(count, formattedCount) {
  return `${formattedCount} ${pluralize(count, 'ripetizione', 'ripetizioni')}`
}

/** "Professionista" con 0 o 1 esaminatore, "Professionisti" da 2 in su (titolo di un campo). */
export function examinersLabel(terminology, count) {
  return pluralize(Math.max(count, 1), terminology.trainer, terminology.trainers)
}
