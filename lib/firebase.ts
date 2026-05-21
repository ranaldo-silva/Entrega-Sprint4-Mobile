import { initializeApp, getApps } from "firebase/app";
// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const firebaseConfig = {
  apiKey: "AIzaSyBDkh888nUoJYf8gXo2BSGEKtSZYope89s",
  authDomain: "portaria-light.firebaseapp.com",
  projectId: "portaria-light",
  storageBucket: "portaria-light.firebasestorage.app",
  messagingSenderId: "319593860990",
  appId: "1:319593860990:web:e002c7289ac5fba34bed2f"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getApps().length === 0
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  : getAuth(app);

export const db = getFirestore(app);
