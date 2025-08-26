"use client";

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration (values are public for web apps)
// Read from environment variables so they aren't hardcoded in the repo.
const firebaseConfig = {
  apiKey: "AIzaSyBxDEMYL3s8nLIV2Dr8QUx6T5IfwRisq0k",
  authDomain: "headline-optimizer-p2nj8.firebaseapp.com",
  projectId: "headline-optimizer-p2nj8",
  storageBucket: "headline-optimizer-p2nj8.appspot.com",
  messagingSenderId: "723703406264",
  appId: "1:723703406264:web:96960abb5c2b5bd4951e4d"
};

// Initialize Firebase (guard against re-initialization in client HMR)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Export Auth and Firestore instances for app-wide use
export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };