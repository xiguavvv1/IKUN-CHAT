import {
  createUserWithEmailAndPassword,//Register using your email address and password
  onAuthStateChanged,//Monitor changes in user login status
  signInWithEmailAndPassword,//Log in with your email address and password
  signOut//Log out
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

//Create or read user profiles
export async function ensureUserProfile(user, extra = {}) {
  const profileRef = doc(db, 'profiles', user.uid)
  const profileSnap = await getDoc(profileRef)

  if (profileSnap.exists()) {
    return { uid: user.uid, ...profileSnap.data() }//Return Auth user + Profile
  }

  const profile = {
    uid: user.uid,
    email: user.email,
    displayName:
        extra.displayName || user.email?.split('@')[0] || 'IKUN User',

    //The default is “user”
    role: extra.role || 'user',

    createdAt: serverTimestamp()
  }

  await setDoc(profileRef, profile)
  return profile
}

//Register a new user with email and password
export async function registerUser({ displayName, email, password }) {
  const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
  )
//Ensure user profile exists in Firestore
  const profile = await ensureUserProfile(credential.user, {
    displayName
  })

  return { user: credential.user, profile }
}

//Authenticate user with email and password
export async function loginUser({ email, password }) {
  const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password
  )

  const profile = await ensureUserProfile(credential.user)
  return { user: credential.user, profile }
}

//Get current user profile (ensure it exists in Firestore)
export async function loadCurrentProfile() {
  const user = auth.currentUser
  if (!user) return null
  return ensureUserProfile(user)
}

//Determine landing page based on user role
export async function resolveLandingPage(profile) {
  if (profile?.role === 'admin') {
    return '/admin'
  }
  return '/chat'
}

//Sign out current user
export async function logoutUser() {
  await signOut(auth)
}

//Wait for Firebase auth to resolve current user state
let authReadyPromise
export function waitForAuthReady() {
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve) => {
      const off = onAuthStateChanged(auth, () => {
        off()
        resolve(auth.currentUser)
      })
    })
  }

  return authReadyPromise
}