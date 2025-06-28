
import { initializeApp, getApps, getApp } from "firebase/app";

// Your web app's Firebase configuration is now read from environment variables
// for better security and flexibility.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
// To prevent re-initializing on hot reloads in development,
// we check if an app has already been initialized.
let app;

// Check that all required environment variables are present before initializing
if (
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} else {
  console.error("Firebase configuration is incomplete. Please check your environment variables.");
}


export { app };
