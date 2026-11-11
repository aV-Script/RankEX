import { describe, it, expect } from 'vitest'
import { pluralize, countLabel } from '../../utils/plural.js'
import { formatMonoDelta } from '../../features/assessments/assessmentFormat.js'

describe('pluralize', () => {
  it('singolare solo per |count| === 1', () => {
    expect(pluralize(1, 'cliente', 'clienti')).toBe('cliente')
    expect(pluralize(-1, 'cliente', 'clienti')).toBe('cliente')
  })
  it('plurale per 0, 2 e negativi diversi da -1', () => {
    expect(pluralize(0, 'cliente', 'clienti')).toBe('clienti')
    expect(pluralize(2, 'cliente', 'clienti')).toBe('clienti')
    expect(pluralize(-2, 'cliente', 'clienti')).toBe('clienti')
  })
})

describe('countLabel', () => {
  it('antepone la quantità al nome concordato', () => {
    expect(countLabel(0, 'presente', 'presenti')).toBe('0 presenti')
    expect(countLabel(1, 'presente', 'presenti')).toBe('1 presente')
    expect(countLabel(2, 'presente', 'presenti')).toBe('2 presenti')
    expect(countLabel(-1, 'presente', 'presenti')).toBe('-1 presente')
    expect(countLabel(-2, 'presente', 'presenti')).toBe('-2 presenti')
  })
})

describe('formatMonoDelta con unità numerabile', () => {
  const reference = { performedAt: '2026-09-03T10:00:00.000Z', outcome: 'complete' }
  const unit = { singular: 'ripetizione', plural: 'ripetizioni' }
  const format = delta => formatMonoDelta({ assessment: { outcome: 'complete' }, reference, delta, deltaUnavailable: null }, unit)
  it('singolare per +1 e -1, plurale per +2', () => {
    expect(format(1)).toContain(' ripetizione rispetto')
    expect(format(-1)).toContain(' ripetizione rispetto')
    expect(format(2)).toContain(' ripetizioni rispetto')
  })
})
