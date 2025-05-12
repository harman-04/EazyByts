// src/utils/firebase.js
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging'; // For client-side API

// IMPORTANT: Get YOUR Firebase Project configuration from Firebase Console:
// Go to Project settings (gear icon) -> General -> Your apps -> Select your Web app -> Firebase SDK snippet -> Config
const firebaseConfig = {
  apiKey: "your key",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase Messaging instance



export const messaging = getMessaging(app);




// Export firebaseConfig itself for the service worker (which uses it)
export { firebaseConfig };

