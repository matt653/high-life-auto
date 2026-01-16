
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// NOTE: In a real environment, use process.env for these values.
// For this demo, we use a placeholder or assume the user injects the config.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isPlaceholder = (value) => {
    return !value || value.includes('00000000') || value.startsWith('1:00000000');
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey &&
    !isPlaceholder(firebaseConfig.appId) &&
    !isPlaceholder(firebaseConfig.messagingSenderId);

// Initialize only if not already initialized
let app;
try {
    if (isFirebaseConfigured) {
        app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
    } else {
        console.warn("Firebase config contains placeholders or is missing. Firebase features will be disabled.");
    }
} catch (e) {
    console.error("Firebase Initialization Failed:", e);
    // Fallback Mock App or handle gracefully? 
    // Usually better to leave it undefined so dependent code fails noticeably or checks isFirebaseConfigured
    // But since we export db/auth/storage, we need them to be safe to import.
}

// Export safe instances or nulls
// We need to use a getter or proxy if we want to support access-before-init, but for now:
export const auth = app ? firebase.auth() : null;
// Use getFirestore(app) only if app exists
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export const appId = 'highlife-auto-crm';
