import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyABkp7d91Wb2JG0SsJzDIhrceH_cma0Qc0",
  authDomain: "fitquest-60a09.firebaseapp.com",
  projectId: "fitquest-60a09",
  storageBucket: "fitquest-60a09.firebasestorage.app",
  messagingSenderId: "684894217887",
  appId: "1:684894217887:web:685adbbd3b67254de3e4aa",
  measurementId: "G-GC1WDBJXVH"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
