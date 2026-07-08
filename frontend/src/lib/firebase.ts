import { FirebaseApp, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let initFailed = false;

export function getFirebaseAuth(): Auth | null {
  if (authInstance) return authInstance;
  if (initFailed) return null;

  const hasKey = !!import.meta.env.VITE_FIREBASE_API_KEY;
  if (!hasKey) {
    initFailed = true;
    return null;
  }

  try {
    app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    return authInstance;
  } catch {
    initFailed = true;
    return null;
  }
}

if (typeof window !== "undefined") {
  const missing: string[] = [];
  if (!import.meta.env.VITE_FIREBASE_API_KEY) missing.push("VITE_FIREBASE_API_KEY");
  if (!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) missing.push("VITE_FIREBASE_AUTH_DOMAIN");
  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) missing.push("VITE_FIREBASE_PROJECT_ID");
  if (!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) missing.push("VITE_FIREBASE_STORAGE_BUCKET");
  if (!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) missing.push("VITE_FIREBASE_MESSAGING_SENDER_ID");
  if (!import.meta.env.VITE_FIREBASE_APP_ID) missing.push("VITE_FIREBASE_APP_ID");
  if (missing.length) {
    console.warn("Firebase config: missing env vars —", missing.join(", "));
  }
}
