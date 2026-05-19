import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyBDkh888nUoJYf8gXo2BSGEKtSZYope89s",
  authDomain: "portaria-light.firebaseapp.com",
  projectId: "portaria-light",
  storageBucket: "portaria-light.firebasestorage.app",
  messagingSenderId: "319593860990",
  appId: "1:319593860990:web:e002c7289ac5fba34bed2f"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
