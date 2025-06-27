
import { initializeApp, getApps, getApp } from "firebase/app";

// IMPORTANT: For security, move this configuration to environment variables
// See: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
const firebaseConfig = {
  apiKey: "AIzaSyDsU-WMvIqHXyOvmKyLicvOk2sGkkJiT54",
  authDomain: "udaaro-t09m0.firebaseapp.com",
  projectId: "udaaro-t09m0",
  storageBucket: "udaaro-t09m0.firebasestorage.app",
  messagingSenderId: "990367703477",
  appId: "1:990367703477:web:d6353876e56b2ce95539fc"
};

// Initialize Firebase
// To prevent re-initializing on hot reloads in development,
// we check if an app has already been initialized.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export { app };
