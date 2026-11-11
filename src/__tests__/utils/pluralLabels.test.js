import { describe, it, expect } from 'vitest'
import {
  clientCountLabel, unreadLabel, commentCountLabel, plannedDoneLabel, monthlyLimitMessage,
  slotClientsLabel, filledCountLabel, repetitionsLabel, examinersLabel,
} from '../../utils/pluralLabels.js'
import { TERMINOLOGIES } from '../../config/modules.config.js'

const PT = TERMINOLOGIES.personal_training
const GYM = TERMINOLOGIES.gym
const SOCCER = TERMINOLOGIES.soccer_academy
const LIPEDEMA = TERMINOLOGIES.lipedema

describe('clientCountLabel', () => {
  it('0, 1, 2 e -1 con la terminologia di ogni modulo', () => {
    expect(clientCountLabel(PT, 0)).toBe('0 clienti')
    expect(clientCountLabel(PT, 1)).toBe('1 cliente')
    expect(clientCountLabel(PT, 2)).toBe('2 clienti')
    expect(clientCountLabel(PT, -1)).toBe('-1 cliente')
    expect(clientCountLabel(GYM, 1)).toBe('1 membro')
    expect(clientCountLabel(GYM, 2)).toBe('2 membri')
    expect(clientCountLabel(SOCCER, 1)).toBe('1 allievo')
    expect(clientCountLabel(LIPEDEMA, 1)).toBe('1 paziente')
    expect(clientCountLabel(LIPEDEMA, 2)).toBe('2 pazienti')
  })
})

describe('unreadLabel', () => {
  it('0, 1, 2 e -1', () => {
    expect(unreadLabel(0)).toBe('0 non lette')
    expect(unreadLabel(1)).toBe('1 non letta')
    expect(unreadLabel(2)).toBe('2 non lette')
    expect(unreadLabel(-1)).toBe('-1 non letta')
  })
})

describe('commentCountLabel', () => {
  it('0, 1, 2 e -1', () => {
    expect(commentCountLabel(0)).toBe('0 commenti')
    expect(commentCountLabel(1)).toBe('1 commento')
    expect(commentCountLabel(2)).toBe('2 commenti')
    expect(commentCountLabel(-1)).toBe('-1 commento')
  })
})

describe('plannedDoneLabel', () => {
  it('concorda nome e participio col genere del modulo (maschile)', () => {
    expect(plannedDoneLabel(LIPEDEMA, 0)).toBe('0 appuntamenti svolti')
    expect(plannedDoneLabel(LIPEDEMA, 1)).toBe('1 appuntamento svolto')
    expect(plannedDoneLabel(LIPEDEMA, 2)).toBe('2 appuntamenti svolti')
    expect(plannedDoneLabel(LIPEDEMA, -1)).toBe('-1 appuntamento svolto')
  })
  it('concorda nome e participio col genere del modulo (femminile)', () => {
    expect(PT.sessionGender).toBe('f')
    expect(plannedDoneLabel(PT, 0)).toBe('0 sessioni svolte')
    expect(plannedDoneLabel(PT, 1)).toBe('1 sessione svolta')
    expect(plannedDoneLabel(PT, 2)).toBe('2 sessioni svolte')
  })
})

describe('monthlyLimitMessage', () => {
  it('verbo al singolare solo per 1', () => {
    expect(monthlyLimitMessage(PT, 1)).toBe('1 cliente ha raggiunto il massimale mensile.')
    expect(monthlyLimitMessage(PT, 2)).toBe('2 clienti hanno raggiunto il massimale mensile.')
    expect(monthlyLimitMessage(LIPEDEMA, 1)).toBe('1 paziente ha raggiunto il massimale mensile.')
    expect(monthlyLimitMessage(LIPEDEMA, 0)).toBe('0 pazienti hanno raggiunto il massimale mensile.')
    expect(monthlyLimitMessage(PT, -1)).toBe('-1 cliente ha raggiunto il massimale mensile.')
  })
})

describe('slotClientsLabel (vista mese, D5)', () => {
  it('nessuna etichetta con 0 nomi', () => {
    expect(slotClientsLabel(PT, [])).toBe('')
  })
  it('il nome con 1', () => {
    expect(slotClientsLabel(PT, ['Anna'])).toBe('Anna')
  })
  it('conteggio con la terminologia del modulo da 2 in su', () => {
    expect(slotClientsLabel(PT, ['Anna', 'Luca'])).toBe('2 clienti')
    expect(slotClientsLabel(LIPEDEMA, ['Anna', 'Luca'])).toBe('2 pazienti')
    expect(slotClientsLabel(GYM, ['A', 'B', 'C'])).toBe('3 membri')
  })
})

describe('filledCountLabel', () => {
  it('0, 1, 2 e -1', () => {
    expect(filledCountLabel(0)).toBe('0 compilati')
    expect(filledCountLabel(1)).toBe('1 compilato')
    expect(filledCountLabel(2)).toBe('2 compilati')
    expect(filledCountLabel(-1)).toBe('-1 compilato')
  })
})

describe('repetitionsLabel', () => {
  it('0, 1, 2 e -1, con il numero già formattato dal chiamante', () => {
    expect(repetitionsLabel(0, '0')).toBe('0 ripetizioni')
    expect(repetitionsLabel(1, '1')).toBe('1 ripetizione')
    expect(repetitionsLabel(2, '2')).toBe('2 ripetizioni')
    expect(repetitionsLabel(-1, '-1')).toBe('-1 ripetizione')
    expect(repetitionsLabel(12.5, '12,5')).toBe('12,5 ripetizioni')
  })
})

describe('examinersLabel', () => {
  it('singolare con 0 e 1, plurale da 2, terminologia del modulo', () => {
    expect(examinersLabel(LIPEDEMA, 0)).toBe('Professionista')
    expect(examinersLabel(LIPEDEMA, 1)).toBe('Professionista')
    expect(examinersLabel(LIPEDEMA, 2)).toBe('Professionisti')
    expect(examinersLabel(PT, 2)).toBe('Trainer')
  })
})
