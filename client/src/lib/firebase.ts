import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCznVOpLVoS_f_byFrGEUSkyqEZichBoJU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "modulefodge.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "modulefodge",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "modulefodge.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "548620534200",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:548620534200:web:30240fb4d8e0894dd98f4d"
};

// Initialize Firebase (singleton pattern to avoid reinitialization)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
