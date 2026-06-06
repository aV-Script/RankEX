import { describe, it, expect } from 'vitest'
import {
  getRankFromMedia,
  getCategoriaById,
  getTestsForCategoria,
  RANKS,
  CATEGORIE,
} from '../../constants/index.js'

// ── getRankFromMedia (US-043) ─────────────────────────────────────────────────
describe('getRankFromMedia', () => {
  it('media 0 → rank F (il più basso)', () => {
    const r = getRankFromMedia(0)
    expect(r.label).toBe('F')
  })

  it('media 100 → rank EX (il più alto)', () => {
    const r = getRankFromMedia(100)
    expect(r.label).toBe('EX')
  })

  it('restituisce sempre un oggetto con label e color', () => {
    [0, 20, 40, 55, 70, 85, 95].forEach(media => {
      const r = getRankFromMedia(media)
      expect(r).toHaveProperty('label')
      expect(r).toHaveProperty('color')
      expect(r.color).toMatch(/^#/)
    })
  })

  it('threshold esatte: media = min → rank corretto', () => {
    RANKS.forEach(rank => {
      const r = getRankFromMedia(rank.min)
      expect(r.label).toBe(rank.label)
    })
  })

  it('rank crescenti: media più alta → rank più alto', () => {
    const r50 = getRankFromMedia(50)
    const r70 = getRankFromMedia(70)
    const r90 = getRankFromMedia(90)
    const labels = RANKS.map(r => r.label)
    expect(labels.indexOf(r70.label)).toBeLessThan(labels.indexOf(r50.label))
    expect(labels.indexOf(r90.label)).toBeLessThan(labels.indexOf(r70.label))
  })
})

// ── getCategoriaById ──────────────────────────────────────────────────────────
describe('getCategoriaById', () => {
  it('restituisce health', () => {
    const c = getCategoriaById('health')
    expect(c.id).toBe('health')
    expect(c.label).toBe('Health')
  })

  it('restituisce active', () => {
    expect(getCategoriaById('active').id).toBe('active')
  })

  it('restituisce athlete', () => {
    expect(getCategoriaById('athlete').id).toBe('athlete')
  })

  it('default a health per id sconosciuto', () => {
    expect(getCategoriaById('unknown').id).toBe(CATEGORIE[0].id)
  })

  it('ogni categoria ha id, label, color, desc', () => {
    CATEGORIE.forEach(c => {
      expect(c).toHaveProperty('id')
      expect(c).toHaveProperty('label')
      expect(c).toHaveProperty('color')
      expect(c).toHaveProperty('desc')
    })
  })
})

// ── getTestsForCategoria (US-025, US-072) ─────────────────────────────────────
describe('getTestsForCategoria', () => {
  it('PT health: restituisce 5 test', () => {
    const tests = getTestsForCategoria('health')
    expect(tests).toHaveLength(5)
  })

  it('PT active: restituisce 5 test', () => {
    expect(getTestsForCategoria('active')).toHaveLength(5)
  })

  it('PT athlete: restituisce 5 test', () => {
    expect(getTestsForCategoria('athlete')).toHaveLength(5)
  })

  it('Soccer Pulcini (soccer_youth): restituisce 5 test', () => {
    expect(getTestsForCategoria('soccer_youth')).toHaveLength(5)
  })

  it('Soccer Esordienti (soccer_junior): restituisce 5 test', () => {
    expect(getTestsForCategoria('soccer_junior')).toHaveLength(5)
  })

  it('Soccer Senior (soccer): restituisce 5 test', () => {
    expect(getTestsForCategoria('soccer')).toHaveLength(5)
  })

  it('ogni test ha key, stat, label, unit, direction, categories', () => {
    getTestsForCategoria('health').forEach(t => {
      expect(t).toHaveProperty('key')
      expect(t).toHaveProperty('stat')
      expect(t).toHaveProperty('label')
      expect(t).toHaveProperty('unit')
      expect(t).toHaveProperty('direction')
      expect(t).toHaveProperty('categories')
    })
  })

  it('standing_long_jump è condiviso tra tutte le fasce soccer', () => {
    const youth  = getTestsForCategoria('soccer_youth').map(t => t.key)
    const junior = getTestsForCategoria('soccer_junior').map(t => t.key)
    const senior = getTestsForCategoria('soccer').map(t => t.key)
    expect(youth).toContain('standing_long_jump')
    expect(junior).toContain('standing_long_jump')
    expect(senior).toContain('standing_long_jump')
  })

  it('test PT non appaiono in soccer_youth', () => {
    const soccerKeys = getTestsForCategoria('soccer_youth').map(t => t.key)
    const ptKeys     = getTestsForCategoria('health').map(t => t.key)
    const intersezione = soccerKeys.filter(k => ptKeys.includes(k))
    expect(intersezione).toHaveLength(0)
  })

  it('restituisce array vuoto per categoria sconosciuta', () => {
    expect(getTestsForCategoria('categoria_inesistente')).toHaveLength(0)
  })
})
