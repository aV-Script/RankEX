// Istanza Firestore condivisa — importata dagli altri moduli firebase/
import { getFirestore } from 'firebase/firestore'
import app from './config'

export const db = getFirestore(app)
