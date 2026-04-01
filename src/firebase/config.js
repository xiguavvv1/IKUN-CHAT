import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAQhO_3eqDxFPw9X4tVgE3EZ6WQVOEK27Y",
  authDomain: "ikun-chat.firebaseapp.com",
  projectId: "ikun-chat",
  storageBucket: "ikun-chat.firebasestorage.app",
  messagingSenderId: "4172119083",
  appId: "1:4172119083:web:8cf0be5ae472db76e37e6e"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { app, auth, db }