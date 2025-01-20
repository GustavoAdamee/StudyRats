// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyClJadxkkWMJBm8nvZ05faWFpOOOo0p2Dc",
  authDomain: "study-rats.firebaseapp.com",
  projectId: "study-rats",
  storageBucket: "study-rats.firebasestorage.app",
  messagingSenderId: "468157495424",
  appId: "1:468157495424:web:ea338a6064d712afff8e65"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_DB = getFirestore(FIREBASE_APP);