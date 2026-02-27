import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from "firebase/analytics";

/**
 * Firebase configuration.
 * 
 * Public: The Firebase "public" API key is used to identify your project to Google services and 
 * is not a secret credential that needs hiding; access to data is controlled by Firebase Security Rules. 

 */
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBljfgY4PY2cxy3rYAzSAUYa2b4-PRF1TA",
  authDomain: "self-statistics-system-v2.firebaseapp.com",
  projectId: "self-statistics-system-v2",
  storageBucket: "self-statistics-system-v2.firebasestorage.app",
  messagingSenderId: "694246828476",
  appId: "1:694246828476:web:564ea4550d8c6a68bca3b9",
  measurementId: "G-CRN9HWE33Y"
};

// 1. Initialize the core app
const app = initializeApp(firebaseConfig);

// 2. Initialize the specific services
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Optional: Force account selection every time
//googleProvider.setCustomParameters({ prompt: 'select_account' });



// 3. THE ENVIRONMENT SWITCH
// Vite automatically sets import.meta.env.DEV to true ONLY when running `vite`
if (import.meta.env.DEV) {
  console.info("🛠️ DEV MODE: Routing Firebase traffic to local emulators...");
  
  // Note: Use '127.0.0.1' instead of 'localhost' to prevent IPv6 resolution bugs
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  
  // Auth emulator requires the http:// prefix
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
}
