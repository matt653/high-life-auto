import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { getFirestore } from 'firebase/firestore';

// NOTE: In a real environment, use import.meta.env for these values.
// We fallback to Gemini Key for API Key if specific Firebase key is missing, as they are often the same in simple GCP setups.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "PLACEHOLDER_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "placeholder.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "placeholder-project",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "placeholder.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:00000000:web:00000000"
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== "PLACEHOLDER_API_KEY";

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = getFirestore(firebase.app());
export const appId = 'highlife-auto-crm';
