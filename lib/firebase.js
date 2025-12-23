// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBSM4sFuV8ph5HETHUSCgJ4g8eKNjYtpEc",
  authDomain: "qrbasedattendacesystem.firebaseapp.com",
  databaseURL: "https://qrbasedattendacesystem-default-rtdb.firebaseio.com",
  projectId: "qrbasedattendacesystem",
  storageBucket: "qrbasedattendacesystem.firebasestorage.app",
  messagingSenderId: "80920245560",
  appId: "1:80920245560:web:812f8082d0b7221bbcbdcd",
  measurementId: "G-0BXHB0BQF8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Analytics (only in browser environment)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}
export { analytics };

export default app;
