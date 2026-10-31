/**
 * Valutazioni Lipedema e informativa (STORY-029/033/034, ADR-009/011/015).
 *
 * registraInformativaPaziente, aggiungiValutazione, annullaValutazione: ruoli
 * (staff_readonly rifiutato), modulo (solo hasAssessments), informativa mancante
 * → failed-precondition, risultato calcolato dal server, correzione atomica con
 * supersedes, audit con soli identificativi.
 * auth.js è quello reale: i profili /users/{uid} sono nello store in memoria.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const db = vi.hoisted(() => ({ docs: new Map(), autoId: 0, audit: [], failCommit: false }))

vi.mock('firebase-functions/v2/https', () => {
  class HttpsError extends Error {
    constructor(code, message, details) { super(message); this.code = code; this.details = details }
  }
  return { HttpsError, onCall: (_opts, handler) => handler }
})

vi.mock('firebase-admin/firestore', () => {
  const snapshot = path => ({
    id:     path.split('/').pop(),
    exists: db.docs.has(path),
    data:   () => structuredClone(db.docs.get(path)),
  })
  const ref = path => ({ path, id: path.split('/').pop(), get: async () => snapshot(path) })
  const collection = path => ({
    doc: id => ref(`${path}/${id ?? `auto${++db.autoId}`}`),
    add: async data => { if (path === 'audit_logs') db.audit.push(data) },
  })
  return {
    getFirestore: () => ({
      doc: ref,
      collection,
      runTransaction: async fn => {
        const writes = []
        const tx = {
          get:    async target => snapshot(target.path),
          set:    (target, data) => writes.push(() => db.docs.set(target.path, structuredClone(data))),
          update: (target, data) => writes.push(() => db.docs.set(target.path, { ...db.docs.get(target.path), ...structuredClone(data) })),
        }
        const result = await fn(tx)
        if (db.failCommit) throw new Error('commit fallito')
        writes.forEach(write => write())
        return result
      },
    }),
  }
})

const { registraInformativaPaziente } = await import('../src/callable/registraInformativaPaziente.js')
const { aggiungiValutazione }         = await import('../src/callable/aggiungiValutazione.js')
const { annullaValutazione }          = await import('../src/callable/annullaValutazione.js')
const { salvaBia }                    = await import('../src/callable/salvaBia.js')

const ORG     = 'organizations/org1'
const CLIENT  = `${ORG}/clients/c1`
const ASSESS  = `${CLIENT}/assessments`
const NOW     = new Date('2026-10-30T10:00:00Z')   // 11:00 a Roma
const NOTICE  = { informativaVersion: 'v2.1', deliveredAt: '2026-10-01', recordedBy: 'trainer1', recordedAt: '2026-10-01T09:00:00.000Z' }

const TWO_MWT = {
  testId:      'lipedema_2mwt',
  performedAt: '2026-10-30T10:30',
  setup:       { courseLengthM: 30, assistiveDevice: 'none' },
  trial:       { fullLengths: 4, partialDistanceM: 22 },
  events:      { stoppedEarly: false, pauseCount: 0 },
  clinical:    {},
  deviation:   { present: false },
}

const req = (uid, data) => ({ auth: { uid, token: { email: `${uid}@studio.it` } }, data: { orgId: 'org1', clientId: 'c1', ...data } })
const assessments = () => [...db.docs.entries()].filter(([path]) => path.startsWith(`${ASSESS}/`))
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

function seed({ moduleType = 'lipedema', privacyNotice = NOTICE } = {}) {
  db.docs = new Map([
    [ORG,              { moduleType, plan: 'free', clientCount: 1 }],
    [CLIENT,           { name: 'Anna Bianchi', dataNascita: '1985-03-12', eta: 41, clientAuthUid: null, ...(privacyNotice ? { privacyNotice } : {}) }],
    ['users/trainer1', { role: 'trainer',        orgId: 'org1', name: 'Dott.ssa Rossi' }],
    ['users/admin1',   { role: 'org_admin',      orgId: 'org1', name: 'Admin' }],
    ['users/staff1',   { role: 'staff_readonly', orgId: 'org1', name: 'Staff' }],
    ['users/other1',   { role: 'trainer',        orgId: 'org2', name: 'Altro' }],
  ])
  db.autoId     = 0
  db.audit      = []
  db.failCommit = false
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  seed()
})
afterEach(() => vi.useRealTimers())

describe('registraInformativaPaziente', () => {
  beforeEach(() => seed({ privacyNotice: null }))
  const call = (uid, data) => registraInformativaPaziente(req(uid, { informativaVersion: ' v2.1 ', deliveredAt: '2026-10-29', ...data }))

  it('scrive privacyNotice con recordedBy dal token, non dal client', async () => {
    const res = await call('trainer1', { recordedBy: 'falso' })
    expect(db.docs.get(CLIENT).privacyNotice).toEqual({
      informativaVersion: 'v2.1', deliveredAt: '2026-10-29',
      recordedBy: 'trainer1', recordedByName: 'Dott.ssa Rossi', recordedAt: NOW.toISOString(),
    })
    expect(res.privacyNotice.recordedBy).toBe('trainer1')
  })

  it('audit PRIVACY_NOTICE_RECORDED con soli id e versione', async () => {
    await call('admin1')
    await flush()
    expect(db.audit).toHaveLength(1)
    expect(db.audit[0]).toMatchObject({ action: 'PRIVACY_NOTICE_RECORDED' })
    expect(db.audit[0].details).toEqual({ orgId: 'org1', clientId: 'c1', informativaVersion: 'v2.1' })
    expect(JSON.stringify(db.audit[0])).not.toContain('Anna')
  })

  it('una nuova versione sovrascrive la precedente', async () => {
    await call('trainer1')
    await call('trainer1', { informativaVersion: 'v3', deliveredAt: '2026-10-30' })
    expect(db.docs.get(CLIENT).privacyNotice).toMatchObject({ informativaVersion: 'v3', deliveredAt: '2026-10-30' })
  })

  it.each([
    ['versione vuota',            { informativaVersion: '  ' }],
    ['versione oltre 40 caratteri', { informativaVersion: 'x'.repeat(41) }],
    ['data futura',               { deliveredAt: '2026-10-31' }],
    ['data prima della nascita',  { deliveredAt: '1980-01-01' }],
    ['data non valida',           { deliveredAt: '2026-02-30' }],
  ])('%s → invalid-argument, nessuna scrittura', async (_label, data) => {
    await expect(call('trainer1', data)).rejects.toMatchObject({ code: 'invalid-argument' })
    expect(db.docs.get(CLIENT).privacyNotice).toBeUndefined()
  })

  it('staff_readonly e membri di altre org rifiutati', async () => {
    await expect(call('staff1')).rejects.toMatchObject({ code: 'permission-denied' })
    await expect(call('other1')).rejects.toMatchObject({ code: 'permission-denied' })
    expect(db.docs.get(CLIENT).privacyNotice).toBeUndefined()
  })

  it.each(['personal_training', 'soccer_academy'])('modulo %s → failed-precondition', async (moduleType) => {
    seed({ moduleType, privacyNotice: null })
    await expect(call('trainer1')).rejects.toMatchObject({ code: 'failed-precondition' })
  })

  it('paziente inesistente → not-found', async () => {
    db.docs.delete(CLIENT)
    await expect(call('trainer1')).rejects.toMatchObject({ code: 'not-found' })
  })
})

describe('aggiungiValutazione — 2MWT', () => {
  const call = (uid, data) => aggiungiValutazione(req(uid, { tests: [TWO_MWT], ...data }))

  it('salva un doc con risultato calcolato dal server e campi server-side', async () => {
    const res = await call('trainer1')
    const [[, doc]] = assessments()
    expect(doc).toMatchObject({
      testId: 'lipedema_2mwt', protocolVersion: '1.0', performedAt: '2026-10-30T10:30',
      status: 'valid', outcome: 'complete',
      examinerId: 'trainer1', examinerName: 'Dott.ssa Rossi', createdBy: 'trainer1', createdAt: NOW.toISOString(),
      patientAgeYears: 41, supersedes: null, supersededBy: null, voidReason: null,
      setup:  { courseLengthM: 30, isStandardCourse: true, assistiveDevice: 'none', assistiveDeviceNote: null },
      trials: [{ seq: 1, side: null, valid: true, fullLengths: 4, partialDistanceM: 22, value: 142 }],
      result: { distanceM: 142, avgSpeedMs: 1.18, durationS: 120 },
      comparability: { protocolVersion: '1.0', courseLengthM: 30, assistiveDevice: 'none' },
      deviation: { present: false, note: null },
    })
    expect(doc.visitId).toEqual(expect.any(String))
    expect(res.assessments[0]).toMatchObject({ id: expect.any(String), result: { distanceM: 142 } })
  })

  it('ignora risultato, esaminatore e stato mandati dal client', async () => {
    await call('trainer1', { tests: [{ ...TWO_MWT, result: { distanceM: 999 }, examinerId: 'x', status: 'voided', createdAt: '2000-01-01' }] })
    const [[, doc]] = assessments()
    expect(doc).toMatchObject({ result: { distanceM: 142 }, examinerId: 'trainer1', status: 'valid', createdAt: NOW.toISOString() })
  })

  it('arrotonda al metro più vicino (mezzo metro per eccesso)', async () => {
    await call('trainer1', { tests: [{ ...TWO_MWT, setup: { courseLengthM: 15.3, assistiveDevice: 'none', variantConfirmed: true }, trial: { fullLengths: 7, partialDistanceM: 0.4 } }] })
    const [[, doc]] = assessments()
    expect(doc.result.distanceM).toBe(108)   // 107,5
    expect(doc.setup.isStandardCourse).toBe(false)
  })

  it('stop anticipato: outcome stopped_early, durata = tempo raggiunto, motivo in clinical', async () => {
    await call('trainer1', { tests: [{ ...TWO_MWT,
      trial: { fullLengths: 3, partialDistanceM: 6 },
      events: { stoppedEarly: true, stopTimeS: 85, pauseCount: 1, pauseDurationS: 10 },
      clinical: { stopReasonCode: 'dyspnea', painPre: 3, painPost: 5 },
    }] })
    const [[, doc]] = assessments()
    expect(doc.outcome).toBe('stopped_early')
    expect(doc.result).toEqual({ distanceM: 96, avgSpeedMs: 1.13, durationS: 85 })
    expect(doc.events).toEqual({ pauseCount: 1, pauseDurationS: 10, stopTimeS: 85 })
    expect(doc.clinical).toMatchObject({ painScale: 'nrs_0_10', painPre: 3, painPost: 5, stopReasonCode: 'dyspnea', hrPreBpm: null })
  })

  it.each([
    ['frazione ≥ lunghezza percorso', { trial: { fullLengths: 4, partialDistanceM: 30 } }],
    ['percorso ≤ 0',                  { setup: { courseLengthM: 0, assistiveDevice: 'none' } }],
    ['variante non confermata',       { setup: { courseLengthM: 20, assistiveDevice: 'none' } }],
    ['tratti non interi',             { trial: { fullLengths: 4.5, partialDistanceM: 0 } }],
    ['valori come stringhe',          { trial: { fullLengths: '4', partialDistanceM: 22 } }],
    ['data futura',                   { performedAt: '2026-10-30T12:00' }],
    ['stop senza motivo',             { events: { stoppedEarly: true, stopTimeS: 85, pauseCount: 0 } }],
    ['stop a 120 s',                  { events: { stoppedEarly: true, stopTimeS: 120, pauseCount: 0 }, clinical: { stopReasonCode: 'dyspnea' } }],
    ['pause senza durata',            { events: { stoppedEarly: false, pauseCount: 2 } }],
    ['deviazione senza descrizione',  { deviation: { present: true } }],
    ['PA sistolica ≤ diastolica',     { clinical: { bpSysPre: 80, bpDiaPre: 90 } }],
    ['Borg fuori passo 0,5',          { clinical: { dyspneaPre: 2.3 } }],
    ['test sconosciuto',              { testId: 'lipedema_6mwt' }],
  ])('%s → invalid-argument, nessuna scrittura', async (_label, override) => {
    await expect(call('trainer1', { tests: [{ ...TWO_MWT, ...override }] })).rejects.toMatchObject({ code: 'invalid-argument' })
    expect(assessments()).toEqual([])
  })

  it('senza informativa → failed-precondition con reason, nessuna scrittura', async () => {
    seed({ privacyNotice: null })
    await expect(call('trainer1')).rejects.toMatchObject({ code: 'failed-precondition', details: { reason: 'privacy_notice_missing' } })
    expect(assessments()).toEqual([])
  })

  it('staff_readonly e membri di altre org rifiutati', async () => {
    await expect(call('staff1')).rejects.toMatchObject({ code: 'permission-denied' })
    await expect(call('other1')).rejects.toMatchObject({ code: 'permission-denied' })
    expect(assessments()).toEqual([])
  })

  it.each(['personal_training', 'soccer_academy', 'sconosciuto'])('modulo %s → failed-precondition', async (moduleType) => {
    seed({ moduleType })
    await expect(call('trainer1')).rejects.toMatchObject({ code: 'failed-precondition' })
    expect(assessments()).toEqual([])
  })

  it('senza data di nascita: patientAgeYears null, niente stima dall\'età di creazione (M2)', async () => {
    db.docs.set(CLIENT, { ...db.docs.get(CLIENT), dataNascita: null, eta: 30 })
    await call('trainer1')
    const [[, doc]] = assessments()
    expect(doc.patientAgeYears).toBeNull()
  })

  it.each([
    ['test null',               [null]],
    ['test non oggetto',        ['lipedema_2mwt']],
    ['testId mancante',         [{ ...TWO_MWT, testId: undefined }]],
    ['tests non array',         'lipedema_2mwt'],
  ])('%s → invalid-argument (mai internal), prima di leggere il paziente (L1)', async (_label, tests) => {
    db.docs.delete(CLIENT)   // se arrivasse alla transazione sarebbe not-found
    await expect(call('trainer1', { tests })).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('input non valido rifiutato prima della transazione (L1)', async () => {
    db.docs.delete(CLIENT)
    await expect(call('trainer1', { tests: [{ ...TWO_MWT, trial: { fullLengths: -1, partialDistanceM: 0 } }] }))
      .rejects.toMatchObject({ code: 'invalid-argument', details: { fields: { 'trial.fullLengths': expect.any(String) } } })
  })

  it('visita: 0 test, più di 5 o test duplicati rifiutati', async () => {
    await expect(call('trainer1', { tests: [] })).rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(call('trainer1', { tests: Array(6).fill(TWO_MWT) })).rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(call('trainer1', { tests: [TWO_MWT, TWO_MWT] })).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('nessun XP, log o notifica sul paziente', async () => {
    const prima = structuredClone(db.docs.get(CLIENT))
    await call('trainer1')
    expect(db.docs.get(CLIENT)).toEqual(prima)
    expect([...db.docs.keys()].some(path => path.includes('/notifications/'))).toBe(false)
  })
})

describe('aggiungiValutazione — 30s-STS (STORY-035)', () => {
  const STS = {
    testId:      'lipedema_30s_sts',
    performedAt: '2026-10-30T10:30',
    setup:       { chairHeightCm: 43.2, chairHasArmrests: false, armsCrossed: true },
    trial:       { completeRepetitions: 14, partialRepCounted: true },
    events:      { usedArms: false, stoppedEarly: false, technicalError: false, familiarizationDone: true, pauseCount: 0 },
    clinical:    {},
    deviation:   { present: false },
  }
  const call = test => aggiungiValutazione(req('trainer1', { tests: [test] }))

  it('ripetizioni calcolate dal server (14 + parziale = 15), comparabilità della sedia', async () => {
    await call({ ...STS, result: { repetitions: 60 } })
    const [[, doc]] = assessments()
    expect(doc).toMatchObject({
      testId: 'lipedema_30s_sts', outcome: 'complete', status: 'valid',
      result: { repetitions: 15, durationS: 30 },
      trials: [{ seq: 1, side: null, valid: true, invalidReason: null, completeRepetitions: 14, partialRepCounted: true, value: 15 }],
      comparability: { protocolVersion: '1.0', chairHeightCm: 43.2, chairHasArmrests: false, armsCrossed: true },
    })
    expect(doc.clinical).not.toHaveProperty('hrPreBpm')
  })

  it('uso delle braccia: 0 con outcome invalidated, distinto da uno 0 reale', async () => {
    await call({ ...STS, trial: { completeRepetitions: 5, partialRepCounted: false }, events: { ...STS.events, usedArms: true } })
    await call({ ...STS, testId: 'lipedema_30s_sts', performedAt: '2026-10-30T10:40', trial: { completeRepetitions: 0, partialRepCounted: false } })
    const docs = assessments().map(([, doc]) => doc)
    expect(docs.map(doc => [doc.outcome, doc.result.repetitions])).toEqual([['invalidated', 0], ['complete', 0]])
    expect(docs[0].trials[0]).toMatchObject({ valid: false, invalidReason: 'used_arms', completeRepetitions: 5 })
  })

  it.each([
    ['uso braccia + stop',         { events: { ...STS.events, usedArms: true, stoppedEarly: true, stopTimeS: 10 }, clinical: { stopReasonCode: 'dizziness' } }],
    ['parziale con stop',          { events: { ...STS.events, stoppedEarly: true, stopTimeS: 20 }, clinical: { stopReasonCode: 'dyspnea' } }],
    ['sedia variante non confermata', { setup: { ...STS.setup, chairHeightCm: 46 } }],
    ['braccioli senza deviazione', { setup: { ...STS.setup, chairHasArmrests: true } }],
    ['errore tecnico senza descrizione', { events: { ...STS.events, technicalError: true } }],
    ['ripetizioni non intere',     { trial: { completeRepetitions: 14.5, partialRepCounted: false } }],
  ])('%s → invalid-argument, nessuna scrittura', async (_label, override) => {
    await expect(call({ ...STS, ...override })).rejects.toMatchObject({ code: 'invalid-argument' })
    expect(assessments()).toEqual([])
  })
})

describe('aggiungiValutazione — Handgrip (STORY-036)', () => {
  const grip = (side, nativeValue, extra = {}) => ({ side, valid: true, nativeValue, ...extra })
  const numbered = trials => trials.map((trial, i) => ({ seq: i + 1, ...trial }))
  const SIX = [grip('R', 30), grip('L', 28), grip('R', 31.5), grip('L', 27), grip('R', 29), grip('L', 28.25)]
  const HANDGRIP = {
    testId:      'lipedema_handgrip',
    performedAt: '2026-10-30T10:30',
    setup:       { dominantSide: 'R', device: { brand: 'Jamar ', model: 'Plus+' }, gripSetting: 'Posizione 2', nativeUnit: 'kgf' },
    trials:      numbered(SIX),
    events:      { stoppedEarly: false },
    clinical:    {},
    deviation:   { present: false },
  }
  const call = test => aggiungiValutazione(req('trainer1', { tests: [test] }))

  it('kgf convertiti in N dal server senza arrotondare, best/simmetria calcolati, dolore per lato derivato', async () => {
    const trials = numbered([...SIX.slice(0, 5), grip('L', 28.25, { pain: 3 })])
    await call({ ...HANDGRIP, trials: trials.map(trial => ({ ...trial, value: 1 })), result: { bestBySide: { R: 1, L: 1 } } })
    const [[, doc]] = assessments()
    expect(doc.trials[2]).toMatchObject({ nativeValue: 31.5, nativeUnit: 'kgf', value: 31.5 * 9.80665 })
    expect(doc.result).toMatchObject({
      unit: 'N', sideStatus: { R: 'complete', L: 'complete' },
      bestBySide: { R: 31.5 * 9.80665, L: 28.25 * 9.80665 }, strongestSide: 'R',
      symmetryPct: (28.25 * 9.80665) / (31.5 * 9.80665) * 100,
    })
    expect(doc.clinical.painMaxBySide).toEqual({ R: null, L: 3 })
    expect(doc.comparability).toEqual({ protocolVersion: '1.0', deviceModelKey: 'jamar|plus+', gripSettingKey: 'posizione 2', deviceSerialKey: null })
    expect(doc.setup.dominantSide).toBe('R')
  })

  it('interruzione con un lato incompleto: salvato, best solo sul lato completo', async () => {
    await call({
      ...HANDGRIP, trials: numbered([grip('R', 30), grip('L', 28), grip('R', 31), grip('L', null, { valid: false, invalidReason: 'technique_error' }), grip('R', 29)]),
      events: { stoppedEarly: true }, clinical: { stopReasonCode: 'acute_pain' },
    })
    const [[, doc]] = assessments()
    expect(doc).toMatchObject({ outcome: 'stopped_early', clinical: { stopReasonCode: 'acute_pain' } })
    expect(doc.result).toMatchObject({ sideStatus: { R: 'complete', L: 'incomplete' }, bestBySide: { R: 31 * 9.80665, L: null }, symmetryPct: null })
  })

  it.each([
    ['lato incompleto senza stop',   { trials: numbered(SIX.slice(0, 5)) }],
    ['quarta prova valida',          { trials: numbered([...SIX, grip('R', 33)]) }],
    ['motivo di stop del 2MWT',      { trials: numbered(SIX.slice(0, 5)), events: { stoppedEarly: true }, clinical: { stopReasonCode: 'chest_pain' } }],
    ['prova non valida senza motivo', { trials: numbered([grip('R', null, { valid: false }), ...SIX]) }],
    ['oltre il massimo plausibile',  { trials: numbered([grip('R', 200), ...SIX.slice(1)]) }],
    ['marca mancante',               { setup: { ...HANDGRIP.setup, device: { model: 'Plus+' } } }],
    ['lato dominante mancante',      { setup: { ...HANDGRIP.setup, dominantSide: null } }],
    ['troppe prove',                 { trials: numbered(Array(13).fill(grip('R', 30))) }],
  ])('%s → invalid-argument, nessuna scrittura', async (_label, override) => {
    await expect(call({ ...HANDGRIP, ...override })).rejects.toMatchObject({ code: 'invalid-argument' })
    expect(assessments()).toEqual([])
  })

  it('stessa visita: 2MWT + 30s-STS + Handgrip in un solo visitId', async () => {
    const sts = {
      testId: 'lipedema_30s_sts', performedAt: '2026-10-30T10:30',
      setup: { chairHeightCm: 43.2, chairHasArmrests: false, armsCrossed: true },
      trial: { completeRepetitions: 12, partialRepCounted: false },
      events: { usedArms: false, stoppedEarly: false, technicalError: false, familiarizationDone: false, pauseCount: 0 },
      clinical: {}, deviation: { present: false },
    }
    await aggiungiValutazione(req('trainer1', { tests: [TWO_MWT, sts, HANDGRIP] }))
    const docs = assessments().map(([, doc]) => doc)
    expect(docs.map(doc => doc.testId)).toEqual(['lipedema_2mwt', 'lipedema_30s_sts', 'lipedema_handgrip'])
    expect(new Set(docs.map(doc => doc.visitId)).size).toBe(1)
  })
})

describe('aggiungiValutazione — correzione (supersedes)', () => {
  const OLD = `${ASSESS}/old1`
  beforeEach(() => {
    db.docs.set(OLD, { testId: 'lipedema_2mwt', status: 'valid', visitId: 'visitOld', result: { distanceM: 150 } })
  })
  const correct = (data) => aggiungiValutazione(req('trainer1', { tests: [TWO_MWT], supersedes: 'old1', voidReason: 'Tratti contati male', ...data }))

  it('annulla la vecchia e salva la nuova nella stessa transazione, collegate', async () => {
    const res = await correct()
    const newId = res.assessments[0].id
    expect(db.docs.get(OLD)).toMatchObject({
      status: 'voided', voidReason: 'Tratti contati male', voidedBy: 'trainer1', voidedByName: 'Dott.ssa Rossi', voidedAt: NOW.toISOString(), supersededBy: newId,
    })
    expect(db.docs.get(`${ASSESS}/${newId}`)).toMatchObject({ status: 'valid', supersedes: 'old1' })
  })

  it('la correzione resta nella stessa visita della valutazione sostituita (L2)', async () => {
    const res = await correct()
    expect(res.assessments[0].visitId).toBe('visitOld')
  })

  it('se il commit fallisce non resta né l\'annullamento né la nuova', async () => {
    db.failCommit = true
    await expect(correct()).rejects.toThrow('commit fallito')
    expect(db.docs.get(OLD).status).toBe('valid')
    expect(assessments()).toHaveLength(1)
  })

  it('audit ASSESSMENT_VOIDED con soli identificativi, senza motivo né valori', async () => {
    await correct()
    await flush()
    expect(db.audit).toHaveLength(1)
    expect(db.audit[0]).toMatchObject({ action: 'ASSESSMENT_VOIDED' })
    expect(db.audit[0].details).toEqual({ orgId: 'org1', clientId: 'c1', assessmentId: 'old1', testId: 'lipedema_2mwt' })
    expect(JSON.stringify(db.audit[0])).not.toContain('Tratti')
  })

  it.each([
    ['motivo mancante',       { voidReason: '  ' },                       'invalid-argument'],
    ['motivo oltre 500',      { voidReason: 'x'.repeat(501) },           'invalid-argument'],
    ['valutazione inesistente', { supersedes: 'nope' },                  'not-found'],
    ['id non valido',         { supersedes: 'a/b' },                      'invalid-argument'],
    ['più test',              { tests: [TWO_MWT, { ...TWO_MWT, testId: 'altro' }] }, 'invalid-argument'],
  ])('%s → %s, nulla cambia', async (_label, data, code) => {
    await expect(correct(data)).rejects.toMatchObject({ code })
    expect(db.docs.get(OLD).status).toBe('valid')
    expect(assessments()).toHaveLength(1)
  })

  it('una valutazione già annullata non si corregge di nuovo', async () => {
    db.docs.set(OLD, { testId: 'lipedema_2mwt', status: 'voided' })
    await expect(correct()).rejects.toMatchObject({ code: 'failed-precondition' })
    expect(assessments()).toHaveLength(1)
  })

  it('test diverso da quello sostituito → invalid-argument', async () => {
    db.docs.set(OLD, { testId: 'lipedema_30s_sts', status: 'valid' })
    await expect(correct()).rejects.toMatchObject({ code: 'invalid-argument' })
  })
})

describe('annullaValutazione', () => {
  const DOC = `${ASSESS}/a1`
  beforeEach(() => db.docs.set(DOC, { testId: 'lipedema_2mwt', status: 'valid', result: { distanceM: 142 } }))
  const call = (uid, data) => annullaValutazione(req(uid, { assessmentId: 'a1', voidReason: ' Paziente sbagliato ', ...data }))

  it('stato voided con motivo, autore e data dal server; il resto immutato', async () => {
    await call('admin1')
    expect(db.docs.get(DOC)).toEqual({
      testId: 'lipedema_2mwt', result: { distanceM: 142 },
      status: 'voided', voidReason: 'Paziente sbagliato', voidedBy: 'admin1', voidedByName: 'Admin', voidedAt: NOW.toISOString(),
    })
    await flush()
    expect(db.audit[0]).toMatchObject({ action: 'ASSESSMENT_VOIDED', details: { orgId: 'org1', clientId: 'c1', assessmentId: 'a1', testId: 'lipedema_2mwt' } })
  })

  it('già annullata → failed-precondition', async () => {
    await call('trainer1')
    await expect(call('trainer1')).rejects.toMatchObject({ code: 'failed-precondition' })
  })

  it('motivo obbligatorio', async () => {
    await expect(call('trainer1', { voidReason: '' })).rejects.toMatchObject({ code: 'invalid-argument' })
    expect(db.docs.get(DOC).status).toBe('valid')
  })

  it('staff_readonly rifiutato', async () => {
    await expect(call('staff1')).rejects.toMatchObject({ code: 'permission-denied' })
    expect(db.docs.get(DOC).status).toBe('valid')
  })

  it('modulo senza valutazioni → failed-precondition', async () => {
    seed({ moduleType: 'personal_training' })
    db.docs.set(DOC, { testId: 'lipedema_2mwt', status: 'valid' })
    await expect(call('trainer1')).rejects.toMatchObject({ code: 'failed-precondition' })
  })

  it('valutazione inesistente → not-found', async () => {
    await expect(call('trainer1', { assessmentId: 'nope' })).rejects.toMatchObject({ code: 'not-found' })
  })
})

describe('salvaBia — informativa nelle org lipedema', () => {
  const BIA = { fatMassPercent: 30, muscleMassKg: 40, waterPercent: 50, visceralFat: 5 }

  it('senza informativa → failed-precondition, BIA non salvata', async () => {
    seed({ privacyNotice: null })
    await expect(salvaBia(req('trainer1', { biaData: BIA }))).rejects.toMatchObject({ code: 'failed-precondition', details: { reason: 'privacy_notice_missing' } })
    expect(db.docs.get(CLIENT).lastBia).toBeUndefined()
  })

  it('con informativa → salvata', async () => {
    await expect(salvaBia(req('trainer1', { biaData: BIA }))).resolves.toMatchObject({ ok: true, xpEarned: 0 })
    expect(db.docs.get(CLIENT).lastBia).toMatchObject(BIA)
  })

  it('PT: nessun requisito di informativa (invariato)', async () => {
    seed({ moduleType: 'personal_training', privacyNotice: null })
    db.docs.set(CLIENT, { ...db.docs.get(CLIENT), xp: 0, xpNext: 500, level: 1, log: [], profileType: 'complete', biaHistory: [], lastBia: null })
    await expect(salvaBia(req('trainer1', { biaData: BIA }))).resolves.toMatchObject({ ok: true })
  })
})
