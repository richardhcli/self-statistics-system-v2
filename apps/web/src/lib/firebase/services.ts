import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Optional: Force account selection every time
//googleProvider.setCustomParameters({ prompt: 'select_account' });
