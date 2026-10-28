import { initializeApp } from "firebase/app";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Register using email and password
export async function signupwithemailandpassword(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

// Login using email and password
export async function loginwithemailandpassword(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Existing email login helper
export async function signinAuthUserWithEmailAndPasword(email, password) {
  if (!email || !password) return;

  return signInWithEmailAndPassword(auth, email, password);
}

// Create a user profile in Firestore if it does not exist
export async function createUserDoc(userAuth, otherinfo = {}) {
  if (!userAuth) return;

  const userDocRef = doc(db, "users", userAuth.uid);
  const userSnapshot = await getDoc(userDocRef);

  if (!userSnapshot.exists()) {
    await setDoc(userDocRef, {
      displayName: userAuth.displayName || "",
      email: userAuth.email || "",
      createdat: new Date(),
      ...otherinfo
    });
  }

  return userDocRef;
}
