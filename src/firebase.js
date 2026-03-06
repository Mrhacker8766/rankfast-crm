import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Simple check to see if we have the minimum required config
export const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

if (!isConfigValid) {
    console.error('❌ Firebase configuration is invalid or missing! Check your .env file or Vercel environment variables.');
}


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
