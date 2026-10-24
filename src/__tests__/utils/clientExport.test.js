import { describe, it, expect } from 'vitest'
import { buildClientExport, clientExportFileName } from '../../utils/clientExport.js'

const ts = iso => ({ toDate: () => new Date(iso) })

describe('buildClientExport', () => {
  const data = buildClientExport({
    client: {
      id: 'c1', name: 'Mario', fcmTokens: ['tok'],
      wearable: { provider: 'google_fit', accessToken: 'segreto', lastData: { steps30d: 10 } },
      createdAt: ts('2026-01-02T03:04:05.000Z'),
      biaHistory: [{ date: '1 gen', fatMassPercent: 20 }],
    },
    goals: [{ id: 'g1', testKey: 'sprint_20m', createdAt: ts('2026-02-01T00:00:00.000Z') }],
    notes: [{ id: 'n1', text: 'ciao' }],
  }, new Date('2026-10-24T10:00:00.000Z'))

  it('include profilo, storico e sezioni collegate', () => {
    expect(data.esportatoIl).toBe('2026-10-24T10:00:00.000Z')
    expect(data.profilo.biaHistory).toHaveLength(1)
    expect(data.obiettivi[0].testKey).toBe('sprint_20m')
    expect(data.note[0].text).toBe('ciao')
    expect(data.schede).toEqual([])
    expect(data.notifiche).toEqual([])
  })

  it('toglie token push e token wearable, anche annidati', () => {
    expect(data.profilo.fcmTokens).toBeUndefined()
    expect(data.profilo.wearable.accessToken).toBeUndefined()
    expect(data.profilo.wearable.lastData.steps30d).toBe(10)
  })

  it('converte i Timestamp Firestore in date ISO', () => {
    expect(data.profilo.createdAt).toBe('2026-01-02T03:04:05.000Z')
    expect(data.obiettivi[0].createdAt).toBe('2026-02-01T00:00:00.000Z')
  })
})

describe('clientExportFileName', () => {
  it('nome senza accenti né spazi, con la data locale', () => {
    expect(clientExportFileName({ name: 'Niccolò De Santis' }, new Date(2026, 9, 24))).toBe('rankex-dati-niccolo-de-santis-2026-10-24.json')
    expect(clientExportFileName({}, new Date(2026, 0, 5))).toBe('rankex-dati-cliente-2026-01-05.json')
  })
})
