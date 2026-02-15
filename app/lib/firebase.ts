import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC-pyGPEGhrYMkzRJCsxYDTr5Y_lfRQ4v4",
  authDomain: "medleads-uk.firebaseapp.com",
  projectId: "medleads-uk",
  storageBucket: "medleads-uk.firebasestorage.app",
  messagingSenderId: "454483217898",
  appId: "1:454483217898:web:cc1904a008a5160bb2f693",
  measurementId: "G-RVRFRQE1TC"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(console.error);
}

export { auth, db, googleProvider, analytics };
