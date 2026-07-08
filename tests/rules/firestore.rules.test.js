/**
 * Test sulle Firestore Rules — copre gli invarianti che nella storia del progetto
 * hanno già avuto bug reali (vedi commit "fix: hardening ..." su clientCount,
 * memberCount, escalation di ruolo, rollback createClientUseCase) più l'isolamento
 * multi-tenant di base. Gira contro l'emulatore Firestore, non contro il progetto
 * reale — nessun dato di rankex-dev viene toccato.
 *
 * Esecuzione: npm run test:rules  (avvia l'emulatore e poi lancia questi test)
 */
import { readFileSync } from 'fs'
import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest'
import {
  initializeTestEnvironment, assertSucceeds, assertFails,
} from '@firebase/rules-unit-testing'
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc,
} from 'firebase/firestore'

const PROJECT_ID = 'demo-rankex-rules-test'

let testEnv

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host:  '127.0.0.1',
      port:  8180,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()

    // Org1 — free plan, già al limite clienti per i test sui limiti
    await setDoc(doc(db, 'organizations/org1'), {
      name: 'Org Uno', plan: 'free', memberCount: 1, clientCount: 1,
    })
    // Org2 — per i test di isolamento multi-tenant
    await setDoc(doc(db, 'organizations/org2'), {
      name: 'Org Due', plan: 'free', memberCount: 1, clientCount: 0,
    })

    // Membri org1
    await setDoc(doc(db, 'organizations/org1/members/admin1'), { role: 'org_admin', name: 'Admin Uno' })
    await setDoc(doc(db, 'organizations/org1/members/trainer1'), { role: 'trainer', name: 'Trainer Uno' })
    await setDoc(doc(db, 'organizations/org1/members/staff1'), { role: 'staff_readonly', name: 'Staff Uno' })
    // Membri org2
    await setDoc(doc(db, 'organizations/org2/members/admin2'), { role: 'org_admin', name: 'Admin Due' })

    // Profili utente (/users/{uid}) — usati da userProfile()/memberRole()
    await setDoc(doc(db, 'users/admin1'),   { role: 'org_admin', orgId: 'org1' })
    await setDoc(doc(db, 'users/trainer1'), { role: 'trainer',   orgId: 'org1' })
    await setDoc(doc(db, 'users/staff1'),   { role: 'staff_readonly', orgId: 'org1' })
    await setDoc(doc(db, 'users/admin2'),   { role: 'org_admin', orgId: 'org2' })
    await setDoc(doc(db, 'users/clientUser1'), {
      role: 'client', orgId: 'org1', clientId: 'client1', mustChangePassword: false,
    })
    await setDoc(doc(db, 'users/superadmin1'), { role: 'super_admin' })

    // Cliente in org1, con nota root del trainer
    await setDoc(doc(db, 'organizations/org1/clients/client1'), {
      name: 'Cliente Uno', xp: 100, level: 1,
    })
    await setDoc(doc(db, 'organizations/org1/clients/client1/notes/rootNote'), {
      text: 'Nota trainer', authorId: 'trainer1', authorRole: 'trainer', parentId: null,
    })
  })
})

function ctxFor(uid) { return testEnv.authenticatedContext(uid) }

// ── Isolamento multi-tenant ──────────────────────────────────────────────────
describe('Isolamento multi-tenant', () => {
  it('un trainer di org1 non può leggere organizations/org2', async () => {
    const db = ctxFor('trainer1').firestore()
    await assertFails(getDoc(doc(db, 'organizations/org2')))
  })

  it('un trainer di org1 non può leggere i clienti di org2', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'organizations/org2/clients/clientX'), { name: 'Cliente Due' })
    })
    const db = ctxFor('trainer1').firestore()
    await assertFails(getDoc(doc(db, 'organizations/org2/clients/clientX')))
  })

  it('un client legge il proprio org ma non un org diverso', async () => {
    const db = ctxFor('clientUser1').firestore()
    await assertSucceeds(getDoc(doc(db, 'organizations/org1')))
    await assertFails(getDoc(doc(db, 'organizations/org2')))
  })
})

// ── users/{uid} — mustChangePassword self-service ────────────────────────────
describe('users/{uid} — mustChangePassword', () => {
  it('un utente può azzerare il proprio mustChangePassword', async () => {
    const db = ctxFor('clientUser1').firestore()
    await assertSucceeds(updateDoc(doc(db, 'users/clientUser1'), { mustChangePassword: false }))
  })

  it('un utente NON può reimpostare il proprio mustChangePassword a true', async () => {
    const db = ctxFor('clientUser1').firestore()
    await assertFails(updateDoc(doc(db, 'users/clientUser1'), { mustChangePassword: true }))
  })

  it('un utente NON può modificare il proprio role', async () => {
    const db = ctxFor('clientUser1').firestore()
    await assertFails(updateDoc(doc(db, 'users/clientUser1'), { role: 'org_admin' }))
  })
})

// ── Escalation di ruolo (isOrgAdminForMember) ────────────────────────────────
describe('Escalation di ruolo', () => {
  it('org_admin può cambiare il role di un proprio membro tra i valori ammessi', async () => {
    const db = ctxFor('admin1').firestore()
    await assertSucceeds(updateDoc(doc(db, 'users/trainer1'), { role: 'staff_readonly' }))
  })

  it('org_admin NON può promuovere un membro a super_admin', async () => {
    const db = ctxFor('admin1').firestore()
    await assertFails(updateDoc(doc(db, 'users/trainer1'), { role: 'super_admin' }))
  })

  it('org_admin NON può cambiare role insieme ad altri campi nello stesso update', async () => {
    const db = ctxFor('admin1').firestore()
    await assertFails(updateDoc(doc(db, 'users/trainer1'), { role: 'staff_readonly', orgId: 'org2' }))
  })

  it('org_admin di org1 non può toccare i membri di org2', async () => {
    const db = ctxFor('admin1').firestore()
    await assertFails(updateDoc(doc(db, 'users/admin2'), { role: 'trainer' }))
  })
})

// ── Falsificazione counter (memberCount / clientCount) ───────────────────────
describe('Counter memberCount/clientCount', () => {
  it('org_admin può incrementare memberCount di 1', async () => {
    const db = ctxFor('admin1').firestore()
    await assertSucceeds(updateDoc(doc(db, 'organizations/org1'), { memberCount: 2 }))
  })

  it('org_admin NON può incrementare memberCount di più di 1 in un colpo solo', async () => {
    const db = ctxFor('admin1').firestore()
    await assertFails(updateDoc(doc(db, 'organizations/org1'), { memberCount: 3 }))
  })

  it('org_admin NON può impostare memberCount negativo', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'organizations/org1'), { memberCount: 0 })
    })
    const db = ctxFor('admin1').firestore()
    await assertFails(updateDoc(doc(db, 'organizations/org1'), { memberCount: -1 }))
  })

  it('org_admin NON può modificare memberCount insieme ad altri campi nello stesso update', async () => {
    const db = ctxFor('admin1').firestore()
    await assertFails(updateDoc(doc(db, 'organizations/org1'), { memberCount: 2, name: 'Nome falsificato' }))
  })

  it('un trainer (non org_admin) può aggiornare clientCount di ±1', async () => {
    const db = ctxFor('trainer1').firestore()
    await assertSucceeds(updateDoc(doc(db, 'organizations/org1'), { clientCount: 2 }))
  })

  it('un trainer (non org_admin) non può toccare memberCount', async () => {
    const db = ctxFor('trainer1').firestore()
    await assertFails(updateDoc(doc(db, 'organizations/org1'), { memberCount: 2 }))
  })
})

// ── Limiti piano ──────────────────────────────────────────────────────────────
describe('Limiti piano', () => {
  it('creare un cliente quando clientCount è già al limite free (10) fallisce', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'organizations/org1'), { clientCount: 10 })
    })
    const db = ctxFor('trainer1').firestore()
    await assertFails(setDoc(doc(db, 'organizations/org1/clients/nuovoCliente'), { name: 'Nuovo' }))
  })

  it('creare un cliente sotto al limite riesce', async () => {
    const db = ctxFor('trainer1').firestore()
    await assertSucceeds(setDoc(doc(db, 'organizations/org1/clients/nuovoCliente'), { name: 'Nuovo' }))
  })

  it('creare un membro quando memberCount è già al limite free (1) fallisce', async () => {
    const db = ctxFor('admin1').firestore()
    await assertFails(setDoc(doc(db, 'organizations/org1/members/trainer2'), { role: 'trainer' }))
  })
})

// ── Note — client crea solo commenti ─────────────────────────────────────────
describe('Note del cliente', () => {
  it('il client NON può creare una nota root (parentId null)', async () => {
    const db = ctxFor('clientUser1').firestore()
    await assertFails(addDoc(collection(db, 'organizations/org1/clients/client1/notes'), {
      text: 'Tentativo di nota root', authorId: 'clientUser1', parentId: null,
    }))
  })

  it('il client può creare un commento (parentId != null) a proprio nome', async () => {
    const db = ctxFor('clientUser1').firestore()
    await assertSucceeds(addDoc(collection(db, 'organizations/org1/clients/client1/notes'), {
      text: 'Risposta cliente', authorId: 'clientUser1', parentId: 'rootNote',
    }))
  })

  it('il client NON può creare un commento a nome di qualcun altro', async () => {
    const db = ctxFor('clientUser1').firestore()
    await assertFails(addDoc(collection(db, 'organizations/org1/clients/client1/notes'), {
      text: 'Spoofing', authorId: 'trainer1', parentId: 'rootNote',
    }))
  })

  it('il client NON può eliminare la nota del trainer', async () => {
    const db = ctxFor('clientUser1').firestore()
    await assertFails(deleteDoc(doc(db, 'organizations/org1/clients/client1/notes/rootNote')))
  })

  it('il trainer può eliminare qualsiasi nota del cliente', async () => {
    const db = ctxFor('trainer1').firestore()
    await assertSucceeds(deleteDoc(doc(db, 'organizations/org1/clients/client1/notes/rootNote')))
  })
})

// ── Client — self-update ristretto ───────────────────────────────────────────
describe('Client self-update', () => {
  it('il client può aggiornare il proprio campo avatar', async () => {
    const db = ctxFor('clientUser1').firestore()
    await assertSucceeds(updateDoc(doc(db, 'organizations/org1/clients/client1'), { avatar: { hat: 'red' } }))
  })

  it('il client NON può modificare il proprio xp', async () => {
    const db = ctxFor('clientUser1').firestore()
    await assertFails(updateDoc(doc(db, 'organizations/org1/clients/client1'), { xp: 999999 }))
  })
})

// ── Audit log — append-only ───────────────────────────────────────────────────
describe('Audit log', () => {
  it('un utente autenticato qualsiasi può creare un audit log', async () => {
    const db = ctxFor('trainer1').firestore()
    await assertSucceeds(addDoc(collection(db, 'audit_logs'), { action: 'LOGIN', uid: 'trainer1' }))
  })

  it('un utente non autenticato non può creare un audit log', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(addDoc(collection(db, 'audit_logs'), { action: 'LOGIN' }))
  })

  it('un trainer non può leggere gli audit log', async () => {
    let logId
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const ref = await addDoc(collection(ctx.firestore(), 'audit_logs'), { action: 'LOGIN' })
      logId = ref.id
    })
    const db = ctxFor('trainer1').firestore()
    await assertFails(getDoc(doc(db, 'audit_logs', logId)))
  })

  it('nessuno può modificare un audit log esistente, nemmeno super_admin', async () => {
    let logId
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const ref = await addDoc(collection(ctx.firestore(), 'audit_logs'), { action: 'LOGIN' })
      logId = ref.id
    })
    const db = ctxFor('superadmin1').firestore()
    await assertFails(updateDoc(doc(db, 'audit_logs', logId), { action: 'MODIFICATO' }))
  })
})

// ── staff_readonly — sola lettura ────────────────────────────────────────────
describe('staff_readonly', () => {
  it('staff_readonly può leggere i clienti dell\'org', async () => {
    const db = ctxFor('staff1').firestore()
    await assertSucceeds(getDoc(doc(db, 'organizations/org1/clients/client1')))
  })

  it('staff_readonly NON può creare uno slot', async () => {
    const db = ctxFor('staff1').firestore()
    await assertFails(addDoc(collection(db, 'organizations/org1/slots'), {
      date: '2026-08-01', startTime: '09:00', clientIds: ['client1'],
    }))
  })

  it('staff_readonly NON può modificare un cliente', async () => {
    const db = ctxFor('staff1').firestore()
    await assertFails(updateDoc(doc(db, 'organizations/org1/clients/client1'), { name: 'Modificato' }))
  })
})
