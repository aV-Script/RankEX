/**
 * Script per creare l'utenza trainer di test.
 * Esegui una sola volta dal terminale nella cartella del progetto:
 *
 *   node create-test-user.js
 *
 * Richiede: npm install firebase (già installato nel progetto)
 */

import { initializeApp }             from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyABkp7d91Wb2JG0SsJzDIhrceH_cma0Qc0",
  authDomain:        "fitquest-60a09.firebaseapp.com",
  projectId:         "fitquest-60a09",
  storageBucket:     "fitquest-60a09.firebasestorage.app",
  messagingSenderId: "684894217887",
  appId:             "1:684894217887:web:685adbbd3b67254de3e4aa",
}

const TEST_EMAIL    = "trainer@fitquest.test"
const TEST_PASSWORD = "Trainer01"  // cambiare dopo il primo accesso

const app  = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db   = getFirestore(app)

try {
  const cred = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD)
  await setDoc(doc(db, 'users', cred.user.uid), {
    role:    'trainer',
    email:   TEST_EMAIL,
    createdAt: new Date().toISOString(),
  })
  console.log('✓ Utenza trainer creata con successo')
  console.log('  Email:    ', TEST_EMAIL)
  console.log('  Password: ', TEST_PASSWORD)
  console.log('  UID:      ', cred.user.uid)
  process.exit(0)
} catch (err) {
  if (err.code === 'auth/email-already-in-use') {
    console.log('ℹ Utenza già esistente:', TEST_EMAIL)
  } else {
    console.error('✗ Errore:', err.message)
  }
  process.exit(1)
}
