// src/services/firebase.ts
// DISABLED: Firebase integration is optional for this app
// The app uses localStorage-based statistics instead
// To enable Firebase later, install 'firebase' package and uncomment the imports below

// import { initializeApp, FirebaseApp } from 'firebase/app';
// import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
// import { getAuth, Auth } from 'firebase/auth';

// Firebase Configuration
// IMPORTANT: Diese Werte müssen in einer .env Datei konfiguriert werden
// Beispiel .env:
// VITE_FIREBASE_API_KEY=your-api-key
// VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
// VITE_FIREBASE_PROJECT_ID=your-project-id
// VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
// VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
// VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
//   appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
// };

/**
 * Initialisiert Firebase App und Firestore mit Offline Persistence
 * Wird nur einmal aufgerufen
 * DISABLED: Returns null - Firebase is optional
 */
export function initializeFirebase(): null {
  console.log('ℹ️ Firebase ist deaktiviert. Verwende localStorage für Statistiken.');
  return null;
}

/**
 * Gibt die Firestore Instanz zurück
 * DISABLED: Returns null
 */
export function getDb(): null {
  return null;
}

/**
 * Gibt die Auth Instanz zurück
 * DISABLED: Returns null
 */
export function getFirebaseAuth(): null {
  return null;
}

/**
 * Prüft ob Firebase konfiguriert und verfügbar ist
 * DISABLED: Always returns false
 */
export function isFirebaseAvailable(): boolean {
  return false;
}
