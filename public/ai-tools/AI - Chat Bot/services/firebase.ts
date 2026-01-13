import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { getFirestore } from 'firebase/firestore';

// NOTE: In a real environment, use process.env for these values.
// For this demo, we use a placeholder or assume the user injects the config.
const firebaseConfig = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {
  // Fallback/Placeholder config to prevent crash if not provided
  apiKey: "PLACEHOLDER_API_KEY",
  authDomain: "placeholder.firebaseapp.com",
  projectId: "placeholder-project",
  storageBucket: "placeholder.appspot.com",
  messagingSenderId: "000000000",
  appId: "1:00000000:web:00000000"
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== "PLACEHOLDER_API_KEY";

const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export const db = getFirestore(app);
export const appId = 'highlife-auto-crm';