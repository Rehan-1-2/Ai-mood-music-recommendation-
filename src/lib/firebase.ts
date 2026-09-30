import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const firestoreDatabaseId = (firebaseConfig as any).firestoreDatabaseId;

const getDb = () => {
  try {
    return firestoreDatabaseId
      ? initializeFirestore(app, { experimentalForceLongPolling: true }, firestoreDatabaseId)
      : initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch {
    return firestoreDatabaseId ? getFirestore(app, firestoreDatabaseId) : getFirestore(app);
  }
};

export const db = getDb();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

