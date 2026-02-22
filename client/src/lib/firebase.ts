import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase client config is public by design — safe to hardcode
const firebaseConfig = {
  apiKey: "AIzaSyC0lwcSGmiztkWNZFVEpABUk2EJF0ODOW8",
  authDomain: "earn2die-91ae5.firebaseapp.com",
  projectId: "earn2die-91ae5",
  storageBucket: "earn2die-91ae5.firebasestorage.app",
  messagingSenderId: "1063264758184",
  appId: "1:1063264758184:web:9bda1c3bbbfa3d9f2dd59d",
};

export const firebaseConfigured = true;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
